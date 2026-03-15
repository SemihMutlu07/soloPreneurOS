---
phase: 06-intelligence-api-routes
plan: "02"
subsystem: api
tags: [next.js, supabase, intelligence, dismiss, trigger, pipeline]

# Dependency graph
requires:
  - phase: 04-insights-schema-and-cron
    provides: cross_module_insights table with dismissed_at column and cron route
  - phase: 02-unified-data-layer
    provides: buildCrossModuleSnapshot function
  - phase: 03-rule-engine
    provides: runRuleEngine function
provides:
  - POST /api/intelligence/dismiss — soft-delete insight by id (400/404/204)
  - POST /api/intelligence/trigger — fire intelligence pipeline async, return 202
  - lib/intelligence-pipeline.ts — shared runIntelligencePipeline() used by cron and trigger
affects:
  - 06-03 (insights GET route — filters dismissed rows via dismissed_at IS NULL)
  - Phase 7 (UI layer — dismiss action and refresh button)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Fire-and-forget async pipeline: runIntelligencePipeline().catch(console.error) with immediate 202 return
    - Soft-delete via dismissed_at timestamp column (NULL = active, non-NULL = dismissed)
    - 204 No Content using new NextResponse(null, { status: 204 }) — not NextResponse.json()
    - Existence-before-update pattern: SELECT then UPDATE to detect unknown IDs (Supabase UPDATE is silent on zero rows)
    - Shared pipeline function extracted to lib/ so cron route and trigger route share identical logic

key-files:
  created:
    - lib/intelligence-pipeline.ts
    - app/api/intelligence/trigger/route.ts
    - app/api/intelligence/dismiss/route.ts
  modified:
    - app/api/cron/run-intelligence/route.ts

key-decisions:
  - "runIntelligencePipeline extracted to lib/intelligence-pipeline.ts — cron route refactored to thin wrapper, prevents logic duplication"
  - "dismiss uses createClient() (user-facing RLS) not createAdminClient() — user should only dismiss their own insights"
  - "trigger uses fire-and-forget pattern (no await) so 202 is returned immediately regardless of pipeline duration"

patterns-established:
  - "Fire-and-forget: fn().catch(console.error) + return 202 — do not await background work"
  - "Soft-delete 204: new NextResponse(null, { status: 204 }) for body-less responses"
  - "Existence guard: SELECT .single() before UPDATE to surface 404 on unknown IDs"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 06 Plan 02: Intelligence Dismiss and Trigger Routes Summary

**Dismiss (soft-delete with 400/404/204) and trigger (fire-and-forget 202) mutation endpoints, plus shared runIntelligencePipeline() extracted from cron route**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-15T12:54:44Z
- **Completed:** 2026-03-15T12:56:31Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Extracted shared `runIntelligencePipeline()` into `lib/intelligence-pipeline.ts` — cron and trigger routes now share identical pipeline logic
- Created `POST /api/intelligence/trigger` with fire-and-forget async pattern, returns 202 immediately
- Created `POST /api/intelligence/dismiss` with full validation (400 on bad body, 404 on unknown id, 204 on success)

## Task Commits

1. **Task 1: Extract shared pipeline fn and implement POST /api/intelligence/trigger** - `9af96e4` (feat)
2. **Task 2: Implement POST /api/intelligence/dismiss** - `4033919` (feat)

**Plan metadata:** (docs commit pending)

## Files Created/Modified

- `lib/intelligence-pipeline.ts` — exports `PipelineResult` interface and `runIntelligencePipeline()` async function
- `app/api/intelligence/trigger/route.ts` — POST handler, fires pipeline without await, returns `{ running: true }` with 202
- `app/api/intelligence/dismiss/route.ts` — POST handler, validates body, checks existence, soft-deletes via `dismissed_at`, returns 204
- `app/api/cron/run-intelligence/route.ts` — refactored to thin wrapper calling `runIntelligencePipeline()` (imports removed)

## Decisions Made

- Extracted pipeline logic to `lib/intelligence-pipeline.ts` rather than duplicating in trigger route — single source of truth for the three pipeline steps
- `dismiss` uses `createClient()` (user-facing with RLS) because users should only dismiss their own insights
- `trigger` fires pipeline with `.catch(console.error)` fire-and-forget so 202 is returned without blocking on pipeline completion
- `new NextResponse(null, { status: 204 })` used for 204 response (not `NextResponse.json()`) — 204 must have no body per HTTP spec

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dismiss and trigger mutation endpoints are complete and TypeScript-clean
- Phase 7 UI can wire "remove card" to `POST /api/intelligence/dismiss` with `{ id }` body
- Phase 7 UI can wire "refresh" button to `POST /api/intelligence/trigger`
- The `dismissed_at IS NULL` filter should be confirmed in the insights GET route (06-03) before Phase 7

---
*Phase: 06-intelligence-api-routes*
*Completed: 2026-03-15*
