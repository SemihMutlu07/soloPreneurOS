---
phase: 04-insights-schema-and-cron
plan: 01
subsystem: database
tags: [postgres, supabase, migrations, insights, sql]

# Dependency graph
requires: []
provides:
  - cross_module_insights Supabase table with content-addressed PK for upserts
  - Soft-delete via nullable dismissed_at column
  - Indexes on dismissed_at and generated_at for Phase 6 API queries
affects: [04-insights-schema-and-cron, 06-insights-api, 07-insights-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Content-addressed PK: SHA256(rule_id + calendar_date) enables idempotent daily upserts"
    - "Soft-delete pattern: dismissed_at nullable timestamptz, no hard deletes"

key-files:
  created:
    - supabase/migrations/20260315000000_create_cross_module_insights.sql
  modified:
    - .gitignore

key-decisions:
  - "severity constrained to critical/warning/info via CHECK constraint (not enum) for simplicity"
  - "module_tags as text[] (native Postgres array) — extensible without migration, no enum constraint"
  - "Two indexes: dismissed_at for active-only filter, generated_at DESC for recency ordering"
  - "No unique constraint beyond PK — PK on id already enforces uniqueness and enables ON CONFLICT DO UPDATE"

patterns-established:
  - "Supabase migrations tracked in source control under supabase/migrations/ (gitignore updated to supabase/* !supabase/migrations/)"

requirements-completed: [INFRA-01]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 4 Plan 01: Insights Schema and Cron Summary

**Postgres cross_module_insights table with content-addressed PK, severity CHECK constraint, text[] module_tags, soft-delete via dismissed_at, and two query-optimized indexes**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-15T12:29:41Z
- **Completed:** 2026-03-15T12:34:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Created `cross_module_insights` migration DDL with all required columns and constraints
- Added indexes on `dismissed_at` and `generated_at DESC` for efficient Phase 6 API filtering and ordering
- Fixed `.gitignore` to allow `supabase/migrations/` tracking while keeping other Supabase artifacts excluded

## Task Commits

Each task was committed atomically:

1. **Task 1: Write cross_module_insights migration DDL** - `5b9e45d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `supabase/migrations/20260315000000_create_cross_module_insights.sql` - DDL for cross_module_insights table with PK, severity CHECK, text[] module_tags, nullable dismissed_at, and two indexes
- `.gitignore` - Updated from `supabase/` to `supabase/*` with `!supabase/migrations/` exception to allow migration tracking

## Decisions Made
- severity CHECK constraint uses `IN ('critical', 'warning', 'info')` — inline constraint, no separate enum type needed for v1
- module_tags as `text[]` (native Postgres array): extensible without migration, consistent with context decision
- Two indexes mirror Phase 6 query patterns: `WHERE dismissed_at IS NULL` and `ORDER BY generated_at DESC`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated .gitignore to allow supabase/migrations/ tracking**
- **Found during:** Task 1 (Write cross_module_insights migration DDL)
- **Issue:** `.gitignore` had `supabase/` which excluded the entire supabase directory, preventing the migration file from being committed. The plan explicitly requires the migration to be tracked in source control.
- **Fix:** Changed `supabase/` to `supabase/*` and added `!supabase/migrations/` negation rule so migrations are tracked while other supabase artifacts remain excluded.
- **Files modified:** `.gitignore`
- **Verification:** `git status` shows migration file as staged/tracked; `git check-ignore` returns exit code 1 (not ignored)
- **Committed in:** `5b9e45d` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was necessary for correctness — without it the migration file could not be committed. No scope creep.

## Issues Encountered
None beyond the gitignore blocking issue resolved above.

## User Setup Required
To apply this migration against the Supabase project:
```
supabase db push
```
or
```
supabase migration up
```

No new environment variables required.

## Next Phase Readiness
- `cross_module_insights` table schema is defined and migration is source-controlled
- Phase 4 Plan 02 (data aggregator) and Plan 03 (rule engine + cron) can now reference this table shape
- Phase 6 API routes and Phase 7 dashboard have the correct column set to query against

## Self-Check: PASSED

- migration file: FOUND
- SUMMARY.md: FOUND
- commit 5b9e45d: FOUND

---
*Phase: 04-insights-schema-and-cron*
*Completed: 2026-03-15*
