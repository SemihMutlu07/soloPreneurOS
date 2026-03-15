---
phase: 02-unified-data-layer
plan: 02
subsystem: database
tags: [supabase, vitest, typescript, intelligence, cross-module, aggregator]

# Dependency graph
requires:
  - phase: 02-01
    provides: "CrossModuleSnapshot, SalesSnapshot, HireSnapshot, FinanceSnapshot types + vitest infrastructure"
provides:
  - "buildCrossModuleSnapshot() exported from lib/intelligence/data-aggregator.ts — sole Supabase read interface for all intelligence logic"
  - "fetchSalesModule: active leads (positive-include) + 30-day activities"
  - "fetchHiringModule: pending/analyzed candidates + evaluations + active roles"
  - "fetchFinanceModule: 90-day invoices/expenses + non-fatal runway query"
  - "6 passing unit tests covering all partial-failure paths and zero-record cases"
affects:
  - "03-rule-engine"
  - "04-insights-schema-and-cron"
  - "05-llm-orchestrator"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Promise.allSettled for module-level fault isolation — any one fetch failure sets that module to null, others unaffected"
    - "Non-fatal runway query — runway failure returns null inside FinanceSnapshot, does not propagate to module failure"
    - "Guard empty candidateIds before evaluations .in() query — avoids Supabase empty-IN edge case"
    - "Positive-include filter for lead statuses — avoids .not().in() quoting issues"
    - "vi.mock with per-test mockFrom override for Supabase fluent chain mocking"

key-files:
  created: []
  modified:
    - "lib/intelligence/data-aggregator.ts"
    - "lib/intelligence/data-aggregator.test.ts"

key-decisions:
  - "Field names use hire/recent_activity/generated_at (not hiring/activities/timestamp) — consistent with types.ts established in Plan 01"
  - "fetchHiringModule also fetches active roles (roles.active = true) — HireSnapshot.roles required by Phase 03 rule R3"
  - "Runway query wrapped in try/catch inside fetchFinanceModule — non-fatal, never causes finance module to fail"
  - "ACTIVE_LEAD_STATUSES includes nurture — consistent with 003_sales_schema.sql positive-include list"
  - "Expenses filter uses date column (not created_at) — semantically correct for 90-day spend window"

patterns-established:
  - "buildCrossModuleSnapshot is the sole exported function — no other Supabase reads in lib/intelligence/"
  - "errors[] always populated when a module fails, always empty when all succeed — callers check errors.length not null modules"
  - "Zero-record success returns empty arrays, not null modules — null is reserved for fetch failure only"

requirements-completed: [DATA-03]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 2 Plan 02: Data Aggregator Implementation Summary

**buildCrossModuleSnapshot() with Promise.allSettled fault isolation — reads Sales/Hiring/Finance from Supabase in parallel, nullifies failed modules without blocking others, 6 unit tests passing**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-15T12:39:49Z
- **Completed:** 2026-03-15T12:41:51Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Implemented `buildCrossModuleSnapshot()` with three private fetch functions running in parallel via `Promise.allSettled`
- Partial-failure contract: any single module failure sets that module to null and appends to `errors[]` — other modules unaffected
- Guards: empty candidateIds skips evaluations query; runway failure is non-fatal inside `fetchFinanceModule`
- Replaced all 6 `it.todo` stubs in `data-aggregator.test.ts` with passing assertions
- TypeScript strict-mode compilation passes (pre-existing rule-engine stub failures are out of scope)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement buildCrossModuleSnapshot() aggregator** - `3350378` (feat)
2. **Task 2: Fill in data-aggregator test suite with passing assertions** - `7cfbf48` (test)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `lib/intelligence/data-aggregator.ts` - Full aggregator implementation replacing stub: fetchSalesModule, fetchHiringModule, fetchFinanceModule, buildCrossModuleSnapshot
- `lib/intelligence/data-aggregator.test.ts` - 6 passing unit tests with vi.mock Supabase strategy

## Decisions Made
- Aligned field names with actual types.ts (hire/recent_activity/generated_at) since Plan 01 renamed them from the plan's code samples — the plan's TypeScript snippets used the old names but the canonical contract is in types.ts
- `fetchHiringModule` fetches active roles in addition to candidates+evaluations because `HireSnapshot` requires `roles: Role[]` per types.ts
- Runway query uses try/catch inside `fetchFinanceModule` rather than handling it at `Promise.allSettled` level — keeps the non-fatal semantics isolated within the function

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adapted plan code samples to match actual types.ts field names**
- **Found during:** Task 1 (implementation)
- **Issue:** Plan's TypeScript code used `HiringSnapshot`/`hiring`/`activities`/`timestamp` but Plan 01's deviation (02-01-SUMMARY.md) renamed these to `HireSnapshot`/`hire`/`recent_activity`/`generated_at`. Using plan code verbatim would cause TS errors.
- **Fix:** Implemented using the canonical types.ts names throughout
- **Files modified:** `lib/intelligence/data-aggregator.ts`
- **Verification:** `npx tsc --noEmit --skipLibCheck` exits 0; all 6 tests pass
- **Committed in:** 3350378 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added roles fetch to fetchHiringModule**
- **Found during:** Task 1 (implementation)
- **Issue:** `HireSnapshot` in types.ts requires `roles: Role[]` alongside `candidates`, but the plan's action section only mentioned candidates and evaluations queries. Without fetching roles, the return type would be incomplete and tsc would fail.
- **Fix:** Added `supabase.from("roles").select("*").eq("active", true)` to fetchHiringModule
- **Files modified:** `lib/intelligence/data-aggregator.ts`
- **Verification:** TypeScript compile passes; HireSnapshot correctly typed
- **Committed in:** 3350378 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug - field name alignment, 1 missing critical - roles fetch)
**Impact on plan:** Both fixes required for correct TypeScript compilation. No scope creep — roles fetch is part of HireSnapshot contract established in Plan 01.

## Issues Encountered
- Pre-existing test failures in `r3-deals-candidates.test.ts` and `r4-revenue-silence.test.ts` (rule implementation files from Phase 3, not yet created) — out of scope per deviation rules scope boundary. These existed before this plan and are not caused by our changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `buildCrossModuleSnapshot()` is complete and the sole data-fetching interface for all intelligence logic
- Phase 3 rule engine can now write pure functions receiving a `CrossModuleSnapshot` without any Supabase imports
- Phase 4 cron route can call `buildCrossModuleSnapshot()` instead of the stub
- Phase 5 LLM orchestrator has the same entry point

---
*Phase: 02-unified-data-layer*
*Completed: 2026-03-15*

## Self-Check: PASSED

- lib/intelligence/data-aggregator.ts — FOUND
- lib/intelligence/data-aggregator.test.ts — FOUND
- .planning/phases/02-unified-data-layer/02-02-SUMMARY.md — FOUND
- Commit 3350378 — FOUND
- Commit 7cfbf48 — FOUND
