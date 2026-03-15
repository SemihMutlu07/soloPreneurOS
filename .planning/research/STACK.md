# Technology Stack: Cross-Module AI Intelligence Layer

**Project:** soloPreneurOS — Cross-Module Intelligence Milestone
**Researched:** 2026-03-15
**Scope:** New libraries and patterns needed to add a hybrid rules+LLM insight engine on top of the existing Next.js 16 + Supabase + Claude API stack.

> This file documents additions and extensions only. The existing stack (Next.js 16.1.6, @anthropic-ai/sdk 0.78.0, @supabase/supabase-js 2.99.1, Tailwind CSS 4.x, TypeScript 5.9.3) is already in place and not reconsidered here.

---

## Recommended Stack for the Intelligence Layer

### LLM Orchestration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @anthropic-ai/sdk | 0.78.0 (existing) | Cross-module Claude calls | Already in the codebase; use the same `new Anthropic()` pattern from claude-sales-eval.ts. No new LLM client needed. |
| Structured output via JSON prompt + regex strip | n/a (pattern, not library) | Parse Claude responses | The existing codebase already uses `text.match(/\{[\s\S]*\}/)` — extend this pattern, do not add Zod or a schema-validation library just for Claude output at this scale. |

**Confidence:** HIGH — based on direct codebase evidence.

**Do NOT add:** LangChain, LlamaIndex, or any LLM orchestration framework. The codebase calls Claude directly with a well-structured prompt pattern. For a single-user solopreneur tool with 3 modules, adding a framework creates dependency weight (LangChain is 15+ MB) with zero benefit — the orchestration logic is trivial hand-written TypeScript.

**Do NOT add:** Vercel AI SDK. It adds value for streaming chat UIs; this milestone is about proactive insight generation in cron jobs and API routes, not a chat interface. The PROJECT.md explicitly defers conversational AI.

---

### Rule Engine

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Hand-written TypeScript rules module | n/a | Detect known cross-module patterns cheaply | The rule set for this app is small (10-20 rules covering lead/invoice/hiring/finance correlations). A dedicated rule engine library (json-rules-engine, nools, node-rules) adds 100KB+ and a DSL to learn. TypeScript functions with typed inputs are simpler, easier to test, and faster. |

**Pattern:** Create `lib/intelligence/rules.ts` with pure functions shaped like:

```typescript
// Example shape — each rule is a named function returning InsightEvent | null
type RuleContext = { leads: SalesLead[]; invoices: Invoice[]; candidates: Candidate[]; finance: FinanceStats };
type InsightEvent = { type: string; severity: 'critical' | 'warning' | 'info'; title: string; body: string; modules: string[] };

function detectLowRunwayWithOpenHires(ctx: RuleContext): InsightEvent | null { ... }
function detectStaleHighValueLead(ctx: RuleContext): InsightEvent | null { ... }
```

**Confidence:** HIGH — this is a deliberate choice against adopting a dependency, not a gap in research. Rule libraries solve a team-scale maintainability problem that doesn't exist for a single-developer solopreneur tool.

---

### Insight Pipeline (Orchestration Pattern)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js API route as pipeline entry point | existing | `/api/intelligence/run` cron endpoint | Matches existing cron pattern exactly — same bearer-token auth, same Supabase admin client, same batch-and-store pattern as `/api/cron/evaluate-leads`. Zero new infrastructure. |
| Supabase PostgreSQL | existing | Persist generated insights | Store insights in a new `insights` table. Queried by the dashboard and each module for contextual nudges. |
| Vercel Cron (vercel.json) | existing | Schedule pipeline runs | Already configured for `scan-gmail` and `evaluate-leads`. Add a 30-minute or hourly `intelligence/run` cron job. |

**Pipeline shape:**

```
Cron fires → /api/intelligence/run
  1. Data collector: Fetch leads, candidates, invoices, finance from Supabase + localStorage bridge
  2. Rule engine: Run all rules against collected context → produces rule-based InsightEvents[]
  3. LLM analysis (batched): If new events or staleness threshold exceeded → single Claude call with full cross-module snapshot → produces novel InsightEvents[]
  4. Deduplication: Compare against existing unread insights in Supabase → discard duplicates
  5. Persist: INSERT new insights into `insights` table
  6. Return: { generated: N, skipped: N }
```

**Confidence:** HIGH — directly extends the existing evaluation pipeline pattern.

---

### Unified Data Access Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `lib/intelligence/data-collector.ts` (new module) | n/a | Aggregate data from all 3 modules | Encapsulates the heterogeneity: Supabase for Sales+Hire, localStorage for Finance. The pipeline calls one function and gets a `CrossModuleSnapshot`. |
| Supabase admin client | existing | Server-side module data fetch | Already used in cron routes — use `createAdminClient()` for leads and candidates. |
| Finance localStorage bridge via API route | n/a (pattern) | Expose Finance data server-side | Finance currently only exists in client localStorage. Create `GET /api/finance/snapshot` that reads query params or accepts a POST body with the serialized finance state. The intelligence dashboard page can push finance state to this endpoint before triggering analysis, OR migrate Finance to Supabase (preferred — see below). |

**Critical decision — Finance data storage:**
The biggest technical constraint for the intelligence layer is that Finance lives in localStorage. Two options:

1. **Migrate Finance to Supabase** (recommended): Add an `invoices` and `expenses` table. The Finance-OS page writes to Supabase instead of localStorage. The intelligence pipeline can then read Finance server-side cleanly. This is the right call for correctness — localStorage data is invisible to crons.

2. **Client-push pattern**: The intelligence dashboard page serializes Finance from localStorage and POSTs it to `/api/intelligence/run` alongside the trigger. More complex, breaks the clean server-side pipeline.

**Recommendation: Migrate Finance to Supabase as part of this milestone.** The data model is already fully typed in `lib/finance-types.ts`. The migration is straightforward.

**Confidence:** HIGH — constraint identified from direct codebase inspection (`app/architecture`, localStorage patterns in finance components).

---

### Insight Caching Strategy

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase `insights` table | existing infrastructure | Persist and serve generated insights | Insights are generated async by cron, not on-demand. UI reads from the table. This is pull-from-cache, not generate-on-request. |
| `generated_at` + `expires_at` columns | n/a (schema) | Staleness tracking | Each insight has a TTL. The pipeline skips LLM calls if insights are fresh (< 30 minutes old). Rule-based insights can regenerate every cycle; LLM insights every N cycles to control cost. |
| `read_at` column | n/a (schema) | Dismissal tracking | User dismisses an insight → `read_at` is set → dashboard filters it out. Prevents alert fatigue. |

**Do NOT use:** Redis, Upstash, or any external caching service. For a single-user tool running on Vercel with Supabase already in the stack, Supabase rows ARE the cache. Redis adds operational complexity with no throughput benefit at this scale.

**Do NOT use:** Next.js `unstable_cache` or React cache APIs for insight data. Insights are async-generated by crons, not SSR-generated. The right pattern is async generation → Supabase → read on demand.

**Confidence:** HIGH — scale assessment (single user, polling model explicitly chosen in PROJECT.md constraints) makes this clear.

---

### Claude API Cost Control

| Strategy | Implementation | Why |
|----------|---------------|-----|
| Batch cross-module context into a single Claude call | One `messages.create()` per pipeline run with full snapshot | The existing per-item pattern (one Claude call per lead/candidate) is correct for individual evaluations. For cross-module analysis, a single call with a structured JSON snapshot is cheaper and produces better correlations. |
| Threshold gating | Only call Claude if: data changed since last run OR last LLM insight > 4 hours old | Rule engine runs every cycle; Claude only when stale or data is genuinely new. |
| Model selection | `claude-haiku-3-5` for rule-confirming/summary tasks; `claude-sonnet-4-20250514` (existing) for novel pattern discovery | Haiku is ~10x cheaper per token. Simple "summarize this cross-module state" tasks don't need Sonnet. Sonnet is already used in the codebase — keep it for high-value analysis. |
| Max tokens cap | 1024 tokens for insight generation | Cross-module insights are short (title + 2-3 sentence body). The existing evaluations use 800-2048 tokens. 1024 is right-sized for insight cards. |

**Confidence:** MEDIUM — model names and pricing tier relationships (Haiku vs Sonnet) based on training knowledge as of August 2025. Verify current model IDs against Anthropic docs before shipping.

---

### Insight Data Schema (Supabase)

```sql
CREATE TABLE insights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  type        TEXT NOT NULL,           -- e.g. 'low_runway_with_open_hire', 'stale_high_value_lead'
  source      TEXT NOT NULL,           -- 'rule' | 'llm'
  severity    TEXT NOT NULL,           -- 'critical' | 'warning' | 'info'
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  modules     TEXT[] NOT NULL,         -- ['sales', 'finance'] — which modules this spans
  metadata    JSONB,                   -- arbitrary supporting data (lead_id, invoice_id, etc.)
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  read_at     TIMESTAMPTZ
);

CREATE INDEX insights_user_unread ON insights (user_id, read_at) WHERE read_at IS NULL;
```

**Confidence:** HIGH — derived from PROJECT.md requirements and existing schema patterns.

---

## Alternatives Considered and Rejected

| Category | Recommended | Alternative Rejected | Why Rejected |
|----------|-------------|---------------------|--------------|
| LLM orchestration | Direct @anthropic-ai/sdk | LangChain / LlamaIndex | Adds 15+ MB dependency for orchestration this codebase does with 20 lines of TypeScript. No RAG, no tool-calling chains needed. |
| LLM orchestration | Direct @anthropic-ai/sdk | Vercel AI SDK | Optimized for streaming chat UIs. This milestone explicitly defers conversational AI (PROJECT.md). |
| Rule engine | Hand-written TypeScript functions | json-rules-engine | Adds DSL learning curve and dependency for <20 rules. TypeScript functions are typesafe, testable, readable. |
| Caching | Supabase rows | Redis / Upstash | Single user, polling model. Adding Redis means a new service, new env vars, new failure mode. No throughput need justifies it. |
| Finance data | Migrate to Supabase | Keep in localStorage + client push | localStorage is invisible to server-side crons. Cross-module intelligence requires all data to be server-accessible. |
| Insight scheduling | Vercel Cron (existing) | BullMQ / Inngest | Single-user tool. Queue infrastructure for a solopreneur app adds DevOps overhead with no parallelism benefit. Vercel Cron is already proven in this codebase. |
| Structured output | Regex JSON strip (existing pattern) | Zod + structured output API | Anthropic's structured output API (tool-use forced JSON) is worth using if response shape is complex. For insight generation, the existing prompt-and-strip pattern is sufficient. Consider Zod only if validation errors become frequent. |

---

## New Packages Required

Only one package is confidently recommended as a true new addition:

```bash
# No new production dependencies recommended.
# The intelligence layer is built entirely from:
# - @anthropic-ai/sdk (existing)
# - @supabase/supabase-js (existing)
# - TypeScript standard library
# - Hand-written modules in lib/intelligence/
```

If Finance migration to Supabase requires a date handling library (for tax deadline calculations currently done manually), `date-fns` is the standard choice:

```bash
npm install date-fns   # only if Finance migration needs date arithmetic beyond what exists
```

**Confidence for date-fns:** MEDIUM — it's the established standard for date utilities in TypeScript/Node projects. The existing Finance types use ISO strings, so it may not be needed at all.

---

## New Files to Create

| File | Purpose |
|------|---------|
| `lib/intelligence/types.ts` | `InsightEvent`, `CrossModuleSnapshot`, `RuleContext` types |
| `lib/intelligence/data-collector.ts` | Fetches all module data into `CrossModuleSnapshot` |
| `lib/intelligence/rules.ts` | All typed rule functions, exported as `ALL_RULES: Rule[]` |
| `lib/intelligence/llm-analyzer.ts` | Single Claude call for novel pattern discovery |
| `lib/intelligence/pipeline.ts` | Orchestrates collector → rules → LLM → dedup → persist |
| `app/api/intelligence/run/route.ts` | Cron endpoint calling `pipeline.run()` |
| `app/api/intelligence/insights/route.ts` | GET endpoint for dashboard to read current insights |
| `app/api/finance/snapshot/route.ts` | Bridge endpoint if Finance stays in localStorage (avoid if migrating) |

---

## Sources

- Codebase evidence: Direct inspection of `lib/claude-sales-eval.ts`, `app/api/cron/evaluate-leads/route.ts`, `lib/finance-types.ts`, `app/api/agents/daily-ops/route.ts`, `.planning/codebase/ARCHITECTURE.md`
- PROJECT.md constraints: "Extend existing stack, no new frameworks"; "batch and cache insights, don't call per-render"; "polling/cron sufficient for insight freshness"
- Existing patterns: Evaluation pipeline (`cron/evaluate-leads`), agent card caching (localStorage + timestamp), bearer-token cron auth

**Confidence notes:**
- Architecture decisions: HIGH (based on codebase + explicit PROJECT.md constraints)
- Claude model names: MEDIUM (training data Aug 2025; verify `claude-haiku-3-5` exists vs `claude-haiku-3-20241022` at implementation time)
- No external web sources consulted (tools unavailable); all recommendations grounded in codebase evidence and PROJECT.md
