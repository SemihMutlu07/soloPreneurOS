# Project Research Summary

**Project:** soloPreneurOS — Cross-Module AI Intelligence Layer
**Domain:** AI insight aggregation over a multi-module solopreneur operating system
**Researched:** 2026-03-15
**Confidence:** HIGH (all research grounded in direct codebase analysis)

## Executive Summary

This milestone adds a cross-module intelligence layer on top of a working three-module solopreneur OS (Sales, Hire, Finance). The product already runs Claude API calls for per-module analysis (lead scoring, candidate evaluation, daily briefs). The intelligence layer's job is to detect patterns that span modules — scenarios where a sales pipeline signal combined with a finance signal should change solopreneur behavior. Research across all four domains converges on the same architecture: a server-side insight pipeline that runs on a cron schedule, uses a hybrid rules-first/LLM-second engine, persists insights to Supabase, and serves them to both a central dashboard feed and per-module contextual nudges.

The recommended approach builds no new dependencies. The existing stack (Next.js 16, @anthropic-ai/sdk, Supabase, Vercel Cron) is sufficient. All intelligence logic lives in new `lib/intelligence/` modules — pure TypeScript rule functions, a data aggregator, an LLM orchestrator, and an insight merger. Zero new npm packages are required unless Finance migration introduces date arithmetic needs (in which case `date-fns` is the standard choice). The key architectural decision is to use Supabase as the single source of truth for generated insights, enabling per-module nudges without any cross-page state management.

The single highest-risk item across all four research files is unanimous: Finance data lives in browser `localStorage` and is therefore invisible to server-side cron jobs. Cross-module intelligence involving Finance is impossible without resolving this first. This is not a nice-to-have prerequisite — it is a hard blocker. Migrating Finance to Supabase must be Phase 1. Everything else follows in a clear dependency chain.

## Key Findings

### Recommended Stack

The intelligence layer requires zero new production dependencies. The existing @anthropic-ai/sdk pattern (direct API call with structured prompt + regex JSON strip) is already proven in `lib/claude-sales-eval.ts` and should be extended, not replaced. Rule engines, LLM orchestration frameworks, and external caching services are all explicitly rejected: they add dependency weight and operational overhead with no benefit at single-user scale. The existing Vercel Cron infrastructure handles scheduling; Supabase handles persistence.

**Core technologies:**
- `@anthropic-ai/sdk` (existing 0.78.0): All Claude calls — extend the existing `messages.create()` pattern
- Supabase PostgreSQL (existing): Insight persistence via new `cross_module_insights` table; Finance migration target
- Vercel Cron (existing `vercel.json`): Schedule insight pipeline at `0 4 * * *`; no queue infrastructure needed
- Hand-written TypeScript rule functions (`lib/intelligence/rules/`): 6-7 deterministic pattern detectors; no rule engine library
- `lib/intelligence/data-aggregator.ts` (new): Resolves the localStorage/Supabase heterogeneity into a single `CrossModuleSnapshot`

**Explicitly rejected:**
- LangChain / LlamaIndex — 15+ MB for orchestration this codebase handles in 20 lines of TypeScript
- Vercel AI SDK — optimized for streaming chat UIs; this milestone is proactive cron-driven alerting
- Redis / Upstash — single user, polling model; Supabase rows ARE the cache
- `json-rules-engine` — <20 rules; TypeScript functions are simpler, typesafe, and testable

### Expected Features

**Must have (table stakes):**
- Central insight feed — one place to scan all cross-module AI alerts
- Cross-module rule-based correlations (R1-R7 rule set covers Finance/Sales/Hire intersections)
- Severity levels (critical / warning / info) — without urgency ranking, users stop reading
- Freshness timestamps on each insight card — AI systems lose trust if data age is hidden
- Dismiss / acknowledge actions — without clearing, the feed becomes noise
- Per-insight evidence explanation — "why this?" must be answered to build user trust
- Manual refresh / on-demand trigger — scheduled cron alone is insufficient
- Empty state handling — clear messaging when no cross-module patterns are detected

**Should have (differentiators):**
- In-module contextual nudges — Finance context appears inside Sales module, no context switching needed
- Hybrid AI engine (rules + LLM) — rules catch known patterns cheaply; LLM covers novel combinations
- Insight narrative summaries — 2-sentence morning briefing synthesizing cross-module state
- Insight-to-action deep links — each insight card routes directly to the relevant lead/invoice/candidate
- Insight confidence scoring — expose per-insight confidence level to prevent false positives polluting feed
- Hire-pipeline tension detection — "3 open roles, 45 days of runway" alert

**Defer to v2+:**
- Pattern history / trend detection — requires persisting insight records over time; adds migration complexity
- Finance-aware pipeline scoring (re-scoring individual leads by runway) — risky scope change to existing Sales behavior
- Natural language chat interface — explicitly deferred in PROJECT.md
- Auto-actions (AI executes without confirmation) — trust not yet established
- Email/push notification digests — out of scope for in-app intelligence layer

**The 7 MVP rules to hardcode (prioritized order):**

| Rule | Pattern | Modules |
|------|---------|---------|
| R1 | Runway < 60 days AND hot leads in pipeline | Finance + Sales |
| R2 | Open hire roles AND runway < 90 days | Finance + Hire |
| R3 | Deals closed AND candidates advancing simultaneously | Sales + Hire |
| R4 | No invoices sent in 14 days AND no leads won | Finance + Sales |
| R5 | Candidate pipeline stalled 7 days AND capacity gap | Hire |
| R6 | Large invoice overdue AND upcoming payroll cost | Finance |
| R7 | Multiple hot leads AND no reply sent in 48 hrs | Sales |

### Architecture Approach

The intelligence layer sits between the three OS modules and the user as a thin read-and-analyze tier. It never writes to module data; it only reads cross-module state, detects patterns, and writes to its own `cross_module_insights` table. All generation is server-side and async (cron-driven). UI components are consumers only. The Rule Engine and LLM Orchestrator run in parallel per cron cycle, with rule results passed as context to the LLM call so Claude does not rediscover patterns rules already handle cheaply.

**Major components:**
1. **Data Aggregator** (`lib/intelligence/data-aggregator.ts`) — reads Sales/Hire from Supabase, Finance from Supabase (post-migration), normalizes into `CrossModuleSnapshot`
2. **Rule Engine** (`lib/intelligence/rule-engine.ts`) — pure TypeScript functions, deterministic, zero external dependencies; each rule is a named function returning `RuleInsight | null`
3. **LLM Orchestrator** (`lib/intelligence/llm-orchestrator.ts`) — single Claude call per cron run with summarized context (~1500 tokens), not raw records; uses Haiku for cost efficiency
4. **Insight Merger** (`lib/intelligence/insight-merger.ts`) — deduplicates rule vs LLM results, assigns `module_tags`, limits feed to 3-5 actionable items
5. **Intelligence Cron** (`app/api/cron/run-intelligence/route.ts`) — wires the full pipeline; runs daily at 04:00 after existing eval crons
6. **Intelligence API** (`app/api/intelligence/insights/route.ts`, `nudges/route.ts`) — serves persisted insights to dashboard and per-module pages
7. **Dashboard Feed** (`components/intelligence/insight-feed.tsx`) — extends AgentCardWrapper pattern; polls GET /api/intelligence/insights
8. **NudgeStrip** (`components/intelligence/nudge-strip.tsx`) — compact per-module alert strip; fetches `/nudges?module=[name]`

### Critical Pitfalls

1. **Finance data is invisible to cron jobs** — Finance-OS uses browser localStorage; any server-side intelligence pipeline reads zero Finance data. Must migrate Finance to Supabase before writing a single line of insight logic. Attempting to build insight logic first creates a complete rewrite.

2. **Per-render Claude API calls cause cost explosion** — The existing agent card pattern calls Claude on every component mount if cache is stale. Cross-module analysis is 3-5x more expensive per token. Enforce: insights generated only by cron, minimum 4-hour TTL for LLM insights, served from Supabase cache. Never call Claude from a `useEffect`.

3. **Mock data contaminating real insights** — `app/api/brief/route.ts` already imports from `lib/mock-data.ts` (814 lines) and passes mock leads to Claude as if real. Cross-module insight engine built on this will generate confident, completely fabricated insights. Audit all data sources and add `NODE_ENV` guards before insight engine development.

4. **Alert fatigue from low-signal insights** — Every rule pattern emitted without an actionability filter trains the user to ignore the feed within 1-2 weeks. Apply the test: "If this insight surfaces, what does the user do in the next 24 hours?" If the answer is "nothing," don't emit it. Cap feed at 3-5 insights maximum.

5. **Token bloat from raw context assembly** — Passing full arrays from all three modules to Claude produces expensive, slow calls and increases hallucination risk (Claude finds spurious correlations in noise). Send summaries and counts: "3 leads scoring >70, pipeline 450K TRY" not full lead objects. Define a token budget per module (~500 tokens each).

## Implications for Roadmap

Based on research, the dependency chain is completely deterministic. The ARCHITECTURE.md build order and PITFALLS.md phase warnings converge on the same 8-phase structure.

### Phase 1: Finance Supabase Migration
**Rationale:** Hard blocker for all subsequent phases. No server-side Finance data = no cross-module intelligence. Building anything else first creates complete rewrites. This is the unanimous conclusion across all four research files.
**Delivers:** Finance invoices, expenses, and tax data in Supabase tables; Finance-OS page reads/writes Supabase instead of localStorage
**Addresses:** Pitfall 1 (Finance invisible to server), Pitfall 10 (localStorage race conditions)
**Avoids:** The entire category of insight logic that silently uses mock data or returns empty Finance arrays

### Phase 2: Unified Data Layer + Intelligence Types
**Rationale:** Once Finance is in Supabase, the data aggregator can be built. Shared `CrossModuleSnapshot` and `Insight` types must exist before Rule Engine or LLM Orchestrator can be written — both consume these types.
**Delivers:** `lib/intelligence/types.ts`, `lib/intelligence/data-aggregator.ts`, `lib/business-context.ts` (single source of truth for Claude context), `lib/claude-config.ts` (single `CLAUDE_MODEL` constant)
**Addresses:** Pitfall 7 (type drift between modules), Pitfall 12 (model version fragmentation), Pitfall 6 (hardcoded business context)
**Implements:** Data Aggregator component

### Phase 3: Rule Engine
**Rationale:** Pure functions with no external dependencies — safest thing to build and test first. Provides immediate insight value (6 patterns) before LLM is integrated. Rule results feed as context into the LLM orchestrator (Pattern 4 from ARCHITECTURE.md).
**Delivers:** `lib/intelligence/rule-engine.ts` with all 7 MVP rules (R1-R7); fully testable without Claude API
**Addresses:** Pitfall 4 (alert fatigue) — rules have deterministic actionability criteria baked in
**Uses:** CrossModuleSnapshot types from Phase 2

### Phase 4: Insights Schema + Cron Infrastructure
**Rationale:** The pipeline needs a destination before it can run end-to-end. Schema must include content-addressed IDs (Pitfall 11) and dismissal fields from day one — retrofitting these later breaks existing dismissed state.
**Delivers:** Supabase migration `005_intelligence_schema.sql` (cross_module_insights table); `app/api/cron/run-intelligence/route.ts`; vercel.json cron entry; validates rule engine produces real insights in production
**Addresses:** Pitfall 11 (unstable insight IDs), Pitfall 2 (per-render cost explosion — caching model established here), Pitfall 8 (cron overlap — explicit sequencing after evaluate-leads)
**Implements:** Intelligence Cron, Insights Table

### Phase 5: LLM Orchestrator
**Rationale:** Rule engine must exist first so rule results can be passed as context to Claude (avoids rediscovery). Context assembly design must enforce summarization (not raw records) and token budget per module before writing the call.
**Delivers:** `lib/intelligence/llm-orchestrator.ts` using claude-haiku for cost efficiency; structured JSON output; graceful fallback (rule insights persist even if LLM call fails); Insight Merger with deduplication
**Addresses:** Pitfall 5 (token bloat), Pitfall 3 (mock data contamination — LLM gets only real aggregated data)
**Implements:** LLM Orchestrator, Insight Merger components

### Phase 6: Intelligence API Routes
**Rationale:** UI cannot be built without the API. These are thin read routes — low complexity, but they must exist before any component work.
**Delivers:** `GET /api/intelligence/insights`, `GET /api/intelligence/nudges?module=[name]`, `POST /api/intelligence/dismiss`
**Implements:** Intelligence Delivery Layer from architecture diagram

### Phase 7: Dashboard Intelligence Feed
**Rationale:** Central feed is the highest-visibility feature; in-module nudges depend on the same API. Build central first to validate the full pipeline end-to-end before adding module-specific surfaces.
**Delivers:** `components/intelligence/insight-feed.tsx` (AgentCardWrapper pattern); insight cards with severity, freshness, explanation, dismiss action, deep-link; manual refresh trigger
**Addresses:** Table stakes features: central insight feed, severity levels, freshness timestamps, dismiss actions, per-insight explanation, empty states
**Avoids:** Pitfall 4 (alert fatigue) — feed capped at 3-5 insights enforced at render layer

### Phase 8: In-Module Contextual Nudges
**Rationale:** Last because it depends on the full pipeline (Phases 1-6) being stable. Also the highest-risk for user annoyance if relevance thresholds are wrong (Pitfall 9) — building it last means thresholds can be informed by what users actually find useful in the dashboard feed.
**Delivers:** `components/intelligence/nudge-strip.tsx` added to Sales, Hire, Finance pages; module-filtered via `module_tags`; dismissable with relevance thresholds
**Addresses:** Differentiator: in-module contextual nudges; Pitfall 9 (intrusive nudges — threshold enforced per nudge type)

### Phase Ordering Rationale

- Finance migration (Phase 1) cannot be deferred — it is a prerequisite for all server-side data reads
- Data layer (Phase 2) must precede all logic that operates on the snapshot type
- Rules before LLM (Phase 3 before Phase 5) — rule results become LLM context; also rules are cheaper to validate first
- Schema before UI (Phase 4 before Phase 7) — UI components are consumers of persisted data, not generators
- Central feed before module nudges (Phase 7 before Phase 8) — validates full pipeline; nudges reuse same API

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Finance Migration):** Verify `002_finance_schema.sql` column names match `lib/finance-types.ts` exactly; validate all Finance localStorage keys before writing migration
- **Phase 5 (LLM Orchestrator):** Verify current Haiku model ID at implementation time — research notes `claude-haiku-3-5` with MEDIUM confidence; check Anthropic docs for correct identifier

Phases with standard patterns (skip research-phase):
- **Phase 2 (Data Layer):** TypeScript module creation; well-established patterns in this codebase
- **Phase 3 (Rule Engine):** Pure functions; zero external dependencies; no novel patterns
- **Phase 4 (Schema + Cron):** Directly mirrors existing cron infrastructure (`evaluate-leads` pattern)
- **Phase 6 (API Routes):** Standard Next.js route handlers; mirrors existing intelligence API shape
- **Phase 7 (Dashboard Feed):** Extends existing AgentCardWrapper pattern directly
- **Phase 8 (Nudge Strip):** UI component consuming existing API; no new patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All decisions grounded in direct codebase analysis; no external sources needed — existing patterns determine the choices |
| Features | MEDIUM | Table stakes and MVP rules well-reasoned from codebase + PROJECT.md; industry analogues (HubSpot AI, Linear AI) inferred from domain expertise without live verification |
| Architecture | HIGH | Component boundaries, data flow, and build order derived from reading actual API routes, Supabase schemas, and localStorage patterns in the codebase |
| Pitfalls | HIGH | All 12 pitfalls reference specific files with line-level evidence; no speculative pitfalls included |

**Overall confidence:** HIGH

### Gaps to Address

- **Claude Haiku model ID:** Research uses `claude-haiku-3-5` as placeholder with MEDIUM confidence. Verify exact model identifier against Anthropic docs before writing the LLM orchestrator. The constant in `lib/claude-config.ts` (Phase 2) makes this a one-line fix.
- **Finance localStorage key inventory:** Before writing the migration, enumerate all localStorage keys Finance-OS uses (keys like `finance_invoices`, `finance_expenses` etc.) and confirm the `002_finance_schema.sql` column names match `lib/finance-types.ts` field names exactly. Mismatches here cause silent data loss.
- **Rule field name validation:** ARCHITECTURE.md notes that the mock `Lead` type uses `stage`/`value`/`lastContact` while the canonical Supabase type uses `status`/`deal_value`/`last_contact_at`. Rules referencing wrong field names will silently return null for every lead. Validate all 7 rule implementations against live Supabase schema before shipping Phase 3.
- **Content-addressed insight ID scheme:** The hash function for stable insight IDs (Pitfall 11) needs a defined implementation — hash(type + key entity IDs + date bucket) is the recommended approach but the exact scheme should be decided in Phase 4 schema design.

## Sources

### Primary (HIGH confidence)
- `lib/claude-sales-eval.ts` — existing Claude integration pattern, hardcoded business context
- `lib/agent-store.ts`, `lib/profile-store.ts` — localStorage persistence patterns
- `app/api/brief/route.ts` — LLM context assembly pattern; mock data contamination evidence
- `app/api/cron/evaluate-leads/route.ts` — cron infrastructure pattern; bearer-token auth
- `supabase/migrations/001-003_*.sql` — confirmed schema for all three modules
- `app/page.tsx`, `components/agents/chief-of-staff.tsx` — AgentCardWrapper + dashboard grid pattern
- `lib/mock-data.ts` — mock data mixed with production logic (814 lines)
- `vercel.json` — confirmed cron infrastructure
- `.planning/PROJECT.md` — explicit constraints: "extend existing stack", "defer conversational AI", "polling/cron sufficient"
- `.planning/codebase/ARCHITECTURE.md` — existing architectural documentation
- `.planning/codebase/CONCERNS.md` — known issues including localStorage/Supabase split

### Secondary (MEDIUM confidence)
- Industry analogues: HubSpot AI Insights, Linear AI triage, Notion AI summaries, Superhuman triage — used for feature reasoning and UX expectations without live verification
- Anthropic model naming conventions — Haiku vs Sonnet tier relationships; model IDs should be verified at implementation time

---
*Research completed: 2026-03-15*
*Ready for roadmap: yes*
