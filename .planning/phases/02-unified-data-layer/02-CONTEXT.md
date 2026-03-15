# Phase 2: Unified Data Layer - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the `CrossModuleSnapshot` type and a single aggregator function that reads all three modules from Supabase into one typed object. No UI, no Claude calls, no rule logic — pure data fetching and normalization. The snapshot is the sole interface between raw data and all downstream intelligence logic (rules, LLM, cron).

</domain>

<decisions>
## Implementation Decisions

### Data Scope — Sales
- Pull **active leads only**: status NOT IN `['won', 'lost']`
- Include **recent LeadActivity**: last 30 days (needed for R7 no-reply-in-48hrs and R4 no-wins-recently)
- Do NOT dump full lead history — keeps snapshot lean and rules fast

### Data Scope — Hiring
- Pull **active candidates only**: status `pending` or `analyzed`
- Candidates come joined with their evaluations (recommendation field needed for pipeline quality rules R2, R5)
- Do NOT include decided/rejected candidates

### Data Scope — Finance
- Pull **last 90 days of invoices and expenses**
- Include a **pre-computed `RunwayData` object** — aggregator reads the stored runway values from Supabase; it does not recompute from raw records
- Rules use `runway_months` directly without arithmetic

### Partial Failure — Module Query Fails
- Return a **partial snapshot with null for the failed module** (e.g. `finance: null`)
- Cron run completes with whatever data is available — a Finance DB hiccup does not block Sales+Hire insights
- No retries at the aggregator level (keep it simple)

### Partial Failure — Module Returns Zero Records
- Return **empty arrays and null metrics**: `finance: { invoices: [], expenses: [], runway: null }`
- Empty is not an error — rules that need Finance data simply don't fire
- No sentinel values; empty arrays are the contract

### Partial Failure — Error Visibility
- `CrossModuleSnapshot` includes an **`errors: string[]` field**
- Aggregator appends a message per failed module (e.g. `"finance: query failed — timeout"`)
- Cron route logs this array; Phase 4 can surface data vintage warnings from it

### Rule Null-Guard Pattern
- Each rule function starts with a **null-check on its required module**: `if (!snapshot.finance) return null`
- Rules never read `errors[]` — they just check module presence
- Aggregator always returns a fully-shaped snapshot object (never throws); failed modules are `null`, empty modules are `{ ..., data: [] }`

### Claude's Discretion
- Exact Supabase query structure (joins vs separate calls)
- Whether to use `Promise.all` or sequential fetches internally
- Specific date range anchor (e.g. `new Date()` vs `Date.now()` for the 90-day window)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/supabase/admin.ts` → `createAdminClient()`: This is the client the aggregator uses — already has service role access, matches the cron pattern
- `lib/finance-types.ts` → `Invoice`, `Expense`, `RunwayData`, `FinanceStats`: Types are fully defined and ready to compose into the snapshot
- `lib/sales-types.ts` → `Lead`, `LeadActivity`, `PipelineStage`: `Lead.status` is the filter field for active-only query
- `lib/hiring-types.ts` → `Candidate`, `Evaluation`, `CandidateWithEvaluation`: Join interface already exists

### Established Patterns
- All existing cron routes use `createAdminClient()` for privileged Supabase access — aggregator follows this exact pattern
- Error handling pattern: try/catch per operation, collect errors in array, continue — matches existing `evaluate-leads` cron
- TypeScript interfaces defined in `lib/*-types.ts` files — new `CrossModuleSnapshot` and `Insight` types go in `lib/intelligence/types.ts`

### Integration Points
- `lib/intelligence/types.ts` (new): Defines `CrossModuleSnapshot`, `Insight`, `RuleContext` — consumed by rule engine (Phase 3) and LLM orchestrator (Phase 5)
- `lib/intelligence/data-aggregator.ts` (new): Exports the aggregator function — called by intelligence cron route (Phase 4)
- Phase 1 Finance migration must complete first — aggregator reads Finance from Supabase, not localStorage

</code_context>

<specifics>
## Specific Ideas

- The `errors: string[]` field on the snapshot doubles as a data freshness signal — Phase 4 can include it in the cron response and Phase 7 can display a "partial data" warning on the feed if present
- `CandidateWithEvaluation` from `lib/hiring-types.ts` is the right shape for the hiring snapshot field — no new type needed for that join

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-unified-data-layer*
*Context gathered: 2026-03-15*
