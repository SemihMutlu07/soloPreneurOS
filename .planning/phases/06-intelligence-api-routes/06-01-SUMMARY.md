---
phase: 06-intelligence-api-routes
plan: "01"
subsystem: api
tags: [next.js, supabase, api-routes, intelligence, insights]

# Dependency graph
requires:
  - phase: 04-insights-schema-and-cron
    provides: cross_module_insights table with dismissed_at, severity, module_tags columns
provides:
  - GET /api/intelligence/insights — active insights ordered by severity tier then recency
  - GET /api/intelligence/nudges?module={tag} — module-filtered active insights with 400 on missing param
affects:
  - 07-dashboard-ui

# Tech tracking
tech-stack:
  added: []
  patterns:
    - JS stable sort for severity tier ordering when DB ORDER BY CASE is unavailable
    - .contains("module_tags", [module]) for Supabase text[] array containment filter
    - 400 guard before Supabase client creation for cheap invalid-request rejection

key-files:
  created:
    - app/api/intelligence/insights/route.ts
    - app/api/intelligence/nudges/route.ts
  modified: []

key-decisions:
  - "Severity sort done in JS (not SQL) — Supabase JS client lacks ORDER BY CASE; stable sort preserves DB-ordered created_at within each tier"
  - "module guard fires before createClient() — avoids unnecessary Supabase connection on bad requests"
  - "No auth check — middleware protects calling pages per existing project pattern"

patterns-established:
  - "Severity tier sort: fetch ordered by created_at DESC, then JS stable sort with severityOrder map {critical:0, warning:1, info:2}"
  - "Array containment filter: .contains('module_tags', [module]) for text[] columns in Supabase JS"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 6 Plan 1: Intelligence API Routes Summary

**Two read endpoints exposing cross_module_insights to Phase 7 UI: severity-sorted active insights list and module-filtered nudges with 400 guard**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-15T12:54:38Z
- **Completed:** 2026-03-15T12:55:55Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- GET /api/intelligence/insights queries active (non-dismissed) rows, sorts critical > warning > info via JS stable sort preserving DB recency ordering within each tier
- GET /api/intelligence/nudges?module={tag} returns module-scoped insights using Supabase .contains() array filter; returns 400 with descriptive message when module param is absent
- Both routes return empty array (not error) when no matching rows exist; TypeScript compiles clean with zero errors

## Task Commits

1. **Task 1: Implement GET /api/intelligence/insights** - `125e5a5` (feat)
2. **Task 2: Implement GET /api/intelligence/nudges** - `a02d719` (feat)

## Files Created/Modified

- `app/api/intelligence/insights/route.ts` — GET handler: dismissed_at IS NULL filter, created_at DESC ordering, JS severity sort, returns flat array
- `app/api/intelligence/nudges/route.ts` — GET handler: module param guard (400), dismissed_at IS NULL + module_tags containment filter, same severity sort, returns flat array

## Decisions Made

- Severity sort is done in JS after the DB query because the Supabase JS client does not support ORDER BY CASE. The DB query orders by created_at DESC first, making the subsequent JS sort stable — created_at ordering is preserved within each severity tier.
- The module query param guard fires before `createClient()` to avoid unnecessary Supabase connections on clearly invalid requests.
- No auth check on either route — follows existing project pattern where Next.js middleware protects pages that call these endpoints.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both endpoints ready for Phase 7 dashboard UI consumption
- GET /api/intelligence/insights returns data Phase 7 needs for the central insight list view
- GET /api/intelligence/nudges?module={tag} ready for in-module contextual nudge panels
- Endpoints return empty arrays until Phase 4 cron runs and populates cross_module_insights

---
*Phase: 06-intelligence-api-routes*
*Completed: 2026-03-15*
