---
phase: 01-finance-migration
plan: 02
subsystem: database
tags: [supabase, typescript, seed, upsert, finance]

# Dependency graph
requires:
  - phase: 01-finance-migration-01
    provides: Supabase Finance schema (invoices, expenses, tax_provisions tables)
provides:
  - scripts/seed-finance.ts — idempotent one-time seed of Finance mock data into Supabase
affects:
  - 01-finance-migration-03 (Finance page migration depends on seeded data being present)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Idempotent seed via upsert with onConflict: id and stable deterministic UUIDs"
    - "Admin client (service role) used for seeding to bypass RLS"
    - "FINANCE_USER_ID hardcoded as 00000000-0000-0000-0000-000000000001 for mock/seed data"

key-files:
  created:
    - scripts/seed-finance.ts
  modified: []

key-decisions:
  - "Seed data defined inline (not imported from mock-data.ts) to avoid path alias resolution issues when running outside Next.js"
  - "Stable UUIDs (00000000-0000-0000-000X-00000000000Y) assigned for all rows — allows safe re-runs"
  - "dotenv not used since it is not in package.json; env vars loaded externally via dotenv-cli or shell export"

patterns-established:
  - "Seed pattern: inline data + stable UUIDs + upsert onConflict id = idempotent seeding"

requirements-completed: [DATA-01]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 1 Plan 02: Finance Seed Script Summary

**Idempotent Finance seed script using upsert with stable deterministic UUIDs — seeds 6 invoices, 5 expenses, 1 tax_provision into Supabase via admin client**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-15T12:34:30Z
- **Completed:** 2026-03-15T12:39:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `scripts/seed-finance.ts` that seeds all Finance mock data into Supabase
- Script is idempotent: uses `upsert` with `onConflict: "id"` and stable deterministic UUIDs
- Uses `createAdminClient()` (service role) — no RLS dependency, works from CLI context
- TypeScript compiles cleanly with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Write idempotent Finance seed script** - `4af6c80` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `scripts/seed-finance.ts` - Idempotent seed script for Finance data; run with `npx dotenv-cli -e .env.local -- npx tsx scripts/seed-finance.ts`

## Decisions Made
- Seed data defined inline (not imported from `lib/mock-data.ts`) to avoid path alias / module resolution issues when running as a standalone ts-node/tsx script outside Next.js
- Stable deterministic UUIDs assigned per the plan spec: `00000000-0000-0000-0001-00000000000X` for invoices, `0002` for expenses, `0003` for tax_provisions
- `dotenv` not imported since it is absent from `package.json`; the run comment documents using `dotenv-cli` externally
- `FINANCE_USER_ID = "00000000-0000-0000-0000-000000000001"` used for all `user_id` fields

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — the seed script itself requires no additional environment beyond what is already documented in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`).

To run the seed against Supabase:
```bash
npx dotenv-cli -e .env.local -- npx tsx scripts/seed-finance.ts
```

## Next Phase Readiness
- `scripts/seed-finance.ts` ready to run when Supabase credentials are available in `.env.local`
- After running, Supabase `invoices` table will have 6 rows, `expenses` 5 rows, `tax_provisions` 1 row
- Plan 03 (Finance page migration to Supabase) can proceed once seed has been run

---
*Phase: 01-finance-migration*
*Completed: 2026-03-15*
