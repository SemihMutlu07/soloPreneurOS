# Phase 5: LLM Orchestrator - Research

**Researched:** 2026-03-15
**Domain:** Anthropic SDK (TypeScript) — narrative generation, model selection, cron integration, failure isolation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Narrative tone & purpose**
- Audience framing: "The founder as CEO" — reads like a daily briefing from a trusted advisor, not a status report or alarm bell
- Purpose: synthesize the rule findings that fired into a coherent story — not open-ended Claude pattern discovery
- Structure: 2 sentences — sentence 1 synthesizes what the rules found, sentence 2 ends with an actionable nudge (a suggested next step)
- Relationship to rule cards on the dashboard: the narrative is the executive summary / header above the rule insight cards — visually elevated, a distinct insight type (e.g., `type: "narrative"`)

**LLM invocation trigger**
- Conditional: only invoke Claude when at least one rule insight fired during this cron run
- Severity threshold: none — even if all fired insights are info-level, still generate a narrative
- Exactly one narrative per cron run — content-addressed ID prevents duplicates on double-runs
- Manual refresh (Phase 7 dashboard button) triggers a full re-run: rules + LLM narrative both re-execute; fresh narrative replaces old one

**Failure handling**
- Claude's Discretion: if the API call fails, rule-generated insights persist normally and the narrative is silently skipped — no cron data lost

### Claude's Discretion

- Model selection: Sonnet (`claude-sonnet-4-20250514`) vs Haiku for cost on this lighter narrative task (flagged in STATE.md)
- Exact SHA256 content-addressed ID implementation for the narrative insight
- Prompt wording and system prompt structure
- Exact field values for the narrative insight row (severity, module_tags)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LLM-01 | Claude generates a 2-sentence narrative summary synthesizing cross-module state after rules run | Anthropic SDK `messages.create()` pattern established in `lib/claude-eval.ts` and `lib/claude-sales-eval.ts`; narrative call returns plain text (not JSON) |
| LLM-02 | Narrative summary uses summarized module context (counts and key metrics), not raw records | CrossModuleSnapshot from Phase 2 provides already-aggregated counts/totals; prompt construction extracts only scalar fields |
</phase_requirements>

---

## Summary

Phase 5 extends the intelligence cron endpoint (delivered by Phase 4) with a single additional step: after the rule engine runs and insights are persisted, invoke Claude with a compact summary of metrics to produce a 2-sentence narrative. The narrative is inserted into `cross_module_insights` using the same upsert pattern as rule insights, distinguished by `rule_id: 'LLM'` and a `type`-equivalent field. The entire LLM call is wrapped in try/catch so any Claude API failure is swallowed silently — rule insights are already persisted at that point and are unaffected.

The project already has two working Anthropic SDK call sites (`lib/claude-eval.ts` and `lib/claude-sales-eval.ts`) that establish all the patterns needed. This phase creates a third call site, `lib/claude-narrative.ts`, following the same structure but simpler: no JSON output format required, no regex extraction, just plain text trimmed to the 2-sentence output. The cron extension is one additional function call added after the rule persist loop in the Phase 4 cron handler.

The key model choice (Sonnet vs Haiku) now has a verified answer: the existing codebase uses `claude-sonnet-4-20250514` (a legacy model still available), and the current cheapest Haiku is `claude-haiku-4-5-20251001` at $1/$5 per MTok vs $3/$15 for Sonnet. For a 2-sentence generation on a small input, Haiku 4.5 is appropriate.

**Primary recommendation:** Create `lib/claude-narrative.ts` following the established SDK pattern, extend the Phase 4 cron handler with a conditional post-rule LLM step wrapped in try/catch, and use `claude-haiku-4-5-20251001` for cost efficiency.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | 0.78.0 (installed) | Anthropic API client | Already installed; used in claude-eval.ts and claude-sales-eval.ts |
| Node.js `crypto` | built-in | SHA256 content-addressed ID for narrative | No dependency needed; same approach as rule insights in Phase 4 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `claude-haiku-4-5-20251001` | current | Lightweight narrative generation | Small prompt, bounded output, cost-sensitive cron task |
| `claude-sonnet-4-20250514` | legacy (still available) | Fallback if Haiku output quality insufficient | Only if narrative quality requires it |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `claude-haiku-4-5-20251001` | `claude-sonnet-4-20250514` | Sonnet produces higher-quality prose but costs 3x more per MTok; for a 2-sentence daily digest on a tiny input, Haiku is adequate |

**No additional installation needed.** `@anthropic-ai/sdk` is already in `package.json`.

---

## Architecture Patterns

### Recommended File Structure

```
lib/
├── claude-eval.ts           # existing — candidate eval (JSON output)
├── claude-sales-eval.ts     # existing — lead eval (JSON output)
└── claude-narrative.ts      # NEW — narrative synthesis (plain text output)

app/api/cron/
└── run-intelligence/
    └── route.ts             # Phase 4 delivered; Phase 5 extends with LLM step
```

### Pattern 1: Anthropic SDK Call — Plain Text Output

The existing call sites return JSON. The narrative call returns plain text. This simplifies the implementation: no regex extraction, no JSON parse, just `response.content[0].text.trim()`.

**What:** Call `anthropic.messages.create()` with a system prompt instructing the model to produce exactly 2 sentences, and a user message containing the metrics summary derived from `CrossModuleSnapshot`.

**When to use:** Any time a natural language output (not structured data) is needed from Claude.

**Example (mirrors existing patterns):**
```typescript
// Pattern source: lib/claude-eval.ts + lib/claude-sales-eval.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const response = await anthropic.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 256,           // 2 sentences needs ~60-80 tokens; 256 is safe ceiling
  system: NARRATIVE_SYSTEM_PROMPT,
  messages: [{ role: "user", content: metricsText }],
});

const narrative = response.content[0].type === "text"
  ? response.content[0].text.trim()
  : "";
```

### Pattern 2: Conditional LLM Invocation in Cron

Only invoke Claude when at least one rule insight fired. This prevents wasting tokens on a "no patterns found" run and aligns with the locked decision.

```typescript
// After rule persist loop in run-intelligence/route.ts
const firedInsights = insights.filter(i => i !== null);

if (firedInsights.length > 0) {
  try {
    const narrative = await generateNarrative(snapshot, firedInsights);
    await upsertNarrativeInsight(supabase, narrative, calendarDate);
    result.narrative_generated = true;
  } catch (err) {
    // Silent skip — rule insights already persisted above
    const message = err instanceof Error ? err.message : "Unknown error";
    result.errors.push(`Narrative generation skipped: ${message}`);
  }
}
```

### Pattern 3: Content-Addressed ID for Narrative

One narrative per calendar day. ID = SHA256(`LLM-<calendar_date>`).

```typescript
import { createHash } from "crypto";

function narrativeId(calendarDate: string): string {
  return createHash("sha256").update(`LLM-${calendarDate}`).digest("hex");
}
```

On re-run or manual refresh, the upsert replaces the narrative text (`evidence` column) while preserving `dismissed_at` — same upsert semantics as rule insights.

### Pattern 4: Metrics-Only Prompt Input (satisfies LLM-02)

Extract only scalar counts and totals from `CrossModuleSnapshot` — never pass raw lead/invoice arrays. This keeps the prompt small and token usage bounded.

```typescript
function buildMetricsText(
  snapshot: CrossModuleSnapshot,
  firedInsights: RuleInsight[]
): string {
  return [
    `Business metrics snapshot:`,
    `- Hot leads in pipeline: ${snapshot.hotLeadCount}`,
    `- Runway: ${snapshot.runwayDays} days`,
    `- Open roles: ${snapshot.openRoleCount}`,
    `- Overdue invoices: ${snapshot.overdueInvoiceCount}`,
    `- Days since last invoice sent: ${snapshot.daysSinceLastInvoice}`,
    ``,
    `Rule patterns that fired today:`,
    ...firedInsights.map(i => `- [${i.severity.toUpperCase()}] ${i.evidence}`),
  ].join("\n");
}
```

### Pattern 5: Narrative Insight Row in cross_module_insights

The schema (delivered by Phase 4) already accommodates the narrative row without alteration. Use:
- `id`: SHA256(`LLM-<YYYY-MM-DD>`)
- `rule_id`: `"LLM"`
- `severity`: `"info"` (narrative is always info-level; it synthesizes, not alarms)
- `module_tags`: `["sales", "finance", "hire"]` (cross-module by nature)
- `evidence`: the 2-sentence narrative text

The dashboard (Phase 7) distinguishes narrative from rule insights by checking `rule_id === 'LLM'`.

### Anti-Patterns to Avoid

- **Passing raw arrays to the prompt:** Never pass `snapshot.leads` or `snapshot.invoices` arrays into the prompt — extract counts only. Raw arrays can be thousands of tokens and blow the token budget.
- **Throwing on LLM failure:** The LLM step must be in its own try/catch that does NOT re-throw. A Claude API failure (rate limit, network, model error) must not cause the cron to return 500 and lose rule insights.
- **Generating narrative when no rules fired:** The conditional guard `firedInsights.length > 0` is required; calling Claude to narrate "nothing happened" wastes tokens and produces useless output.
- **Using streaming:** No streaming anywhere in this codebase. Use `await messages.create()` only.
- **Using `max_tokens` > 512:** For a 2-sentence output, 256 is a safe ceiling. Higher values waste quota.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP client for Anthropic API | Custom fetch wrapper | `@anthropic-ai/sdk` (already installed) | SDK handles retries, auth headers, streaming, error types |
| SHA256 hashing | Custom hash function | Node.js `crypto.createHash('sha256')` | Built-in, zero dependencies |
| Content-addressed dedup | Custom timestamp comparison | SHA256 ID + Supabase upsert ON CONFLICT | Already established in Phase 4 — reuse the same pattern |

**Key insight:** This phase is almost entirely composition — it wires together three already-built components (SDK, CrossModuleSnapshot, cross_module_insights upsert) with minimal new code.

---

## Common Pitfalls

### Pitfall 1: Wrong Model ID

**What goes wrong:** Using the placeholder `claude-haiku-3-5` (invalid) or the old `claude-3-haiku-20240307` (deprecated, retires April 19, 2026).

**Why it happens:** STATE.md explicitly flagged this as MEDIUM confidence. The correct current Haiku model ID is `claude-haiku-4-5-20251001` (alias: `claude-haiku-4-5`).

**How to avoid:** Use the verified ID from official Anthropic docs: `claude-haiku-4-5-20251001`.

**Warning signs:** API 404 or "model not found" error on first test run.

### Pitfall 2: LLM Failure Kills Rule Insights

**What goes wrong:** The narrative `await` throws, bubbles up to the outer cron try/catch, and the endpoint returns 500. Rule insights were already upserted but the response signals failure — logs may trigger alerts.

**Why it happens:** Forgetting the inner try/catch around the LLM step. The outer cron error handler exists for the data fetch/rule phase, not for the optional LLM step.

**How to avoid:** Always wrap the `generateNarrative` call in its own try/catch. Accumulate the error in `result.errors[]` but do not rethrow.

### Pitfall 3: Duplicate Narratives from Double-Runs

**What goes wrong:** Cron runs twice (e.g., manual refresh + scheduled), producing two narrative rows for the same day.

**Why it happens:** Using `INSERT` instead of upsert, or generating a non-deterministic ID (timestamp-based rather than content-addressed).

**How to avoid:** ID = SHA256(`LLM-<YYYY-MM-DD>`). Supabase upsert with `ON CONFLICT (id) DO UPDATE SET evidence = EXCLUDED.evidence, generated_at = now()`. Identical to the Phase 4 rule dedup pattern.

### Pitfall 4: Narrative Prompt Returns More Than 2 Sentences

**What goes wrong:** Claude produces 3-4 sentences or includes preamble ("Here is your summary:").

**Why it happens:** System prompt does not strongly constrain output format.

**How to avoid:** System prompt must explicitly say: "Respond with exactly 2 sentences and nothing else. No preamble, no labels, no markdown." Test with an example snapshot before shipping.

### Pitfall 5: Prompt Contains Raw Arrays

**What goes wrong:** The prompt becomes 2,000+ tokens because `snapshot.leads` (50 records) is serialized into the message.

**Why it happens:** Passing the full snapshot object instead of extracting metrics.

**How to avoid:** The `buildMetricsText()` helper (see Architecture Patterns) extracts only scalar counts. The fired insights are summarized by their evidence strings — not the raw rule objects. This is also required by LLM-02.

---

## Code Examples

Verified patterns from existing project sources:

### Anthropic SDK Initialization (source: lib/claude-eval.ts)
```typescript
// No config needed — reads ANTHROPIC_API_KEY from environment automatically
const anthropic = new Anthropic();
```

### messages.create() Call (source: lib/claude-eval.ts)
```typescript
const response = await anthropic.messages.create({
  model: "claude-haiku-4-5-20251001",   // verified from official docs 2026-03-15
  max_tokens: 256,
  system: systemPrompt,
  messages: [{ role: "user", content: userMessage }],
});
const text = response.content[0].type === "text" ? response.content[0].text : "";
```

### CRON_SECRET Bearer Auth (source: app/api/cron/evaluate-leads/route.ts)
```typescript
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

### Error Accumulator Pattern (source: app/api/cron/evaluate-leads/route.ts)
```typescript
const result = { processed: 0, errors: [] as string[] };
// ...
try {
  // per-item work
} catch (err) {
  const message = err instanceof Error ? err.message : "Unknown error";
  result.errors.push(`Lead ${lead.id}: ${message}`);
}
return NextResponse.json(result);
```

### SHA256 Content-Addressed ID (Node built-in)
```typescript
import { createHash } from "crypto";
const id = createHash("sha256").update(`LLM-${calendarDate}`).digest("hex");
```

### Supabase Upsert for Narrative Row
```typescript
const { error } = await supabase
  .from("cross_module_insights")
  .upsert({
    id: narrativeId,
    rule_id: "LLM",
    severity: "info",
    module_tags: ["sales", "finance", "hire"],
    evidence: narrativeText,
    generated_at: new Date().toISOString(),
  }, { onConflict: "id" });
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `claude-3-haiku-20240307` | `claude-haiku-4-5-20251001` | Haiku 4.5 released ~Oct 2025; Haiku 3 deprecated, retires April 19, 2026 | Must use new ID — old model will stop accepting requests |
| `claude-3-5-haiku-20241022` | `claude-haiku-4-5-20251001` | Haiku 3.5 retired February 19, 2026 | 3.5 Haiku no longer available |
| `claude-sonnet-4-20250514` | Still available as legacy | Not deprecated | Can continue using; `claude-sonnet-4-6` is current but either works |

**Deprecated/outdated:**
- `claude-haiku-3-5` (placeholder in STATE.md): Does not correspond to any real model ID — was never valid. The correct model IDs use a different format (`claude-3-5-haiku-20241022` was the real 3.5 Haiku).
- `claude-3-haiku-20240307`: Deprecated, retires April 19, 2026. Do not use.
- `claude-3-5-haiku-20241022`: Retired February 19, 2026. No longer available.

---

## Open Questions

1. **`dismissed_at` preservation on narrative upsert**
   - What we know: Phase 4 established that upserts should preserve `dismissed_at` (the upsert pattern updates `generated_at`/`severity`/`evidence` but does not overwrite a non-null `dismissed_at`)
   - What's unclear: Whether this should be handled at the SQL level (`DO UPDATE SET ... WHERE dismissed_at IS NULL`) or at the application layer (read first, check, then write)
   - Recommendation: Use application-layer check (read current row, skip update of `dismissed_at` field) for simplicity — consistent with the Phase 4 approach. Supabase `upsert` with `onConflict: 'id'` will overwrite all provided fields including potentially resurrecting a dismissed narrative. The safest implementation reads the existing row first and conditionally updates.

2. **Narrative severity value**
   - What we know: The schema constrains severity to `critical / warning / info`. The narrative is a synthesis, not an alarm.
   - What's unclear: Whether to always use `"info"` or derive from the highest-severity rule that fired.
   - Recommendation: Always use `"info"` — the narrative is an executive summary, not an escalation signal. Dashboard (Phase 7) elevates it visually by `rule_id === 'LLM'`, not by severity.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed — Wave 0 must add Vitest |
| Config file | `vitest.config.ts` — does not exist yet (Wave 0) |
| Quick run command | `npx vitest run lib/claude-narrative.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LLM-01 | `generateNarrative()` returns a non-empty string when given valid snapshot + fired insights | unit | `npx vitest run lib/claude-narrative.test.ts` | Wave 0 |
| LLM-01 | `generateNarrative()` returns empty string / null when no insights fired | unit | `npx vitest run lib/claude-narrative.test.ts` | Wave 0 |
| LLM-01 | Cron handler returns 200 and `narrative_generated: true` when rules fire | integration (manual) | manual — requires live Anthropic key | N/A |
| LLM-02 | `buildMetricsText()` produces output with no raw arrays (only scalar fields) | unit | `npx vitest run lib/claude-narrative.test.ts` | Wave 0 |
| LLM-01 | API failure in `generateNarrative()` does not throw to caller (try/catch isolation) | unit | `npx vitest run lib/claude-narrative.test.ts` | Wave 0 |

Note: The Anthropic API call itself cannot be unit-tested without mocking. Unit tests should mock `anthropic.messages.create` and verify the wrapper logic (conditional guard, error isolation, return shape). The actual model output quality is validated manually.

### Sampling Rate

- **Per task commit:** `npx vitest run lib/claude-narrative.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `lib/claude-narrative.test.ts` — covers LLM-01, LLM-02 (mock Anthropic SDK)
- [ ] `vitest.config.ts` — framework config for Next.js project
- [ ] Framework install: `npm install --save-dev vitest @vitest/coverage-v8` — no test runner currently installed

---

## Sources

### Primary (HIGH confidence)

- Anthropic Official Models Overview (`https://platform.claude.com/docs/en/about-claude/models/overview`) — verified current model IDs March 15 2026; confirmed `claude-haiku-4-5-20251001` is the current Haiku model at $1/$5 per MTok; confirmed `claude-haiku-3-5` is not a real model ID; confirmed Haiku 3.5 retired February 19, 2026
- Project source: `lib/claude-eval.ts` — establishes Anthropic SDK call pattern used in this project
- Project source: `lib/claude-sales-eval.ts` — establishes field validation and plain-text extraction pattern
- Project source: `app/api/cron/evaluate-leads/route.ts` — establishes CRON_SECRET auth and error accumulator pattern
- Project source: `package.json` — confirms `@anthropic-ai/sdk@0.78.0` installed; no test framework installed

### Secondary (MEDIUM confidence)

- Phase 4 CONTEXT.md — establishes content-addressed dedup pattern, upsert semantics, `cross_module_insights` schema, and dismissed_at preservation requirement

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — SDK version confirmed from package.json; model IDs verified from official Anthropic docs accessed March 15, 2026
- Architecture: HIGH — patterns copied directly from existing project call sites
- Pitfalls: HIGH — model ID pitfall verified from official deprecation docs; other pitfalls derived from existing code patterns

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (model IDs stable; Haiku 4.5 is current generation)
