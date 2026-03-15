---
phase: 02-unified-data-layer
plan: 01
subsystem: testing
tags: [vitest, typescript, types, intelligence, cross-module]

# Dependency graph
requires: []
provides:
  - "CrossModuleSnapshot, SalesSnapshot, HireSnapshot, FinanceSnapshot TypeScript interfaces in lib/intelligence/types.ts"
  - "HOT_STAGES constant and isHotLead() helper function"
  - "RuleInsight and RuleSeverity types for Phase 3 rule engine"
  - "Vitest dev dependency installed and configured with @ alias"
  - "Test scaffold for buildCrossModuleSnapshot (6 it.todo entries)"
affects:
  - "03-rule-engine"
  - "04-insights-schema-and-cron"
  - "05-llm-orchestrator"

# Tech tracking
tech-stack:
  added: ["vitest ^4.1.0"]
  patterns:
    - "CrossModuleSnapshot as sole interface between raw data and all intelligence logic"
    - "it.todo scaffold pattern — tests written before implementation for Wave 2"
    - "node environment for server-side tests with @ path alias"

key-files:
  created:
    - "lib/intelligence/types.ts"
    - "lib/intelligence/data-aggregator.test.ts"
    - "vitest.config.ts"
  modified:
    - "package.json"
    - "package-lock.json"

key-decisions:
  - "Used HireSnapshot (not HiringSnapshot) and hire field — consistent with Phase 03 naming convention established in parallel"
  - "SalesSnapshot uses recent_activity (not activities) — more descriptive for intelligence context"
  - "CrossModuleSnapshot uses generated_at (not timestamp) — avoids ambiguity with other timestamp fields"
  - "Vitest environment: node (not jsdom) — all intelligence logic is server-side with no DOM dependency"
  - "errors: string[] always present (not optional) — callers never need to null-check the error list"

patterns-established:
  - "Intelligence types live in lib/intelligence/types.ts — single source of truth for cross-module data shapes"
  - "HireSnapshot includes roles: Role[] alongside candidates — enables role-context rules"
  - "Module snapshots are null on fetch failure, never partially populated"

requirements-completed: [DATA-04, DATA-03]

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 2 Plan 01: CrossModuleSnapshot Type Contract Summary

**CrossModuleSnapshot TypeScript interface contract with vitest infrastructure — sole data boundary between Supabase fetches and all intelligence logic (rules, LLM, cron)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-15T12:33:24Z
- **Completed:** 2026-03-15T12:37:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Installed vitest ^4.1.0 with node environment config and `@` path alias resolver
- Defined CrossModuleSnapshot, SalesSnapshot, HireSnapshot, FinanceSnapshot interfaces in `lib/intelligence/types.ts`
- Added HOT_STAGES constant, isHotLead() helper, RuleInsight, and RuleSeverity types (needed by Phase 03 TDD RED tests already committed)
- Created `data-aggregator.test.ts` scaffold with 6 `it.todo` entries for Wave 2 implementation
- TypeScript strict-mode compilation passes with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install vitest and create vitest.config.ts** - `e1721d1` (chore)
2. **Task 2 RED: Test scaffold for buildCrossModuleSnapshot** - `232e16f` (test)
3. **Task 2 GREEN: CrossModuleSnapshot types + isHotLead helper** - `f0133d4` (feat)

_Note: TDD tasks have separate RED/GREEN commits. Additional refinement commit applied to align field names with Phase 03 parallel work._

## Files Created/Modified
- `lib/intelligence/types.ts` - CrossModuleSnapshot, SalesSnapshot, HireSnapshot, FinanceSnapshot, HOT_STAGES, isHotLead, RuleInsight, RuleSeverity
- `lib/intelligence/data-aggregator.test.ts` - Test scaffold with 6 it.todo entries for buildCrossModuleSnapshot
- `vitest.config.ts` - Vitest config with node environment and @ alias
- `package.json` - Added vitest ^4.1.0 to devDependencies
- `package-lock.json` - Updated lock file

## Decisions Made
- Used `HireSnapshot` / `hire` naming (not `HiringSnapshot`) to stay consistent with Phase 03 plan that was executed in parallel
- Used `recent_activity` instead of `activities` in SalesSnapshot — more descriptive for intelligence context
- Used `generated_at` instead of `timestamp` on CrossModuleSnapshot — avoids ambiguity
- Included `roles: Role[]` in HireSnapshot — enables rule R3 (open-role + finance correlation)
- `errors: string[]` is always required (not `errors?: string[]`) — callers don't need to null-check

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added isHotLead and HOT_STAGES exports required by pre-existing types.test.ts**
- **Found during:** Task 2 (types.ts creation)
- **Issue:** `lib/intelligence/types.test.ts` (committed in Phase 03 plan 01) imports `isHotLead` and `HOT_STAGES` from `./types`. Without these exports, `npx tsc --noEmit` fails with TS2305 errors.
- **Fix:** Added `HOT_STAGES as const`, `HotStage` type, and `isHotLead(lead: Lead): boolean` to `types.ts`
- **Files modified:** `lib/intelligence/types.ts`
- **Verification:** `npx tsc --noEmit --skipLibCheck` exits 0; `npx vitest run lib/intelligence/types.test.ts` passes all 14 tests
- **Committed in:** f0133d4 (Task 2 GREEN commit)

**2. [Rule 1 - Bug] Aligned field names with Phase 03 schema**
- **Found during:** Task 2 (post-commit verification)
- **Issue:** Initial types.ts used `activities`, `hiring`, `timestamp` but Phase 03 plan specified `recent_activity`, `hire`, `generated_at`. Data aggregator stub used the Phase 03 names, causing tsc errors.
- **Fix:** Updated SalesSnapshot.activities -> recent_activity; HiringSnapshot -> HireSnapshot with roles field; timestamp -> generated_at on CrossModuleSnapshot
- **Files modified:** `lib/intelligence/types.ts`, `lib/intelligence/data-aggregator.ts`, `lib/intelligence/data-aggregator.test.ts`
- **Verification:** `npx tsc --noEmit --skipLibCheck` exits 0
- **Committed in:** f7ea84a (feat(03-01) — parallel phase commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes required for correct compilation. No scope creep — all additions are part of the intelligence types boundary.

## Issues Encountered
- Phase 03 TDD RED tests were already committed before this plan executed (parallel phase planning), requiring `isHotLead` and `HOT_STAGES` to be added to unblock tsc.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CrossModuleSnapshot type contract is established — Phases 03 (rule engine), 04 (cron), and 05 (LLM) can all import safely
- Vitest infrastructure is ready for Plan 02 (data aggregator implementation)
- `it.todo` scaffold in `data-aggregator.test.ts` will be filled in during Plan 02
- `data-aggregator.ts` stub returns empty data — real implementation in Plan 02

---
*Phase: 02-unified-data-layer*
*Completed: 2026-03-15*

## Self-Check: PASSED

- lib/intelligence/types.ts — FOUND
- lib/intelligence/data-aggregator.test.ts — FOUND
- vitest.config.ts — FOUND
- 02-01-SUMMARY.md — FOUND
- Commit e1721d1 — FOUND
- Commit 232e16f — FOUND
- Commit f0133d4 — FOUND
