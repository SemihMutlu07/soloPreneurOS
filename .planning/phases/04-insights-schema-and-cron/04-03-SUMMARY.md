---
phase: 04-insights-schema-and-cron
plan: 03
subsystem: api
tags: [nextjs, cron, supabase, typescript, bearer-auth, intelligence-pipeline]

# Dependency graph
requires:
  - phase: 04-insights-schema-and-cron
    provides: cross_module_insights table (Plan 01) and persistInsights function (Plan 02)
  - phase: 02-unified-data-layer
    provides: buildCrossModuleSnapshot function (stub used until Phase 2 completes)
  - phase: 03-rule-engine
    provides: runRuleEngine function (stub used until Phase 3 completes)
provides:
  - GET /api/cron/run-intelligence endpoint — CRON_SECRET-gated daily intelligence pipeline
  - Sequential pipeline: buildCrossModuleSnapshot → runRuleEngine → persistInsights
  - Stub implementations of data-aggregator.ts and rule-engine.ts enabling end-to-end pipeline

affects: [05-llm-orchestrator, 06-insights-api, 07-insights-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CRON_SECRET bearer auth: identical pattern to scan-sales-gmail — first operation in handler, 401 before any DB access"
    - "Result accumulator: { insights_generated, insights_upserted, errors[] } returned as JSON on success"
    - "Stub-first pipeline: stubs return empty data so the endpoint is end-to-end testable before Phase 2/3 complete"

key-files:
  created:
    - app/api/cron/run-intelligence/route.ts
    - lib/intelligence/data-aggregator.ts
    - lib/intelligence/rule-engine.ts
  modified: []

key-decisions:
  - "Stubs created for buildCrossModuleSnapshot and runRuleEngine in lib/intelligence/ — allows cron route to compile and run before Phase 2/3 ship; stubs return empty data (no insights generated)"
  - "Auth check is always the first handler operation — 401 returned before any Supabase calls"
  - "snapshot.errors appended to result.errors but never abort the pipeline — partial runs are acceptable"
  - "Top-level try/catch returns 500 with partial result on unhandled errors"

patterns-established:
  - "Intelligence pipeline entry: aggregate → rules → persist, all sequential, errors accumulated not thrown"

requirements-completed: [INFRA-03, INFRA-04]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 4 Plan 03: Cron Run-Intelligence Endpoint Summary

**CRON_SECRET-gated GET /api/cron/run-intelligence endpoint that runs the full sequential intelligence pipeline (aggregate → rule engine → persist) and returns { insights_generated, insights_upserted, errors[] }**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-15T12:35:00Z
- **Completed:** 2026-03-15T12:40:00Z
- **Tasks:** 1 (+ checkpoint awaiting human verification)
- **Files modified:** 3

## Accomplishments

- Implemented `GET /api/cron/run-intelligence` with CRON_SECRET bearer auth as the first gate
- Wired the sequential pipeline: `buildCrossModuleSnapshot` → `runRuleEngine` → `persistInsights`
- Result accumulator returns `{ insights_generated, insights_upserted, errors[] }` — partial failures accumulate into errors[] without aborting the run
- Created stub `lib/intelligence/data-aggregator.ts` and `lib/intelligence/rule-engine.ts` so the cron route compiles and runs end-to-end before Phase 2/3 are complete

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement GET /api/cron/run-intelligence handler** - `f0133d4` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `app/api/cron/run-intelligence/route.ts` - GET handler with CRON_SECRET auth, sequential pipeline, result accumulator, and top-level error handling
- `lib/intelligence/data-aggregator.ts` - Stub implementation of `buildCrossModuleSnapshot()` returning empty snapshot (replaced by Phase 2)
- `lib/intelligence/rule-engine.ts` - Stub implementation of `runRuleEngine()` returning empty candidates array (replaced by Phase 3)

## Decisions Made

- Stubs created in `lib/intelligence/` for the Phase 2 aggregator and Phase 3 rule engine since those phases had not yet shipped; stubs return safe empty values (no insights generated, no errors) so the cron pipeline runs cleanly end-to-end
- Auth is always checked before any DB or stub function is called — consistent with the pattern in `scan-sales-gmail`
- `snapshot.errors` are appended to `result.errors` but do NOT abort the pipeline — this matches the plan's intent of resilience to partial module failures

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created stub data-aggregator.ts and rule-engine.ts for Phase 2/3 dependencies**
- **Found during:** Task 1 (Implement GET /api/cron/run-intelligence handler)
- **Issue:** The plan states "At the time this plan executes, their aggregator and rule engine functions will exist" — but Phase 2 and Phase 3 were not yet complete. Without these imports, the cron route would not compile.
- **Fix:** Created `lib/intelligence/data-aggregator.ts` with a stub `buildCrossModuleSnapshot()` returning an empty-but-valid snapshot, and `lib/intelligence/rule-engine.ts` with a stub `runRuleEngine()` returning an empty candidates array. Both stubs match the type signatures in `lib/intelligence/types.ts`.
- **Files modified:** `lib/intelligence/data-aggregator.ts`, `lib/intelligence/rule-engine.ts`
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** `f0133d4` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Stub creation is the correct approach — it unblocks this plan while preserving the type contract that Phase 2/3 must implement. No scope creep.

## Issues Encountered

The cron route and stub files were actually pre-committed in `f0133d4` by a prior agent executing a different plan (02-01). This agent's Write operations recreated the same files with identical content, resulting in no git diff. The commit hash `f0133d4` is credited as the Task 1 commit.

## User Setup Required

**To run end-to-end verification (checkpoint step):**

1. Ensure `CRON_SECRET` is set in `.env.local`
2. Start the dev server: `npm run dev`
3. Test unauthenticated rejection: `curl -s http://localhost:3000/api/cron/run-intelligence` — expect `{"error":"Unauthorized"}` with HTTP 401
4. Test authenticated run: `curl -s -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/cron/run-intelligence` — expect `{"insights_generated":0,"insights_upserted":0,"errors":[]}`

No new environment variables required (uses existing `CRON_SECRET`).

## Next Phase Readiness

- `app/api/cron/run-intelligence/route.ts` is production-ready for Phase 2/3 integration — when those phases replace the stubs with real implementations, the cron route will produce real insights with zero changes needed to this file
- The stub `data-aggregator.ts` and `rule-engine.ts` will be replaced by Phase 2 and Phase 3 respectively
- Phase 5 (LLM Orchestrator) can call `persistInsights` directly or hook into this cron pipeline

## Self-Check: PASSED

- `app/api/cron/run-intelligence/route.ts`: FOUND
- `lib/intelligence/data-aggregator.ts`: FOUND
- `lib/intelligence/rule-engine.ts`: FOUND
- commit f0133d4: FOUND (verified via `git show`)
- TypeScript: PASS (npx tsc --noEmit exits 0)

---
*Phase: 04-insights-schema-and-cron*
*Completed: 2026-03-15*
