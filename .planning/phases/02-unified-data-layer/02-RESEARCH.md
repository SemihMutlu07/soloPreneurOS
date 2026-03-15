# Phase 2: Unified Data Layer - Research

**Researched:** 2026-03-15
**Domain:** TypeScript type design, Supabase data fetching, partial-failure aggregation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Data Scope — Sales**
- Pull active leads only: status NOT IN `['won', 'lost']`
- Include recent LeadActivity: last 30 days
- Do NOT dump full lead history

**Data Scope — Hiring**
- Pull active candidates only: status `pending` or `analyzed`
- Candidates come joined with their evaluations (recommendation field needed for downstream rules)
- Do NOT include decided/rejected candidates

**Data Scope — Finance**
- Pull last 90 days of invoices and expenses
- Include a pre-computed `RunwayData` object — aggregator reads stored runway values from Supabase; it does not recompute from raw records
- Rules use `runway_months` directly without arithmetic

**Partial Failure — Module Query Fails**
- Return a partial snapshot with null for the failed module (e.g. `finance: null`)
- Cron run completes with whatever data is available
- No retries at the aggregator level

**Partial Failure — Module Returns Zero Records**
- Return empty arrays and null metrics: `finance: { invoices: [], expenses: [], runway: null }`
- Empty is not an error — rules that need Finance data simply don't fire
- No sentinel values; empty arrays are the contract

**Partial Failure — Error Visibility**
- `CrossModuleSnapshot` includes an `errors: string[]` field
- Aggregator appends a message per failed module (e.g. `"finance: query failed — timeout"`)
- Cron route logs this array

**Rule Null-Guard Pattern**
- Each rule function starts with a null-check on its required module: `if (!snapshot.finance) return null`
- Rules never read `errors[]` — they just check module presence
- Aggregator always returns a fully-shaped snapshot object (never throws); failed modules are `null`, empty modules are `{ ..., data: [] }`

### Claude's Discretion
- Exact Supabase query structure (joins vs separate calls)
- Whether to use `Promise.all` or sequential fetches internally
- Specific date range anchor (e.g. `new Date()` vs `Date.now()` for the 90-day window)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-03 | Unified data aggregator reads Sales, Hire, and Finance from Supabase into a single CrossModuleSnapshot | Supabase query patterns confirmed; `createAdminClient()` established for server-side access; Supabase tables `leads`, `lead_activities`, `candidates`, `evaluations`, `invoices`, `expenses` all verified in migrations 001-003 |
| DATA-04 | CrossModuleSnapshot type captures lead pipeline, candidate pipeline, invoice/expense state, and runway metrics | All source types (`Lead`, `LeadActivity`, `Candidate`, `Evaluation`, `CandidateWithEvaluation`, `Invoice`, `Expense`, `RunwayData`) verified in `lib/*-types.ts` files; `CandidateWithEvaluation` join type already exists and is the correct shape for the hiring sub-snapshot |
</phase_requirements>

---

## Summary

Phase 2 is a pure TypeScript + Supabase data-fetching phase. No UI, no Claude calls, no rule logic. It produces two deliverables: (1) the `CrossModuleSnapshot` type defined in `lib/intelligence/types.ts`, and (2) the `buildCrossModuleSnapshot()` aggregator function in `lib/intelligence/data-aggregator.ts`. All downstream intelligence phases (rules, LLM, cron) import from these two files and nothing else.

All three source types are already fully defined in `lib/sales-types.ts`, `lib/hiring-types.ts`, and `lib/finance-types.ts`. The Supabase tables are confirmed in migrations 001–003. The `createAdminClient()` pattern used by existing cron routes is the exact pattern the aggregator should follow. There are no new dependencies to install.

The only design work that belongs to this phase is: defining the exact shape of `CrossModuleSnapshot` (including the `errors: string[]` field and nullable module branches), writing three isolated Supabase fetch functions (one per module), and composing them with `Promise.allSettled` or individual try/catch to achieve the partial-failure contract.

**Primary recommendation:** Use `Promise.allSettled` internally so all three module fetches run in parallel and each failure is caught independently. Compose results into a single object following the locked null/empty-array contract.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.99.1 (existing) | Server-side Supabase queries | Already in use across all cron routes; admin client already exported from `lib/supabase/admin.ts` |
| TypeScript | 5.9.3 (existing) | Type definitions for snapshot and sub-types | Strict mode enforced; all existing module types are TypeScript interfaces |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | n/a — NOT needed | Date arithmetic for 30/90-day windows | Standard JS `Date` and `new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()` is sufficient; do not add this dependency for simple offset arithmetic |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Promise.allSettled` | Sequential try/catch per module | Sequential is simpler to read; `Promise.allSettled` is faster (parallel) and is the natural fit for independent partial-failure semantics |
| Supabase `.select()` with join syntax | Separate queries for candidates + evaluations | Separate calls avoid complex join syntax and match existing codebase pattern; join is valid but the existing `CandidateWithEvaluation` type was designed for a manual join |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

```
lib/
└── intelligence/
    ├── types.ts             # CrossModuleSnapshot, SalesSnapshot, HiringSnapshot, FinanceSnapshot, Insight
    └── data-aggregator.ts   # buildCrossModuleSnapshot() — sole export consumed by Phase 4 cron
```

Both files are new. No other directories or files are created in this phase.

### Pattern 1: Admin Client Aggregator (matches existing cron pattern exactly)

**What:** Server-side data fetch using `createAdminClient()`, no bearer-token auth needed at the lib level (auth is on the cron route, not the aggregator function).

**When to use:** Any lib function that reads Supabase from a server context without a user session.

**Example (from existing `app/api/cron/evaluate-leads/route.ts`):**
```typescript
// Source: app/api/cron/evaluate-leads/route.ts (verified)
import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();
const { data: leads, error: fetchError } = await supabase
  .from("leads")
  .select("*")
  .eq("status", "new")
  .is("ai_score", null)
  .limit(EVAL_BATCH_SIZE)
  .order("created_at", { ascending: true });
```

### Pattern 2: Per-Module Partial Failure with errors[]

**What:** Wrap each module's fetch in its own try/catch. On failure, push to the errors array and return null for that module. Never throw from the aggregator.

**When to use:** Any function that must succeed even when one of its data sources fails.

**Example:**
```typescript
// Source: pattern derived from CronResult in lib/hiring-types.ts + evaluate-leads route
async function fetchSalesModule(supabase: SupabaseClient): Promise<SalesSnapshot | null> {
  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    // ... queries ...
    return { leads, activities };
  } catch (err) {
    return null; // caller appends to errors[]
  }
}
```

### Pattern 3: Candidates + Evaluations Join via Separate Queries

**What:** Query candidates, then query evaluations for those candidate IDs, then zip them client-side into `CandidateWithEvaluation[]`. This matches the existing `CandidateWithEvaluation` type in `lib/hiring-types.ts`.

**When to use:** When the joined type already exists and a manual zip is simpler than constructing a Supabase foreign-table join.

**Example:**
```typescript
// Source: lib/hiring-types.ts (verified) — CandidateWithEvaluation pattern
const candidates = await supabase
  .from("candidates")
  .select("*")
  .in("status", ["pending", "analyzed"]);

const evaluations = await supabase
  .from("evaluations")
  .select("*")
  .in("candidate_id", candidates.data.map(c => c.id));

const result: CandidateWithEvaluation[] = candidates.data.map(c => ({
  ...c,
  evaluation: evaluations.data.find(e => e.candidate_id === c.id) ?? null,
}));
```

### Pattern 4: RunwayData — Read from Supabase, Not Computed

**What:** The aggregator does NOT compute `RunwayData` from invoice/expense math. It reads a pre-stored `RunwayData` record from Supabase. Rules use `runway_months` directly.

**When to use:** Finance module snapshot requires runway. The `RunwayData` type in `lib/finance-types.ts` is: `{ cash_tl, cash_usd, monthly_burn, runway_months }`.

**Important:** The `RunwayData` table must be confirmed as part of Phase 1 (Finance Migration). If no runway record exists, return `runway: null` — this is a valid empty state, not an error.

### Anti-Patterns to Avoid

- **Throwing from the aggregator:** The aggregator MUST always return a `CrossModuleSnapshot`. Throwing breaks the partial-failure contract. Catch all module errors, push to `errors[]`, set that module to `null`.
- **Computing runway in the aggregator:** The aggregator reads `RunwayData` from Supabase. It does not calculate `monthly_burn` or `runway_months` from raw invoices/expenses. That logic belongs to Phase 1 (Finance data model) or to Finance-OS itself.
- **Using `Promise.all` instead of `Promise.allSettled` (or equivalent):** `Promise.all` rejects immediately if any sub-promise fails, which defeats the partial-failure design. Use `Promise.allSettled` or wrap each module call in its own `try/catch`.
- **Filtering active candidates in TypeScript rather than in SQL:** Push the `status IN ('pending', 'analyzed')` filter to the Supabase query, not a `.filter()` call on the result. Same for the lead `status NOT IN ('won', 'lost')` filter.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date arithmetic for 30/90-day windows | Custom date utility | `new Date(Date.now() - N * 86400000).toISOString()` inline | One-liner; no library needed at this scale |
| Candidate+Evaluation join | Custom ORM join logic | Separate queries + client-side zip | Supabase foreign-table syntax works but adds verbosity; zip is 3 lines and is already the implied pattern from `CandidateWithEvaluation` |
| Runway computation | Recompute from raw invoices | Read pre-stored `RunwayData` from Supabase | Computation belongs to Finance-OS; aggregator is read-only against what Finance-OS writes |

**Key insight:** The aggregator is a thin read layer. It does zero computation, zero transformation beyond joining candidates+evaluations. All business logic lives in Phase 3 (rules) and Phase 5 (LLM).

---

## Common Pitfalls

### Pitfall 1: `RunwayData` Table May Not Exist Yet

**What goes wrong:** Phase 2 depends on Phase 1 creating a `runway_data` table (or equivalent) in Supabase. If Phase 1 stores runway only in Finance-OS UI state and not in a Supabase table, the aggregator has nowhere to read `RunwayData` from.

**Why it happens:** The CONTEXT.md says "reads stored runway values from Supabase" but Finance-OS currently uses localStorage. Phase 1 must explicitly create the runway persistence layer.

**How to avoid:** Before writing the `fetchFinanceModule` function, confirm with the Phase 1 plan that `RunwayData` is persisted to a specific Supabase table. If the table name isn't known at Phase 2 plan time, leave a `// TODO: confirm table name from Phase 1` comment and validate at implementation time.

**Warning signs:** The `RunwayData` type exists in `lib/finance-types.ts` but there is no `runway_data` table in migrations 001–003. This table must exist before the aggregator can read it.

### Pitfall 2: Lead Status Filter — `status` Is a String Enum, NOT a Boolean Column

**What goes wrong:** Querying `.not("status", "in", ["won", "lost"])` requires the correct Supabase filter syntax. Using `.neq("status", "won")` only excludes one value.

**Why it happens:** Supabase `.not().in()` or `.not("status", "in", "(won,lost)")` has specific syntax requirements.

**How to avoid:** Use `.not("status", "in", '("won","lost")')` or equivalently query with positive inclusion of all active statuses: `.in("status", ["new","qualified","contacted","demo","proposal","negotiation","nurture"])`. The positive-include approach is safer and more explicit.

**Warning signs:** If the snapshot includes won/lost leads, rules like R4 (no wins recently) will silently misbehave.

### Pitfall 3: Hiring — `evaluated` Status Not Present in Schema

**What goes wrong:** The CONTEXT.md says "status `pending` or `analyzed`". The Supabase candidates table (from `001_initial_schema.sql`) defines `status check (status in ('pending', 'analyzed', 'reviewed'))`. Note: `reviewed` is a third valid status. The aggregator filters on `pending` and `analyzed` only — do NOT include `reviewed`.

**Why it happens:** Easy to accidentally broaden the filter to `not("status", "eq", "rejected")` — but `rejected` is not a valid status in the schema.

**How to avoid:** Use `.in("status", ["pending", "analyzed"])` — exact match to the CONTEXT.md decision.

### Pitfall 4: Finance Queries May Return No Rows (Not an Error)

**What goes wrong:** If the invoices or expenses tables have zero rows within the 90-day window, the aggregator must return `{ invoices: [], expenses: [], runway: null }` — not throw or return `null` for the whole finance module.

**Why it happens:** Confusing zero-rows (valid empty state) with query failure.

**How to avoid:** Check `error` from the Supabase response separately from `data`. A null-data-with-no-error means empty result, not failure. Only `error !== null` triggers the module-failure path.

### Pitfall 5: RLS Policies Block the Admin Client

**What goes wrong:** The Supabase RLS policies on `invoices`, `expenses`, `candidates`, etc. use `to authenticated` — they pass for authenticated users. The admin client uses the service role key, which bypasses RLS entirely. This is correct for cron usage but means the aggregator will read ALL rows across all users if this ever becomes multi-tenant.

**Why it happens:** Service role key ignores RLS.

**How to avoid:** For current single-user scope, this is fine and matches the existing cron pattern. Document this as a multi-tenancy concern for future phases.

---

## Code Examples

Verified patterns from the codebase:

### CrossModuleSnapshot Type (lib/intelligence/types.ts)

```typescript
// Derived from: lib/sales-types.ts, lib/hiring-types.ts, lib/finance-types.ts (all verified)
// CONTEXT.md decisions applied: nullable modules, errors[], empty-not-null for zero-record case

import type { Lead, LeadActivity } from "@/lib/sales-types";
import type { CandidateWithEvaluation } from "@/lib/hiring-types";
import type { Invoice, Expense, RunwayData } from "@/lib/finance-types";

export interface SalesSnapshot {
  leads: Lead[];
  activities: LeadActivity[];
}

export interface HiringSnapshot {
  candidates: CandidateWithEvaluation[];
}

export interface FinanceSnapshot {
  invoices: Invoice[];
  expenses: Expense[];
  runway: RunwayData | null;
}

export interface CrossModuleSnapshot {
  timestamp: string;                   // ISO string, set when aggregator runs
  sales: SalesSnapshot | null;         // null = query failed
  hiring: HiringSnapshot | null;       // null = query failed
  finance: FinanceSnapshot | null;     // null = query failed
  errors: string[];                    // one entry per failed module
}
```

### buildCrossModuleSnapshot() — Aggregator Skeleton

```typescript
// lib/intelligence/data-aggregator.ts
// Source: pattern derived from app/api/cron/evaluate-leads/route.ts (verified)

import { createAdminClient } from "@/lib/supabase/admin";
import type { CrossModuleSnapshot, SalesSnapshot, HiringSnapshot, FinanceSnapshot } from "./types";

export async function buildCrossModuleSnapshot(): Promise<CrossModuleSnapshot> {
  const supabase = createAdminClient();
  const errors: string[] = [];

  const [salesResult, hiringResult, financeResult] = await Promise.allSettled([
    fetchSalesModule(supabase),
    fetchHiringModule(supabase),
    fetchFinanceModule(supabase),
  ]);

  const sales = salesResult.status === "fulfilled" ? salesResult.value : null;
  if (salesResult.status === "rejected") {
    errors.push(`sales: ${salesResult.reason?.message ?? "unknown error"}`);
  }

  const hiring = hiringResult.status === "fulfilled" ? hiringResult.value : null;
  if (hiringResult.status === "rejected") {
    errors.push(`hiring: ${hiringResult.reason?.message ?? "unknown error"}`);
  }

  const finance = financeResult.status === "fulfilled" ? financeResult.value : null;
  if (financeResult.status === "rejected") {
    errors.push(`finance: ${financeResult.reason?.message ?? "unknown error"}`);
  }

  return {
    timestamp: new Date().toISOString(),
    sales,
    hiring,
    finance,
    errors,
  };
}
```

### Active Lead Filter (verified against 003_sales_schema.sql)

```typescript
// Use positive-inclusion list — safer than .not().in() syntax
const ACTIVE_STATUSES = ["new", "qualified", "contacted", "demo", "proposal", "negotiation", "nurture"] as const;

const { data: leads, error } = await supabase
  .from("leads")
  .select("*")
  .in("status", ACTIVE_STATUSES);

if (error) throw error;
```

### LeadActivity — Last 30 Days Filter

```typescript
const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

const { data: activities, error } = await supabase
  .from("lead_activities")
  .select("*")
  .gte("created_at", cutoff30d);

if (error) throw error;
```

### Active Candidates with Evaluations (separate queries + zip)

```typescript
// Verified types: Candidate, Evaluation, CandidateWithEvaluation from lib/hiring-types.ts
const { data: candidates, error: candidateError } = await supabase
  .from("candidates")
  .select("*")
  .in("status", ["pending", "analyzed"]);

if (candidateError) throw candidateError;

const candidateIds = (candidates ?? []).map(c => c.id);
const { data: evaluations, error: evalError } = candidateIds.length
  ? await supabase.from("evaluations").select("*").in("candidate_id", candidateIds)
  : { data: [], error: null };

if (evalError) throw evalError;

const result: CandidateWithEvaluation[] = (candidates ?? []).map(c => ({
  ...c,
  evaluation: (evaluations ?? []).find(e => e.candidate_id === c.id) ?? null,
}));
```

### Finance Module — Last 90 Days

```typescript
const cutoff90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

const [invoicesResult, expensesResult, runwayResult] = await Promise.all([
  supabase.from("invoices").select("*").gte("created_at", cutoff90d),
  supabase.from("expenses").select("*").gte("created_at", cutoff90d),
  supabase.from("runway_data").select("*").order("created_at", { ascending: false }).limit(1),
  // Note: "runway_data" table name must be confirmed with Phase 1 output
]);

if (invoicesResult.error) throw invoicesResult.error;
if (expensesResult.error) throw expensesResult.error;
// runway failure is non-fatal — return null runway, not throw
const runway = runwayResult.data?.[0] ?? null;

return {
  invoices: invoicesResult.data ?? [],
  expenses: expensesResult.data ?? [],
  runway,
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Finance in localStorage | Finance in Supabase (Phase 1 prerequisite) | Phase 1 | Aggregator can read Finance server-side in cron context |
| Per-module data read inside rule logic | Single aggregator function → rules receive snapshot | This phase | Rules become pure functions with no Supabase dependency |

**Deprecated/outdated:**
- `SalesLead` alias in `lib/sales-types.ts`: This is a backward-compat alias used by mock-data. The canonical type for the snapshot is `Lead` (the full Supabase-aligned interface). Do not use `SalesLead` in `CrossModuleSnapshot`.

---

## Open Questions

1. **RunwayData table name from Phase 1**
   - What we know: `RunwayData` type is defined in `lib/finance-types.ts`; no runway table exists in migrations 001–003
   - What's unclear: What table name Phase 1 creates for stored runway data (e.g., `runway_data`, `finance_runway`, column on a `finance_settings` table)
   - Recommendation: Plan Phase 2 with a `// TODO: confirm table name` placeholder in the finance fetch function; validate against actual Phase 1 migration before implementing

2. **Finance expenses `date` column vs `created_at`**
   - What we know: `expenses` table has both `date timestamptz` and `created_at timestamptz` (from `002_finance_schema.sql`); the `Expense` interface uses `date: string` as the user-facing date field
   - What's unclear: Whether the 90-day filter should use `date` (when the expense occurred) or `created_at` (when it was recorded)
   - Recommendation: Use `date` for the filter — it represents when the expense happened, which is semantically correct for "last 90 days of expenses"

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test directory, no jest.config.*, no vitest.config.*, no pytest.ini |
| Config file | None — Wave 0 must create |
| Quick run command | `npx vitest run lib/intelligence/` (after Wave 0 setup) |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-03 | `buildCrossModuleSnapshot()` returns object with `sales`, `hiring`, `finance`, `errors` keys | unit | `npx vitest run lib/intelligence/data-aggregator.test.ts` | ❌ Wave 0 |
| DATA-03 | Failed module yields `null` module + entry in `errors[]` | unit | `npx vitest run lib/intelligence/data-aggregator.test.ts` | ❌ Wave 0 |
| DATA-03 | Zero-record module yields empty arrays, not null | unit | `npx vitest run lib/intelligence/data-aggregator.test.ts` | ❌ Wave 0 |
| DATA-04 | `CrossModuleSnapshot` type compiles with all required fields | type-check | `npx tsc --noEmit` | ❌ Wave 0 |
| DATA-04 | `CandidateWithEvaluation` is used (not raw Candidate) for hiring sub-snapshot | unit | `npx vitest run lib/intelligence/data-aggregator.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (type check — fast, no test infra needed)
- **Per wave merge:** `npx vitest run lib/intelligence/`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest` dev dependency — `npm install -D vitest`
- [ ] `lib/intelligence/data-aggregator.test.ts` — covers DATA-03 partial-failure contract
- [ ] `lib/intelligence/types.test-d.ts` — type-level tests for DATA-04 shape correctness (optional but valuable)

---

## Sources

### Primary (HIGH confidence)
- Direct codebase: `lib/sales-types.ts` — verified `Lead`, `LeadActivity`, `PIPELINE_STAGES`, `PipelineStage`
- Direct codebase: `lib/hiring-types.ts` — verified `Candidate`, `Evaluation`, `CandidateWithEvaluation`, status enum `pending|analyzed|reviewed`
- Direct codebase: `lib/finance-types.ts` — verified `Invoice`, `Expense`, `RunwayData`, `FinanceStats`
- Direct codebase: `lib/supabase/admin.ts` — verified `createAdminClient()` signature
- Direct codebase: `app/api/cron/evaluate-leads/route.ts` — verified error handling pattern, errors[] accumulation, `createAdminClient()` usage
- Direct codebase: `supabase/migrations/001_initial_schema.sql` — verified `candidates`, `evaluations` tables and status constraints
- Direct codebase: `supabase/migrations/002_finance_schema.sql` — verified `invoices`, `expenses`, `tax_provisions` tables and column names
- Direct codebase: `supabase/migrations/003_sales_schema.sql` — verified `leads`, `lead_activities` tables and all status enum values
- Direct codebase: `.planning/phases/02-unified-data-layer/02-CONTEXT.md` — locked decisions verbatim

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` — prior architecture research with CrossModuleSnapshot shape
- `.planning/research/STACK.md` — confirmed no new dependencies needed

### Tertiary (LOW confidence)
- None — all claims grounded in direct codebase evidence

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all libraries verified in existing codebase
- Architecture: HIGH — `CrossModuleSnapshot` shape derived from verified type files; `buildCrossModuleSnapshot()` pattern derived from verified cron route
- Type definitions: HIGH — all source types verified in `lib/*-types.ts` and confirmed against Supabase migration SQL
- Pitfalls: HIGH — Supabase status enum values verified directly from migration SQL; RunwayData gap confirmed by checking all three migration files
- Validation: MEDIUM — no test framework exists; Wave 0 gap list is accurate but vitest version compatibility with Next.js 16 is not verified

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable domain; types and schema are locked until Phase 1 ships)
