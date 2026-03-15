---
phase: 04-insights-schema-and-cron
plan: 02
subsystem: database
tags: [typescript, supabase, sha256, crypto, content-addressing, insights]

# Dependency graph
requires:
  - phase: 04-insights-schema-and-cron
    provides: cross_module_insights Supabase table created in plan 01

provides:
  - InsightCandidate, CrossModuleInsight, InsightSeverity, PersistResult TypeScript types
  - buildInsightId function (SHA256 content-addressed ID generation)
  - persistInsights function (upserts to cross_module_insights, preserves dismissed_at)

affects:
  - 04-03-cron-endpoint (calls persistInsights with rule engine output)
  - 03-rule-engine (produces InsightCandidate objects)
  - 05-llm-analysis (produces InsightCandidate objects for LLM-discovered insights)
  - 06-api-routes (reads CrossModuleInsight from DB)

# Tech tracking
tech-stack:
  added: [Node.js built-in crypto module (no new package)]
  patterns:
    - Content-addressed IDs via SHA256(ruleId-calendarDate) for deduplication
    - dismissed_at preservation by omitting field from upsert payload
    - Per-item try/catch error accumulator (same pattern as scan-sales-gmail cron)
    - Sequential for-loop upsert (avoids Supabase rate issues vs Promise.all)

key-files:
  created:
    - lib/intelligence-types.ts
    - lib/persist-insights.ts
    - lib/__tests__/intelligence-types.test.ts
    - lib/__tests__/persist-insights.test.ts
  modified: []

key-decisions:
  - "SHA256 of ruleId-calendarDate produces one logical row per rule per calendar day — prevents duplicates across daily cron runs"
  - "dismissed_at omitted from upsert payload: Supabase only updates columns present in payload, so omitting dismissed_at preserves existing dismissed state"
  - "Sequential for-loop preferred over Promise.all to avoid Supabase rate limiting"
  - "Node.js built-in crypto used for SHA256 — no extra dependency required"

patterns-established:
  - "Content-addressed upsert pattern: build deterministic ID, upsert without touching audit columns (dismissed_at)"
  - "Error accumulator pattern: per-item try/catch appends to errors[], never throws, returns full result at end"

requirements-completed: [INFRA-02]

# Metrics
duration: 8min
completed: 2026-03-15
---

# Phase 4 Plan 02: Intelligence Types and Persist Function Summary

**SHA256 content-addressed InsightCandidate types and persistInsights upsert function that preserves dismissed_at by omitting it from the upsert payload**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-15T12:29:41Z
- **Completed:** 2026-03-15T12:37:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Defined `InsightCandidate`, `CrossModuleInsight`, `InsightSeverity`, and `PersistResult` TypeScript types in `lib/intelligence-types.ts`
- Implemented `buildInsightId` using Node's built-in `crypto` module — SHA256 of `ruleId-calendarDate` is deterministic (same inputs always produce same 64-char hex)
- Implemented `persistInsights` that upserts to `cross_module_insights` with `onConflict: "id"`, accumulates per-item errors, and never includes `dismissed_at` in the payload
- TDD type-assertion test files created for both modules

## Task Commits

Each task was committed atomically:

1. **Task 1: Define intelligence types** - `01dca0b` (feat)
2. **Task 2: Implement persistInsights and buildInsightId** - `ec30cbf` (feat)

_Note: TDD tasks merged test + implementation into single commits since no test runner is installed — tests are compile-time TypeScript assertions._

## Files Created/Modified

- `lib/intelligence-types.ts` - InsightSeverity union type, InsightCandidate, CrossModuleInsight, PersistResult interfaces
- `lib/persist-insights.ts` - buildInsightId (SHA256) and persistInsights (upsert with dismissed_at preservation)
- `lib/__tests__/intelligence-types.test.ts` - Compile-time type assertion tests for all exported types
- `lib/__tests__/persist-insights.test.ts` - Compile-time type and determinism assertion tests for persist functions

## Decisions Made

- Used Node.js built-in `crypto` module for SHA256 — no extra package needed in a Next.js project
- `dismissed_at` is omitted from the upsert row object entirely. Supabase's upsert `ON CONFLICT DO UPDATE` only updates columns present in the payload, so omitting it means the existing DB value is never touched — dismissed insights stay dismissed even as conditions persist day-over-day
- Sequential `for` loop chosen over `Promise.all` to avoid potential Supabase rate limiting in production cron runs
- TDD test files use TypeScript compile-time assertions (no test runner needed) — if types are wrong, `tsc --noEmit` fails

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The `@/` path alias in test files required running `tsc --noEmit` against the full project (with tsconfig.json) rather than individual files, since `tsc file.ts` doesn't load the `paths` configuration.

## User Setup Required

None - no external service configuration required. The `cross_module_insights` Supabase table was created in Plan 01.

## Next Phase Readiness

- `lib/intelligence-types.ts` is ready for import by the Phase 3 rule engine (produces `InsightCandidate[]`)
- `persistInsights` is ready for import by Plan 03 cron endpoint (`/api/cron/run-intelligence`)
- `buildInsightId` is exported separately for any consumer that needs to check existing IDs before upserting

---
*Phase: 04-insights-schema-and-cron*
*Completed: 2026-03-15*
