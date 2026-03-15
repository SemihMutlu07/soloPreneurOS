---
phase: 03-rule-engine
plan: "02"
subsystem: api
tags: [typescript, intelligence, rule-engine, tdd, finance, sales, hire]

requires:
  - phase: 03-rule-engine
    plan: "01"
    provides: "lib/intelligence/types.ts with CrossModuleSnapshot, RuleInsight, isHotLead"

provides:
  - "checkR1RunwayHotLeads — critical alert: runway < 60 days AND hot leads in pipeline"
  - "checkR2HireRunway — warning: runway < 90 days AND active hiring roles"
  - "checkR3DealsCandidates — info: won deal + reviewed candidate simultaneously within 7 days"
  - "checkR4RevenueSilence — warning: no invoices in 14 days AND no won leads"

affects:
  - 03-03-rule-engine-r5-r7
  - 04-insights-schema-and-cron (rule-engine.ts integration)

tech-stack:
  added: []
  patterns:
    - "Rule functions import only from lib/intelligence/types.ts — no direct module-type imports"
    - "Null-guard as first statement — all rules return null for missing module snapshots"
    - "runway_months * 30 = runway days — integer floor used for evidence strings"
    - "applied_at as proxy for candidate advancement (R3 v1 limitation — documented inline)"
    - "Days since last invoice via reduce on created_at (R4)"

key-files:
  created:
    - lib/intelligence/rules/r1-runway-hot-leads.ts
    - lib/intelligence/rules/r1-runway-hot-leads.test.ts
    - lib/intelligence/rules/r2-hire-runway.ts
    - lib/intelligence/rules/r2-hire-runway.test.ts
    - lib/intelligence/rules/r3-deals-candidates.ts
    - lib/intelligence/rules/r3-deals-candidates.test.ts
    - lib/intelligence/rules/r4-revenue-silence.ts
    - lib/intelligence/rules/r4-revenue-silence.test.ts
  modified: []

key-decisions:
  - "R1 severity is critical (runway + hot leads = cash-flow emergency signal)"
  - "R2 severity is warning (hiring costs runway — concerning but not yet critical)"
  - "R3 uses applied_at as proxy for candidate advancement — Candidate type has no reviewed_at; v1 limitation documented in source"
  - "R4 reports 14 days when invoice list is empty (minimum threshold) rather than a synthetic large number"
  - "R3 boundary is exclusive: updated_at must be strictly greater than (now - 7d) to qualify"

duration: 3min
completed: 2026-03-15
---

# Phase 03 Plan 02: Rules R1-R4 Cross-Module Detectors Summary

**R1-R4 rule functions with full TDD test suites — Finance+Sales and Finance+Hire cross-module pattern detectors covering cash runway, pipeline, hiring, and revenue silence**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-15T12:39:15Z
- **Completed:** 2026-03-15T12:42:15Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files created:** 8 (4 rule files + 4 test files)

## Accomplishments

- Wrote 49 failing tests across 4 test suites covering all behavior cases (RED phase)
- Implemented R1 (critical, Finance+Sales), R2 (warning, Finance+Hire), R3 (info, Sales+Hire), R4 (warning, Finance+Sales) (GREEN phase)
- All 4 rules return null without throwing when any required module snapshot is null
- R3 documents the applied_at proxy limitation with an inline implementation comment
- TypeScript compiles clean, 49/49 tests pass

## Task Commits

TDD committed in two atomic phases:

1. **RED: Failing tests** — `c3bd59a` (test)
2. **GREEN: Implementations** — `b7e1ce6` (feat)

## Files Created

- `lib/intelligence/rules/r1-runway-hot-leads.ts` — R1: runway < 60d + hot leads, severity critical
- `lib/intelligence/rules/r1-runway-hot-leads.test.ts` — 13 test cases
- `lib/intelligence/rules/r2-hire-runway.ts` — R2: runway < 90d + active roles, severity warning
- `lib/intelligence/rules/r2-hire-runway.test.ts` — 11 test cases
- `lib/intelligence/rules/r3-deals-candidates.ts` — R3: won leads + reviewed candidates within 7d, severity info
- `lib/intelligence/rules/r3-deals-candidates.test.ts` — 11 test cases
- `lib/intelligence/rules/r4-revenue-silence.ts` — R4: no invoices 14d + no won leads, severity warning
- `lib/intelligence/rules/r4-revenue-silence.test.ts` — 13 test cases

## Decisions Made

- **R1 severity = critical:** Cash runway at sub-60-day level with active pipeline leads is a cash-flow emergency signal requiring immediate action.
- **R2 threshold = 90 days (not 60):** Hiring commitments are forward-looking costs. A higher threshold gives more lead time to pause hiring before runway becomes critical.
- **R3 applied_at proxy:** The `Candidate` type only has `applied_at`, not a `reviewed_at` or `updated_at` field. Using `applied_at` as a proxy for "candidate advancing recently" is an accepted v1 limitation, documented inline.
- **R4 empty-invoice case:** When no invoices exist, `daysSinceLastInvoice` is set to 14 (the threshold minimum) rather than computing a synthetic "infinity." This produces a stable, valid evidence string without requiring special casing downstream.
- **R3 boundary exclusive:** `updated_at > (now - 7d)` — a record at exactly 7 days ago does not qualify. Consistent with "last 7 days" semantics.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all types aligned with what Plan 01 established. The `CrossModuleSnapshot` field names (`hire`, `recent_activity`, `generated_at`) established in Plan 01 matched the expected contract.

## User Setup Required

None.

## Next Phase Readiness

- Plans 03-02 exports (`checkR1RunwayHotLeads`, `checkR2HireRunway`, `checkR3DealsCandidates`, `checkR4RevenueSilence`) are ready for import in the rule engine orchestrator
- Plan 03-03 (R5-R7) follows the same structural pattern: null-guard + condition check + RuleInsight return
- Phase 4 cron can call these rule functions via `runRuleEngine` once Plan 03-03 is complete

## Self-Check

Files exist:
- lib/intelligence/rules/r1-runway-hot-leads.ts — FOUND
- lib/intelligence/rules/r2-hire-runway.ts — FOUND
- lib/intelligence/rules/r3-deals-candidates.ts — FOUND
- lib/intelligence/rules/r4-revenue-silence.ts — FOUND

---
*Phase: 03-rule-engine*
*Completed: 2026-03-15*
