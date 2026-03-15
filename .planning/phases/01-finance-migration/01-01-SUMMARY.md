---
phase: 01-finance-migration
plan: "01"
subsystem: api
tags: [supabase, next.js, api-routes, finance, invoices, expenses, tax-provisions]

# Dependency graph
requires: []
provides:
  - "GET /api/finance/invoices — lists all invoices from Supabase ordered by created_at desc"
  - "POST /api/finance/invoices — inserts new invoice row, returns created row with UUID id"
  - "GET /api/finance/expenses — lists all expenses from Supabase ordered by created_at desc"
  - "GET /api/finance/tax-provisions — lists all tax_provisions from Supabase ordered by created_at desc"
affects:
  - 01-finance-migration (Plan 03 — Finance UI migration calls these routes)
  - 04-insights-schema-and-cron (cron jobs read Finance data via these routes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin client pattern: createAdminClient() used to bypass Supabase RLS in auth-free app"
    - "FINANCE_USER_ID constant: hardcoded UUID 00000000-0000-0000-0000-000000000001 for all Finance inserts"

key-files:
  created:
    - app/api/finance/invoices/route.ts
    - app/api/finance/expenses/route.ts
    - app/api/finance/tax-provisions/route.ts
  modified: []

key-decisions:
  - "Admin client (not server client) used for Finance routes to bypass RLS since this app has no user auth"
  - "FINANCE_USER_ID hardcoded as 00000000-0000-0000-0000-000000000001 — single solopreneur, no multi-tenancy needed"
  - "expenses and tax-provisions routes are GET-only — these are seeded/calculated data, not user-created"

patterns-established:
  - "createAdminClient() from @/lib/supabase/admin is the pattern for all Finance API routes"
  - "Error response shape: { error: error.message } with status 500"
  - "Success list response: data || [] (empty array fallback)"
  - "Success create response: created row with status 201"

requirements-completed: [DATA-01, DATA-02]

# Metrics
duration: 1min
completed: 2026-03-15
---

# Phase 1 Plan 01: Finance API Routes Summary

**Three Next.js API routes connecting Finance module to Supabase — invoices (GET+POST), expenses (GET), and tax-provisions (GET) — using admin client to bypass RLS**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-15T12:34:25Z
- **Completed:** 2026-03-15T12:35:52Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- GET /api/finance/invoices returns all invoice rows from Supabase ordered by created_at desc
- POST /api/finance/invoices inserts a new invoice row and returns it with auto-generated UUID id
- GET /api/finance/expenses returns all expense rows from Supabase
- GET /api/finance/tax-provisions returns all tax_provision rows from Supabase
- All routes compile cleanly with zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Finance invoices API route (GET + POST)** - `bfe97dc` (feat)
2. **Task 2: Create Finance expenses and tax-provisions API routes (GET only)** - `b49b340` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `app/api/finance/invoices/route.ts` - GET (list all invoices) + POST (create invoice, returns row with UUID)
- `app/api/finance/expenses/route.ts` - GET (list all expenses)
- `app/api/finance/tax-provisions/route.ts` - GET (list all tax provisions)

## Decisions Made
- Used createAdminClient() (not server.ts client) to bypass RLS — the app has no user authentication, so the service role key is the correct approach for all Finance data access.
- FINANCE_USER_ID constant (`00000000-0000-0000-0000-000000000001`) hardcoded at module level — single solopreneur app, no multi-tenancy.
- expenses and tax-provisions intentionally GET-only in this phase — these tables are populated by seeding/cron logic, not user input.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Three Finance API routes are live and compile cleanly
- Finance UI (Plan 03) can now call POST /api/finance/invoices to persist new invoices to Supabase instead of localStorage
- Intelligence cron jobs (Phase 4) can read Finance data via GET routes
- No blockers for remaining plans in Phase 1

---
*Phase: 01-finance-migration*
*Completed: 2026-03-15*
