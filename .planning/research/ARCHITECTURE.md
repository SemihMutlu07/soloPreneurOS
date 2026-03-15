# Architecture Patterns: Cross-Module AI Intelligence Layer

**Domain:** AI intelligence layer over multi-module solopreneur OS
**Researched:** 2026-03-15
**Confidence:** HIGH (based on direct codebase analysis, not external search)

---

## Recommended Architecture

The cross-module intelligence layer sits between the three OS modules and the user. It does not replace any existing module architecture — it adds a thin layer that reads from all modules, detects patterns, and writes insights to a shared store.

```
┌─────────────────────────────────────────────────┐
│              PRESENTATION LAYER                  │
│  Dashboard Feed  │  In-Module Nudges (3x)        │
└─────────────────┬──────────────────┬────────────┘
                  │                  │
                  ▼                  ▼
┌─────────────────────────────────────────────────┐
│           INTELLIGENCE DELIVERY LAYER            │
│  GET /api/intelligence/insights                  │
│  GET /api/intelligence/nudges?module=[name]      │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              INSIGHT ENGINE LAYER                │
│  Rule Engine  │  LLM Orchestrator                │
│  (fast, cheap)│  (slow, deep)                    │
│               │                                  │
│  Known patterns:   Novel patterns:               │
│  - lead ↔ invoice  - Open-ended analysis         │
│  - budget ↔ hire   - Narrative synthesis         │
│  - pipeline health                               │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│           UNIFIED DATA ACCESS LAYER              │
│  lib/intelligence/data-aggregator.ts             │
│                                                  │
│  Sales (Supabase) │ Hire (Supabase) │ Finance    │
│  leads table      │ candidates      │ (localStorage│
│  lead_activities  │ evaluations     │  → Supabase) │
└─────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Data Aggregator** (`lib/intelligence/data-aggregator.ts`) | Reads all three modules, normalizes into a shared `CrossModuleSnapshot` type, resolves the localStorage/Supabase split | Finance localStorage, Supabase (leads, candidates, evaluations, invoices) |
| **Rule Engine** (`lib/intelligence/rule-engine.ts`) | Evaluates `CrossModuleSnapshot` against a set of deterministic pattern detectors, emits typed `RuleInsight` objects | Data Aggregator output only |
| **LLM Orchestrator** (`lib/intelligence/llm-orchestrator.ts`) | Assembles a structured context payload from `CrossModuleSnapshot`, calls Claude once per analysis run, parses structured JSON response into `LLMInsight[]` | Data Aggregator output, Claude API |
| **Insight Merger** (`lib/intelligence/insight-merger.ts`) | Deduplicates and priority-ranks rule insights against LLM insights, assigns `module_tags` so nudges can be filtered per-module | Rule Engine output, LLM Orchestrator output |
| **Insights Table** (Supabase `cross_module_insights`) | Persists generated insights with TTL. Single source of truth for both dashboard feed and in-module nudges | Written by cron job, read by API routes |
| **Intelligence API** (`app/api/intelligence/insights/route.ts`, `nudges/route.ts`) | Serves persisted insights to UI. `/insights` returns all; `/nudges?module=sales` returns only insights tagged for that module | Insights table |
| **Intelligence Cron** (`app/api/cron/run-intelligence/route.ts`) | Scheduled trigger (daily or on-demand). Calls Data Aggregator → Rule Engine + LLM Orchestrator in parallel → Insight Merger → writes to insights table | All lib/intelligence/* modules |
| **Dashboard Intelligence Feed** (`components/intelligence/insight-feed.tsx`) | Renders persisted insights as a live feed card on the home dashboard. Polls GET /api/intelligence/insights. Reuses AgentCardWrapper pattern | Intelligence API |
| **In-Module Nudge Strip** (`components/intelligence/nudge-strip.tsx`) | Renders module-filtered insights as a compact horizontal strip at the top of each OS module page. Fetches `/nudges?module=[name]` | Intelligence API |

---

## Data Flow

### Cron Run (Analysis Path)

```
1. Vercel cron triggers GET /api/cron/run-intelligence (daily at 04:00)
2. Data Aggregator assembles CrossModuleSnapshot:
   a. Supabase: SELECT from leads, candidates, evaluations (server client)
   b. Finance localStorage snapshot: not available server-side
      → Finance must be migrated to Supabase (see note below)
   c. Returns typed snapshot: { leads[], candidates[], evaluations[], invoices[], expenses[], timestamp }
3. Rule Engine and LLM Orchestrator run in parallel:
   a. Rule Engine: evaluates snapshot against pattern library → RuleInsight[]
   b. LLM Orchestrator: assembles structured context string → POST to Claude → parses JSON → LLMInsight[]
4. Insight Merger: deduplicates, ranks, adds module_tags, creates final Insight[]
5. Cron route: upserts Insight[] to cross_module_insights table (replace previous day's run)
6. Return { generated: N, rules: M, llm: K } summary
```

### UI Read Path (Display Path)

```
1. Dashboard home loads → IntelligenceFeed component mounts
2. Component fetches GET /api/intelligence/insights
3. Route handler: SELECT from cross_module_insights WHERE dismissed = false ORDER BY priority
4. Component renders insight cards using existing AgentCardWrapper pattern
5. In-module: Sales page loads → NudgeStrip fetches GET /api/intelligence/nudges?module=sales
6. Route returns insights WHERE 'sales' = ANY(module_tags)
7. NudgeStrip renders compact pills/alerts above the lead table
```

### Finance Data Migration Note

Finance currently uses localStorage — this is the single biggest blocker for the data aggregator. The architecture requires Finance to move to Supabase before cross-module analysis is possible.

**Required pre-work:** Add migration `004_finance_migrate.sql` to move invoices, expenses, and tax_provisions from localStorage to existing Supabase tables (schema already exists in `002_finance_schema.sql`). Finance-OS writes to Supabase instead of localStorage. Without this, rule engine has no access to Finance data during cron execution.

---

## Key Data Types

### CrossModuleSnapshot

```typescript
// lib/intelligence/types.ts
export interface CrossModuleSnapshot {
  timestamp: string;
  sales: {
    leads: Lead[];               // from Supabase leads table
    activities: LeadActivity[];
  };
  hiring: {
    candidates: Candidate[];     // from Supabase candidates table
    evaluations: Evaluation[];
  };
  finance: {
    invoices: Invoice[];         // from Supabase (after migration)
    expenses: Expense[];
    runway: RunwayData;
  };
}
```

### Insight

```typescript
export interface Insight {
  id: string;
  type: "cross_module" | "single_module";
  priority: "critical" | "warning" | "opportunity" | "info";
  title: string;
  body: string;
  module_tags: Array<"sales" | "hiring" | "finance" | "dashboard">;
  source: "rule" | "llm";
  rule_id?: string;              // if source === "rule", which rule fired
  supporting_data?: Record<string, unknown>; // entity IDs for deep-linking
  created_at: string;
  dismissed: boolean;
  ttl_hours: number;             // default 24; critical alerts may be 48
}
```

### Supabase Schema Addition

```sql
-- 005_intelligence_schema.sql
create table cross_module_insights (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('cross_module', 'single_module')),
  priority text not null check (priority in ('critical', 'warning', 'opportunity', 'info')),
  title text not null,
  body text not null,
  module_tags text[] not null default '{}',
  source text not null check (source in ('rule', 'llm')),
  rule_id text,
  supporting_data jsonb,
  dismissed boolean not null default false,
  ttl_hours int not null default 24,
  created_at timestamptz not null default now()
);

create index idx_insights_priority on cross_module_insights(priority);
create index idx_insights_dismissed on cross_module_insights(dismissed);
create index idx_insights_module_tags on cross_module_insights using gin(module_tags);
```

---

## Rule Engine: Patterns to Implement

Rules are pure functions. Each takes a `CrossModuleSnapshot` and returns `RuleInsight | null`. Easy to add without modifying orchestration logic.

| Rule ID | Pattern | Data Sources | Priority |
|---------|---------|--------------|----------|
| `OVERDUE_INVOICE_HIGH_LEAD` | Invoice overdue AND client name matches active lead company | Finance + Sales | critical |
| `BUDGET_TIGHT_HIRE_ACTIVE` | Runway < 3 months AND candidates in "analyzed" status | Finance + Hire | critical |
| `PIPELINE_STALL_WITH_REVENUE` | No leads moved stages in 7 days AND invoices pending | Sales + Finance | warning |
| `CANDIDATE_DELAY_DEMO_PRESSURE` | Active demo scheduled AND no hiring decision in 14 days | Hire + Sales | warning |
| `STRONG_LEADS_LOW_REVENUE` | 3+ leads with ai_score > 70 AND runway < 2 months | Sales + Finance | opportunity |
| `WON_DEAL_NO_INVOICE` | Lead moved to "won" AND no new invoice in 72 hours | Sales + Finance | warning |

Each rule is a named function in `lib/intelligence/rules/` with its own file. The rule engine imports all of them and calls each in sequence.

---

## LLM Orchestrator Design

The orchestrator calls Claude **once per cron run** with a structured context payload. This is not a per-entity evaluation — it is a holistic synthesis call.

**System prompt role:** "You are a cross-module business analyst for a solopreneur. You receive structured data from Sales, Hiring, and Finance and identify non-obvious patterns that matter."

**Context structure sent to Claude:**

```
SALES SUMMARY: [N leads, stage distribution, avg score, top 3 hot leads]
HIRING SUMMARY: [N candidates, recommendation distribution, oldest pending]
FINANCE SUMMARY: [revenue TL, expenses, runway months, overdue invoices]
RECENT ACTIVITIES: [last 10 activities across all modules]
```

**Requested output (JSON array):**

```json
[
  {
    "title": "...",
    "body": "...",
    "priority": "critical|warning|opportunity|info",
    "module_tags": ["sales", "finance"]
  }
]
```

**Token budget:** ~1500 tokens context, ~500 tokens response. Single call. Fail gracefully — if LLM call fails, rule insights still get persisted.

**Model choice:** `claude-haiku-4` for cost efficiency (this runs daily; Sonnet cost is unjustified for a synthesis summary). Fallback to Sonnet if Haiku unavailable.

---

## Patterns to Follow

### Pattern 1: Extend AgentCardWrapper for Intelligence Feed

The existing `AgentCardWrapper` + localStorage cache pattern used by `chief-of-staff.tsx` and `market-scout.tsx` is proven. The intelligence feed reuses it: component checks Supabase-backed API instead of localStorage, but UI structure is identical.

**What to NOT do:** Do not create new component primitives. Extend the existing pattern.

### Pattern 2: Server-Side Insight Generation

All insight generation happens server-side in cron jobs. UI components are consumers only. This prevents runaway Claude API calls from multiple browser tabs.

### Pattern 3: Module Tag Filtering for Nudges

Every insight carries a `module_tags` array. This allows a single insights table and API to serve both the global feed and per-module nudges without duplication. A "sales lead stalling, invoice overdue" insight gets `["sales", "finance", "dashboard"]` — appears everywhere relevant.

### Pattern 4: Rule-First, LLM-Second

Rules fire first. LLM receives the rule results as context so it doesn't rediscover what rules already found. This avoids LLM hallucinating patterns that rule engine already handles cheaply.

```typescript
// In intelligence cron route
const [ruleInsights, llmInsights] = await Promise.all([
  runRuleEngine(snapshot),
  runLLMOrchestrator(snapshot, ruleInsights), // pass rule results as context
]);
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Per-Render Claude Calls

**What:** Calling Claude in a React component or API route on every page load.
**Why bad:** The existing `brief` route already costs one Claude call per load. Cross-module analysis would add N more per-page calls. API costs scale with traffic.
**Instead:** Generate insights once per cron run, persist to Supabase, serve from database.

### Anti-Pattern 2: Mixing Finance localStorage with Server Logic

**What:** Attempting to read Finance data in cron jobs by simulating localStorage server-side.
**Why bad:** localStorage is browser-only. There is no server-side Finance data until migration happens.
**Instead:** Finance migration to Supabase is a hard prerequisite. Do it in Phase 1 of the milestone.

### Anti-Pattern 3: Single Monolithic LLM Prompt

**What:** Sending all raw data (814-line mock-data equivalent) to Claude in one giant prompt.
**Why bad:** Context window fills fast. Claude loses precision on specific entity names and numbers. Cost is high.
**Instead:** Send summaries and counts with key outliers. "12 leads, avg score 54, 3 overdue invoices totaling 95,000 TL, 1 candidate awaiting decision for 18 days." Claude reasons about patterns, not raw records.

### Anti-Pattern 4: Intelligence Data in localStorage

**What:** Caching insights in localStorage the way agent results currently are.
**Why bad:** localStorage insights are not available on Hire-OS or Finance-OS pages. In-module nudges require a shared store.
**Instead:** Supabase as the single source of truth for all persisted insights. localStorage may be used only for short-term UI state (dismissed state optimistic update).

---

## Build Order (Phase Dependencies)

The components have strict dependencies. Building in wrong order causes rework.

```
Phase 1: Finance Supabase Migration (BLOCKER)
  └─ Without this, Data Aggregator cannot read Finance data server-side
  └─ All subsequent phases depend on this

Phase 2: Data Aggregator + Intelligence Types
  └─ Shared CrossModuleSnapshot type used by Rule Engine and LLM Orchestrator
  └─ Must exist before any engine can be written

Phase 3: Rule Engine
  └─ Pure functions, no external dependencies, easiest to test
  └─ Provides immediate value (6+ patterns) before LLM is ready
  └─ Rule results feed into LLM context (see Pattern 4)

Phase 4: Insights Schema + Cron Infrastructure
  └─ Supabase migration for cross_module_insights table
  └─ Cron route that wires Data Aggregator → Rule Engine → DB write
  └─ Vercel cron schedule addition to vercel.json
  └─ Can validate rule engine produces real insights before LLM added

Phase 5: LLM Orchestrator
  └─ Claude call for novel pattern discovery
  └─ Requires Phase 3 complete (rule results are LLM context)
  └─ Update cron to run Rule Engine + LLM Orchestrator in parallel

Phase 6: Intelligence API Routes
  └─ GET /api/intelligence/insights
  └─ GET /api/intelligence/nudges?module=[name]
  └─ POST /api/intelligence/dismiss (mark insight dismissed)

Phase 7: Dashboard Intelligence Feed
  └─ New AgentCardWrapper-pattern card on home page
  └─ Requires Phase 6 API routes

Phase 8: In-Module Nudge Strips
  └─ NudgeStrip component added to Sales, Hire, Finance pages
  └─ Requires Phase 6 nudges endpoint
```

---

## Scalability Considerations

| Concern | At Current Scale (1 user) | At Future Scale |
|---------|--------------------------|-----------------|
| Cron frequency | Daily (04:00) is sufficient | On-demand trigger on significant data changes |
| LLM cost | 1 call/day at ~$0.01 = ~$3/month (Haiku) | Batch insights if multi-tenant |
| Insights table growth | ~5-10 insights/day, auto-expire after TTL | Add scheduled cleanup cron for TTL'd records |
| Rule engine latency | <50ms, pure TS functions | No concern at any scale |
| Finance migration | localStorage → Supabase is one-time migration | Finance writes to Supabase going forward |

---

## Integration Points with Existing Code

| Existing File | Change Required |
|---------------|----------------|
| `lib/finance-types.ts` | No change — types already defined correctly |
| `lib/sales-types.ts` | No change |
| `lib/hiring-types.ts` | No change |
| `app/finance/page.tsx` | Read from Supabase instead of localStorage after migration |
| `vercel.json` | Add `{ "path": "/api/cron/run-intelligence", "schedule": "0 4 * * *" }` |
| `lib/constants.ts` | Add `INTELLIGENCE_TTL_HOURS = 24`, `INTELLIGENCE_MAX_INSIGHTS = 20` |
| `app/page.tsx` | Add `<IntelligenceFeed />` card to dashboard grid |
| `app/sales/page.tsx`, `app/hiring/page.tsx`, `app/finance/page.tsx` | Add `<NudgeStrip module="[name]" />` at top of page content |

No existing files need structural changes. All new code goes into `lib/intelligence/` and `components/intelligence/`. New API routes go into `app/api/intelligence/` and `app/api/cron/run-intelligence/`.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Component boundaries | HIGH | Derived from direct codebase analysis of all existing patterns |
| Data flow | HIGH | Based on reading actual API routes, Supabase schema, localStorage usage |
| Finance localStorage blocker | HIGH | Confirmed: `lib/profile-store.ts`, `agent-store.ts`, Finance components all use localStorage; no server-side Finance reads exist |
| Rule patterns | MEDIUM | Patterns chosen from PROJECT.md requirements; exact field matching (e.g., client_name = company) needs validation against live data quality |
| LLM orchestrator prompt design | MEDIUM | Pattern is proven (see `/api/brief/route.ts`); token budgets are estimates |
| Build order | HIGH | Dependency chain derived from actual code; Finance migration is genuinely blocking |

---

## Sources

All findings derived from direct analysis of the codebase at `/home/parkermutsuz/dev/soloPreneurOS`:

- `lib/agent-store.ts` — localStorage agent cache pattern
- `lib/claude-sales-eval.ts`, `lib/claude-eval.ts` — existing Claude integration patterns
- `app/api/brief/route.ts` — LLM orchestration pattern (context assembly + single Claude call)
- `supabase/migrations/001-003_*.sql` — confirmed schema for all three OS modules
- `app/page.tsx`, `components/agents/chief-of-staff.tsx` — AgentCardWrapper + dashboard pattern
- `.planning/codebase/ARCHITECTURE.md` — existing architectural documentation
- `.planning/codebase/CONCERNS.md` — known issues including localStorage/Supabase split
- `vercel.json` — confirmed cron infrastructure already in place
