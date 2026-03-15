# Phase 7: Dashboard Intelligence Feed - Research

**Researched:** 2026-03-15
**Domain:** React/Next.js UI component — intelligence feed card with Supabase-backed API integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Feed placement on the dashboard**
- Position: full-width row below LeadPipeline/FounderStories, above where ComingSoon was
- Section label: small uppercase header matching existing style (`text-xs font-medium text-text-muted uppercase tracking-wider`) — label "Cross-Module Intelligence" or similar
- Remove the ComingSoonAgents section entirely — intelligence feed is the new bottom section
- Inside the feed: narrative header card sits above rule insight cards; rule cards arranged in a horizontal scroll row

**Insight card layout**
- Narrative card: rendered at the top, visually elevated/distinct from rule cards
- Rule insight cards: horizontal scroll row beneath the narrative card
- Each rule card shows: severity badge (critical/warning/info), freshness timestamp, evidence explanation, dismiss button
- Cards use the `AgentCardWrapper` component pattern consistent with existing agents

**Refresh UX**
- Button label: "Refresh"
- On click: POST /api/intelligence/trigger (202 Accepted), immediately replace cards with skeleton placeholders, wait 3 seconds, then re-fetch GET /api/intelligence/insights
- Loading state during the 3s window: skeleton cards replace existing insight cards (not an overlay, not just spinner-on-button)
- AgentCardWrapper status switches to "running" during the skeleton window

**Initial load behavior**
- On mount: fetch GET /api/intelligence/insights immediately — show whatever the last cron run produced
- No auto-trigger on page load
- Rationale: avoid surprise Claude API costs on every page visit

**Dismiss behavior**
- Clicking dismiss calls POST /api/intelligence/dismiss immediately
- Returns 204 No Content on success — remove card client-side on 204
- No explicit rollback design needed (single-user app)

**Empty state (DASH-07)**
- Shown when GET /insights returns zero active insights
- Clear message (e.g., "No cross-module patterns detected") rather than blank area

### Claude's Discretion
- Exact skeleton card dimensions and animation style
- Exact section label text ("Cross-Module Intelligence" or similar)
- Narrative card visual treatment (border, background, icon) vs. rule cards
- Severity badge color mapping (e.g., critical → red, warning → amber, info → blue)
- Error state if GET /insights fails

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Central intelligence feed on home dashboard shows insight cards from cross_module_insights | Feed component fetches GET /api/intelligence/insights on mount; renders cards inside col-span-full row |
| DASH-02 | Each insight card displays severity level (critical/warning/info) with visual badge | Badge uses accent color tokens: accent-red (critical), accent-amber (warning), accent-blue (info) |
| DASH-03 | Each insight card shows freshness timestamp ("generated X minutes ago") | `generated_at` field from CrossModuleInsight; compute relative time from Date.now() |
| DASH-04 | User can dismiss/acknowledge individual insight cards | POST /api/intelligence/dismiss with `{ id: string }`, 204 response triggers client-side removal |
| DASH-05 | Each insight card shows evidence explanation ("why this?" with supporting data points) | `evidence` field from CrossModuleInsight; displayed as readable text on each rule card |
| DASH-06 | User can manually trigger re-analysis via refresh button | POST /api/intelligence/trigger returns 202; skeleton placeholder for 3s; then re-fetch |
| DASH-07 | Empty state shown when no cross-module patterns are detected | Conditional render when insights array is empty after fetch |
| DASH-08 | Intelligence feed extends existing agent card pattern (AgentCardWrapper) | Wrap feed in AgentCardWrapper; status prop drives header, Refresh button drives onRun |
</phase_requirements>

---

## Summary

Phase 7 is a pure UI composition phase. All backend infrastructure (database table, rule engine, LLM narrative generation, API routes) was completed in Phases 4–6. This phase creates two new React components: `IntelligenceFeed` (the section-level wrapper) and `InsightCard` (per-insight display), integrates them into `app/page.tsx` in place of `ComingSoonAgents`, and wires them to the three Phase 6 API endpoints.

The dominant technical challenge is the refresh UX: the 3-second skeleton window requires coordinating async state (trigger POST fires, local state switches to "running"/skeleton, setTimeout triggers re-fetch, state returns to loaded). All other interactions (mount fetch, dismiss) are straightforward single-fetch operations with optimistic UI.

The `CrossModuleInsight` type is already defined in `lib/intelligence-types.ts`. The API response shape (sorted array from GET /insights) is confirmed from reading the live route code. No new backend work is required.

**Primary recommendation:** Build `IntelligenceFeed` as a single `"use client"` component containing all state; extract `InsightCard` as a pure display child component passed `insight` and `onDismiss` props.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.4 | Component model, state, effects | Project standard; all agents use useState/useEffect |
| Next.js | ^16.1.6 | App router, client components | Project framework |
| lucide-react | ^0.577.0 | Icons (Brain, RefreshCw, X, AlertCircle, Info) | Used in every agent component |
| tailwindcss | ^4.2.1 | Utility classes, design tokens | Project CSS framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx / cn() | via tailwind-merge | Conditional class merging | All conditional className expressions |

### No New Dependencies
This phase requires zero new npm packages. Every tool needed (React hooks, Lucide icons, cn utility, fetch API) is already installed.

**Installation:**
```bash
# Nothing to install
```

---

## Architecture Patterns

### Recommended Project Structure
```
components/
└── intelligence/
    ├── intelligence-feed.tsx    # "use client" — all state, data fetching
    └── insight-card.tsx         # Pure display — props: insight, onDismiss
app/
└── page.tsx                     # Import IntelligenceFeed, remove ComingSoonAgents
```

### Pattern 1: Client Component with Mount Fetch (established project pattern)
**What:** `"use client"` component using `useState` + `useEffect` + `useCallback`. Fetch on mount, no auto-retry.
**When to use:** All agent components in this project follow this pattern exactly.
**Example (from chief-of-staff.tsx):**
```typescript
// Source: components/agents/chief-of-staff.tsx (project code)
"use client";
import { useState, useEffect, useCallback } from "react";

export default function IntelligenceFeed() {
  const [insights, setInsights] = useState<CrossModuleInsight[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | undefined>(undefined);

  const fetchInsights = useCallback(async () => {
    const res = await fetch("/api/intelligence/insights");
    if (!res.ok) throw new Error("Failed to fetch insights");
    const data: CrossModuleInsight[] = await res.json();
    setInsights(data);
  }, []);

  useEffect(() => {
    fetchInsights().catch((err) => setError(err.message));
  }, [fetchInsights]);
  // ...
}
```

### Pattern 2: Skeleton Loading (from chief-of-staff.tsx)
**What:** `animate-pulse` divs with `bg-surface-hover` replace content area during loading.
**When to use:** The 3-second refresh window per CONTEXT.md decisions.
**Example:**
```typescript
// Source: components/agents/chief-of-staff.tsx (project code)
{status === "running" && (
  <div className="flex gap-3 overflow-x-auto pb-2">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="flex-shrink-0 w-64 h-32 rounded-xl bg-surface-elevated/30 animate-pulse"
      >
        <div className="p-4 space-y-3">
          <div className="h-3 bg-surface-hover rounded w-1/3" />
          <div className="h-3 bg-surface-hover rounded w-full" />
          <div className="h-3 bg-surface-hover rounded w-5/6" />
        </div>
      </div>
    ))}
  </div>
)}
```

### Pattern 3: AgentCardWrapper Integration
**What:** Wrap the entire feed in `AgentCardWrapper` with `onRun` prop for Refresh button.
**When to use:** DASH-08 requires AgentCardWrapper pattern; also gives free header, status dot, and run button.
**Key insight:** AgentCardWrapper's `onRun` prop renders the button automatically. When `status === "running"` the button disables itself with a spinner — no extra code needed.

```typescript
// Source: components/agents/agent-card-wrapper.tsx (project code)
<AgentCardWrapper
  agentId="intelligence-feed"
  agentName="Cross-Module Intelligence"
  icon={<Brain className="w-5 h-5 text-accent-orange" />}
  status={status}
  lastRun={lastRun}
  onRun={handleRefresh}
>
  {/* feed content */}
</AgentCardWrapper>
```

### Pattern 4: Refresh Flow with Timed Re-fetch
**What:** POST trigger → set running → setTimeout 3s → re-fetch.
**When to use:** The CONTEXT.md mandated Refresh UX.

```typescript
// Derived from CONTEXT.md decisions + project async patterns
const handleRefresh = useCallback(async () => {
  setStatus("running");
  setError(null);
  try {
    await fetch("/api/intelligence/trigger", { method: "POST" });
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await fetchInsights();
    setLastRun(new Date().toISOString());
    setStatus("success");
  } catch (err) {
    setError(err instanceof Error ? err.message : "Refresh failed");
    setStatus("error");
  }
}, [fetchInsights]);
```

### Pattern 5: Optimistic Dismiss
**What:** Remove card from local state on 204; no rollback.
**When to use:** DASH-04.

```typescript
const handleDismiss = useCallback(async (id: string) => {
  const res = await fetch("/api/intelligence/dismiss", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (res.status === 204) {
    setInsights((prev) => prev.filter((ins) => ins.id !== id));
  }
}, []);
```

### Pattern 6: Narrative vs Rule Card Split
**What:** Filter the `insights` array by `rule_id === "LLM"` for the narrative card, everything else for rule cards.
**When to use:** CONTEXT.md mandates narrative card above rule card row.

```typescript
const narrativeInsight = insights.find((ins) => ins.rule_id === "LLM") ?? null;
const ruleInsights = insights.filter((ins) => ins.rule_id !== "LLM");
```

### Pattern 7: Freshness Timestamp
**What:** Compute human-readable relative time from `generated_at` ISO string.
**When to use:** DASH-03.

```typescript
function formatFreshness(generatedAt: string): string {
  const diffMs = Date.now() - new Date(generatedAt).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}
```

### Severity Badge Color Mapping (Claude's Discretion — Recommended)
| Severity | Color Token | Example Class |
|----------|-------------|---------------|
| critical | accent-red | `bg-accent-red/10 text-accent-red border-accent-red/20` |
| warning | accent-amber | `bg-accent-amber/10 text-accent-amber border-accent-amber/20` |
| info | accent-blue | `bg-accent-blue/10 text-accent-blue border-accent-blue/20` |

This matches the `sectionAccents` pattern in chief-of-staff.tsx (border colors per type) and the error state pattern (`bg-accent-red/5 text-accent-red border border-accent-red/10`).

### Recommended page.tsx Replacement
Replace the `col-span-full stagger-7` block currently rendering ComingSoonAgents:

```typescript
// REMOVE:
<div className="col-span-full opacity-0 animate-fade-in stagger-7 mt-2">
  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
    More agents coming soon
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <ComingSoonAgents />
  </div>
</div>

// ADD:
<div className="col-span-full opacity-0 animate-fade-in stagger-7 mt-2">
  <IntelligenceFeed />
</div>
```

Note: The section label ("Cross-Module Intelligence") belongs inside `IntelligenceFeed` as the `agentName` prop to `AgentCardWrapper`, not as a separate `<h3>` outside. This keeps the component self-contained.

### Anti-Patterns to Avoid
- **Auto-triggering on mount:** Do NOT call POST /trigger on page load. CONTEXT.md explicitly prohibits this to avoid Claude API costs. Fetch GET /insights only.
- **Fetching inside InsightCard:** All data fetching belongs in `IntelligenceFeed`. `InsightCard` receives props only.
- **Awaiting the trigger pipeline:** POST /trigger returns 202 immediately (fire-and-forget). Never await pipeline completion — use the fixed 3s delay per CONTEXT.md.
- **Rollback on dismiss failure:** CONTEXT.md explicitly states no rollback needed. Keep dismiss simple.
- **Separate section `<h3>` label:** CONTEXT.md says use the `AgentCardWrapper` pattern. The label comes from `agentName` prop, not a standalone heading.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status dot + run button header | Custom header component | AgentCardWrapper | Already built, tested, visually consistent |
| CSS skeleton animation | Custom keyframes | `animate-pulse` (Tailwind) | Built-in, identical to chief-of-staff pattern |
| Conditional class merging | String concatenation | `cn()` from `@/lib/utils` | Handles edge cases, project standard |
| Icon set | SVG files | lucide-react | Already installed, tree-shakeable |
| Relative time formatting | date-fns or dayjs | Inline helper function | Simple enough; no date library installed |

**Key insight:** The UI pattern (AgentCardWrapper + skeleton + error state) is so well-established in this codebase that most of the "hard" work is already done. The challenge is composition, not invention.

---

## Common Pitfalls

### Pitfall 1: 204 Response Has No JSON Body
**What goes wrong:** Calling `await res.json()` on a 204 response throws a SyntaxError and the card is not removed.
**Why it happens:** 204 No Content means the response body is empty by design (see dismiss route).
**How to avoid:** Check `res.status === 204` directly; do not call `.json()`.
**Warning signs:** Console error "Unexpected end of JSON input" after clicking dismiss.

### Pitfall 2: Stale Closure in setTimeout
**What goes wrong:** `fetchInsights` inside `setTimeout` captures a stale reference, fetches nothing, or ignores updated state.
**Why it happens:** If `handleRefresh` is not wrapped in `useCallback` with correct deps, the closure captured at call time may not have current state.
**How to avoid:** Define `fetchInsights` with `useCallback`, include it in `handleRefresh`'s deps array.
**Warning signs:** After refresh, insights appear stale or don't update.

### Pitfall 3: LLM insight missing `rule_id === "LLM"` field
**What goes wrong:** Narrative card never renders because the filter `rule_id === "LLM"` matches nothing.
**Why it happens:** The schema shows `rule_id text NOT NULL` — value is "LLM" for narrative rows (confirmed in claude-narrative.ts tests). But if cron hasn't run or narrative generation failed (returns empty string guard), no LLM row exists.
**How to avoid:** The narrative card should gracefully render `null` when no LLM insight exists — not an error state.
**Warning signs:** Narrative card area blank but rule cards display correctly.

### Pitfall 4: Horizontal Scroll Clipping
**What goes wrong:** Rule card row clips or overflows the parent card container unexpectedly.
**Why it happens:** Parent has `overflow: hidden` (the `.card` class uses `border-radius: 14px` but no overflow hidden — safe). However a wrapping `div` might clip.
**How to avoid:** Apply `overflow-x-auto` on the scroll row wrapper div, `pb-2` for scrollbar clearance, `flex-shrink-0` on each card to prevent compression.

### Pitfall 5: Missing `"use client"` Directive
**What goes wrong:** Component using `useState`/`useEffect` errors with "useState is not a function" at runtime.
**Why it happens:** `app/page.tsx` is already `"use client"`, but child components in `components/` must declare it independently.
**How to avoid:** `IntelligenceFeed` and `InsightCard` must both start with `"use client"`.

### Pitfall 6: Import Not Removed for ComingSoonAgents
**What goes wrong:** TypeScript or lint warning about unused import after removing the component from page.tsx.
**Why it happens:** Removing JSX usage but forgetting the `import` statement.
**How to avoid:** Remove both the JSX usage and the import line for `ComingSoonAgents` in page.tsx.

---

## Code Examples

### CrossModuleInsight Type (already exists)
```typescript
// Source: lib/intelligence-types.ts
export interface CrossModuleInsight extends InsightCandidate {
  id: string;                   // SHA256 content-addressed key
  generated_at: string;         // ISO timestamp
  dismissed_at: string | null;
  created_at: string;           // ISO timestamp
}

export type InsightSeverity = "critical" | "warning" | "info";
```

### GET /api/intelligence/insights Response Shape
```typescript
// Source: app/api/intelligence/insights/route.ts
// Returns: CrossModuleInsight[] sorted by severity (critical → warning → info)
// then by created_at DESC within each tier (JS stable sort preserves DB order)
// Filtered: dismissed_at IS NULL only
```

### POST /api/intelligence/dismiss Contract
```typescript
// Source: app/api/intelligence/dismiss/route.ts
// Request:  POST { id: string }
// Success:  204 No Content (empty body — do NOT call .json())
// Not found: 404 { error: "Insight not found" }
// Bad body:  400 { error: "Request body must be { id: string }" }
```

### POST /api/intelligence/trigger Contract
```typescript
// Source: app/api/intelligence/trigger/route.ts
// Request:  POST (no body required)
// Response: 202 { running: true }
// Pipeline runs async — caller never awaits completion
```

### Error State Pattern (from chief-of-staff.tsx)
```typescript
// Source: components/agents/chief-of-staff.tsx
{error && (
  <div className="p-3 rounded-xl bg-accent-red/5 text-accent-red text-sm border border-accent-red/10 mb-4">
    {error}
  </div>
)}
```

### Stagger Animation (from app/page.tsx)
```typescript
// Source: app/page.tsx
<div className="col-span-full opacity-0 animate-fade-in stagger-7 mt-2">
  {/* stagger-7 = 0.40s delay */}
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ComingSoonAgents bottom section | IntelligenceFeed replaces it | Phase 7 | Feed becomes the "final agent" row |
| No cross-module UI | Central insight feed with severity badges | Phase 7 | User can see AI-detected patterns at a glance |

**Deprecated/outdated in this phase:**
- `ComingSoonAgents` component: remove import and JSX from page.tsx. The component file itself can stay in the repo (it may be used elsewhere or restored) — just remove it from the dashboard.

---

## Open Questions

1. **Does `rule_id` field exist on the API response rows?**
   - What we know: `CrossModuleInsight` extends `InsightCandidate` which has `rule_id: string`. The DB schema confirms `rule_id text NOT NULL`. GET /insights does `select("*")`.
   - What's unclear: None — `rule_id` is in the SELECT *.
   - Recommendation: HIGH confidence — use `ins.rule_id === "LLM"` to split narrative from rule cards.

2. **What happens if GET /insights returns a 500?**
   - What we know: CONTEXT.md gives Claude discretion on error state design.
   - What's unclear: Whether to show a dismissable error banner or just the error card.
   - Recommendation: Follow existing chief-of-staff pattern — `bg-accent-red/5` error div inside the AgentCardWrapper, `status="error"` on the wrapper.

3. **Is the `generated_at` vs `created_at` field the right one for freshness display?**
   - What we know: Schema has both. `generated_at` is set explicitly by the pipeline; `created_at` defaults to `now()`. They are nearly identical on insert.
   - Recommendation: Use `generated_at` for freshness display — it's semantically "when this insight was computed".

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run lib/__tests__/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

This phase is pure UI (React client components). The project's Vitest setup uses `environment: "node"` — it is not configured for DOM/jsdom testing. All DASH-01 through DASH-08 requirements are verified by:
1. Manual browser verification (primary validation path)
2. TypeScript type-safety at compile time (type errors = broken contract)
3. Existing server-side tests for API routes already passing

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Feed renders, calls GET /api/intelligence/insights on mount | manual | — | N/A |
| DASH-02 | Severity badges render with correct color per severity value | manual | — | N/A |
| DASH-03 | Freshness timestamp renders relative time from generated_at | manual | — | N/A |
| DASH-04 | Dismiss calls POST /dismiss, removes card on 204 | manual | — | N/A |
| DASH-05 | Evidence text from insight.evidence displays on card | manual | — | N/A |
| DASH-06 | Refresh calls POST /trigger, shows skeleton 3s, re-fetches | manual | — | N/A |
| DASH-07 | Empty state message shown when insights array is empty | manual | — | N/A |
| DASH-08 | AgentCardWrapper wraps feed with correct status/onRun props | TypeScript compile | `npx tsc --noEmit` | ❌ Wave 0 |

**Rationale for manual-only UI tests:** The Vitest config uses `environment: "node"` — React component rendering requires jsdom/happy-dom. Adding a DOM test environment for a single UI phase is a larger change than the phase warrants. TypeScript compilation catches prop contract errors. Manual browser verification is the designated validation path for UI phases in this project.

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (catches type errors in new components and page.tsx changes)
- **Per wave merge:** `npx vitest run` (full server-side suite stays green)
- **Phase gate:** Full suite green + manual browser verification before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No new test files needed — UI components tested manually; TypeScript is the compile-time guard
- [ ] Confirm `npx tsc --noEmit` passes before starting Wave 1

*(No test infrastructure changes required — existing vitest.config.ts and lib/__tests__/ cover all server-side code; UI components are manually verified.)*

---

## Sources

### Primary (HIGH confidence)
- Directly read source files in this repo:
  - `components/agents/agent-card-wrapper.tsx` — AgentCardWrapper API, status values, onRun behavior
  - `components/agents/chief-of-staff.tsx` — skeleton pattern, error state, mount fetch pattern
  - `app/page.tsx` — grid layout, stagger classes, ComingSoonAgents placement
  - `app/api/intelligence/insights/route.ts` — GET response shape, sort order
  - `app/api/intelligence/trigger/route.ts` — 202 fire-and-forget behavior
  - `app/api/intelligence/dismiss/route.ts` — 204 no-content behavior, 400/404 error codes
  - `lib/intelligence-types.ts` — CrossModuleInsight, InsightSeverity types
  - `supabase/migrations/20260315000000_create_cross_module_insights.sql` — schema: rule_id, generated_at, dismissed_at
  - `app/globals.css` — design tokens, animation classes, .card CSS

### Secondary (MEDIUM confidence)
- `.planning/phases/07-dashboard-intelligence-feed/07-CONTEXT.md` — locked decisions, discretion areas

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed by reading all relevant source files
- Architecture: HIGH — directly derived from existing project patterns in the codebase
- API contracts: HIGH — confirmed by reading live route implementations
- Pitfalls: HIGH — derived from actual code (204 no-body, useCallback deps, rule_id filter)
- UI validation: HIGH — node-only vitest confirmed, manual verification is the correct approach

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable Next.js/React codebase; no fast-moving dependencies in scope)
