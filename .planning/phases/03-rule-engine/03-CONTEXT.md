# Phase 3: Rule Engine - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement 7 deterministic cross-module pattern rules (R1–R7) that accept a `CrossModuleSnapshot` and return a typed `RuleInsight` or null. No persistence, no UI, no LLM — pure logic layer. Each rule is independently invocable and testable.

</domain>

<decisions>
## Implementation Decisions

### RuleInsight Type Contract
- Three severity levels: `"critical" | "warning" | "info"`
- Evidence field: human-readable string (e.g., "3 hot leads stalled, runway at 42 days") — simple to generate and display; Phase 5 LLM can use it as context
- Module tags: string array `["sales", "finance"]` — maps directly to the 3 modules, used by Phase 6 for `/nudges?module=sales` filtering
- Rule ID field: `rule_id: "R1"` (required, not optional) — enables content-addressed deduplication in Phase 4 (INFRA-02) and aids debugging

### "Hot Lead" Definition
- Primary signal: pipeline stage (not AI score) — deterministic, works even if AI scoring hasn't run
- Hot stages: `qualified`, `contacted`, `demo`, `proposal`, `negotiation` — excludes `new` (unqualified) and `won`/`lost`/`nurture` (resolved)
- Shared helper: `isHotLead(lead)` used by both R1 and R7 — single source of truth
- R7 "no reply" detection: uses `Lead.last_contact_at` — if null or > 48 hours ago for a hot-stage lead, R7 fires

### Rule Thresholds (from REQUIREMENTS.md — treat as locked for v1)
- R1: runway < 60 days AND hot leads exist
- R2: runway < 90 days AND open hire roles exist
- R3: deals close AND candidates advance simultaneously
- R4: no invoices sent in 14 days AND no leads marked won
- R5: candidate pipeline stalls 7+ days AND capacity gap exists
- R6: large invoice overdue AND upcoming payroll cost
- R7: multiple hot leads AND no reply sent in 48 hours

### Claude's Discretion
- File organization (one file per rule vs. single rules.ts)
- Severity assignment per rule (e.g., whether R1 is always `critical` or dynamic)
- How to detect "candidate pipeline stall" given Candidate type only has `status: "pending" | "analyzed" | "reviewed"` (no time-in-stage — likely use `created_at` or `applied_at`)
- How to handle `runway_months` → days conversion (RunwayData uses months, rules use day thresholds)
- Exact definition of "deals close" and "candidates advance simultaneously" for R3

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Lead` (lib/sales-types.ts): canonical Supabase type — use `status`, `deal_value`, `last_contact_at` (NOT the mock-data.ts `Lead` which uses `stage`, `value`, `lastContact`)
- `RunwayData` (lib/finance-types.ts): `runway_months` field — rules need to convert to days (multiply by ~30)
- `Invoice` (lib/finance-types.ts): `status: "odendi" | "beklemede" | "gecmis"` — "gecmis" = overdue, "beklemede" = pending
- `Candidate` (lib/hiring-types.ts): `status: "pending" | "analyzed" | "reviewed"`, `applied_at`, `created_at`
- `Role` (lib/hiring-types.ts): `active: boolean` — open roles signal capacity gap for R2/R5

### Established Patterns
- Existing AI eval routes (lib/claude-eval.ts, lib/claude-sales-eval.ts) return typed objects — rule engine should follow same return pattern
- No existing rule/intelligence utilities — this phase creates the first ones

### Integration Points
- Rule engine consumes `CrossModuleSnapshot` defined in Phase 2 — field names must match Phase 2's output
- Rule engine output (`RuleInsight[]`) feeds directly into Phase 4 persistence pipeline
- STATE.md blocker: verify Supabase column names match Lead type field names before shipping (mock Lead in mock-data.ts uses different names than canonical sales-types.ts Lead)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-rule-engine*
*Context gathered: 2026-03-15*
