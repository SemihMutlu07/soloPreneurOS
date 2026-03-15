# Phase 1: Finance Migration - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate Finance-OS from localStorage to Supabase. After this phase, all Finance data (invoices, expenses, tax provisions) lives in Supabase and is readable by server-side code. No new Finance features — just move the storage layer.

</domain>

<decisions>
## Implementation Decisions

### Mock data handling
- Seed Supabase with existing mock data from `mock-data.ts` as initial data (one-time seed)
- Seeding approach: Claude's discretion (auto-seed on empty or seed script)
- After seeding, remove all Finance mock exports from `mock-data.ts` (`financeInvoices`, `financeKDVSummary`, `financeRunway`, `financeTaxProvisions`)
- Update `app/api/brief/route.ts` to read real Finance data from Supabase instead of mock imports

### Existing data fate
- No real data in localStorage — fresh start in Supabase is fine
- Clean break from localStorage: remove all Finance localStorage reads/writes entirely, Supabase only
- Let Supabase auto-generate UUIDs — remove client-side `inv-${Date.now()}` ID generation

### Claude's Discretion
- Seeding mechanism (auto-seed on empty table vs one-time script)
- Whether to use Supabase client-side or server-side client for Finance reads/writes
- How to handle the `user_id` field (current code hardcodes `"user-1"`)
- Runway/currency data approach (currently hardcoded in mock-data — keep static or migrate)
- Tax calendar/provisions data approach (currently mock — keep static or migrate)
- Error handling and loading states during Supabase fetches

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Key constraint: the migration must be transparent to the user — Finance dashboard should look and behave identically after migration.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/supabase/client.ts`: Browser Supabase client — use for Finance page reads/writes
- `lib/supabase/server.ts`: Server Supabase client — use for brief route and future cron access
- `lib/supabase/admin.ts`: Admin client — use for seed script or cron jobs
- `lib/finance-types.ts`: TypeScript types already match `002_finance_schema.sql` closely (Invoice, Expense, TaxProvision)

### Established Patterns
- Sales-OS already reads/writes leads from Supabase (`app/api/sales/leads/route.ts`) — follow same pattern
- Hire-OS uses Supabase for candidates — consistent approach
- `"use client"` components fetch data via API routes or direct Supabase client calls

### Integration Points
- `app/finance/page.tsx`: Main page — currently merges localStorage + mock data, needs full rewrite to Supabase fetch
- `components/finance/invoice-form.tsx`: Save handler — replace localStorage write with Supabase insert
- `app/api/brief/route.ts`: Imports Finance mocks — needs Supabase reads
- `supabase/migrations/002_finance_schema.sql`: Schema already exists with `invoices`, `tax_provisions`, `expenses` tables + RLS policies

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-finance-migration*
*Context gathered: 2026-03-15*
