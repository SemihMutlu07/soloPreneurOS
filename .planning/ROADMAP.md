# Roadmap: soloPreneurOS — Cross-Module Intelligence

## Overview

Three isolated OS modules (Sales, Hire, Finance) get connected through a server-side AI intelligence layer. The journey starts with a hard prerequisite — migrating Finance off localStorage so server-side cron jobs can read it — then builds a unified data layer, a deterministic rule engine, persistence infrastructure, an LLM orchestrator, API delivery routes, and finally the user-facing surfaces: a central dashboard feed and per-module contextual nudges. Each phase delivers a verifiable capability; nothing is built until its dependency is proven.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Finance Migration** - Migrate Finance data from localStorage to Supabase so server-side intelligence can read it (completed 2026-03-15)
- [x] **Phase 2: Unified Data Layer** - Build CrossModuleSnapshot type and data aggregator that reads all three modules from Supabase (completed 2026-03-15)
- [x] **Phase 3: Rule Engine** - Implement all 7 deterministic cross-module pattern rules (R1–R7) (completed 2026-03-15)
- [x] **Phase 4: Insights Schema and Cron** - Create cross_module_insights table and wire daily intelligence cron pipeline (completed 2026-03-15)
- [ ] **Phase 5: LLM Orchestrator** - Add Claude-powered narrative synthesis and insight deduplication on top of rule results
- [x] **Phase 6: Intelligence API Routes** - Expose persisted insights via GET/POST routes consumed by UI (completed 2026-03-15)
- [ ] **Phase 7: Dashboard Intelligence Feed** - Central insight feed on home dashboard with severity, freshness, dismiss, and evidence

## Phase Details

### Phase 1: Finance Migration
**Goal**: Finance data persists in Supabase so the server-side intelligence pipeline can read it
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. Finance invoices, expenses, and tax records written in the Finance-OS UI appear in Supabase rows, not localStorage
  2. The Finance-OS page loads its data from Supabase on every visit with no localStorage reads or writes
  3. Existing Finance data (invoices, expenses, KDV calculations) behaves identically after migration — no functional regression
  4. A server-side script or API route can read Finance records without a browser context
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Create Finance API routes (GET invoices/expenses/tax-provisions, POST invoice) using admin client
- [ ] 01-02-PLAN.md — Seed script: insert mock Finance data into Supabase with idempotent upsert
- [ ] 01-03-PLAN.md — Rewrite Finance page and invoice form to fetch from API; remove Finance exports from mock-data.ts

### Phase 2: Unified Data Layer
**Goal**: A single typed snapshot of all three modules' state is available to any server-side intelligence logic
**Depends on**: Phase 1
**Requirements**: DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. A single function call returns a CrossModuleSnapshot containing lead pipeline state, candidate pipeline state, invoice/expense state, and runway metrics
  2. The CrossModuleSnapshot type is the sole interface between data sources and all intelligence logic — no module reads raw Supabase directly from rule or LLM code
  3. Missing or empty module data (e.g., zero invoices) produces a valid snapshot with null/empty fields rather than a runtime error
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Install vitest, define CrossModuleSnapshot types, create test scaffold
- [ ] 02-02-PLAN.md — Implement buildCrossModuleSnapshot() with three module fetchers and passing unit tests

### Phase 3: Rule Engine
**Goal**: Seven deterministic cross-module pattern rules produce actionable insights from a CrossModuleSnapshot
**Depends on**: Phase 2
**Requirements**: RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, RULE-06, RULE-07
**Success Criteria** (what must be TRUE):
  1. Each of the 7 rules (R1–R7) can be invoked independently with a test snapshot and returns either a typed RuleInsight or null
  2. Rules that span multiple modules (R1, R2, R3, R4, R6) correctly fire only when conditions across both modules are simultaneously true
  3. Rules that should not fire on a clean snapshot (no runway issues, no stalled pipeline) return null without errors
  4. All rule field references match live Supabase column names — no silent null returns due to field name mismatches
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Define RuleInsight type, CrossModuleSnapshot type, and isHotLead helper (types foundation)
- [ ] 03-02-PLAN.md — Implement rules R1-R4: runway+hot-leads, hire+runway, deals+candidates, revenue silence
- [ ] 03-03-PLAN.md — Implement rules R5-R7: candidate stall, invoice+payroll, hot-leads no-reply; wire barrel index with runAllRules

### Phase 4: Insights Schema and Cron
**Goal**: Generated insights are persisted to Supabase and the daily cron pipeline runs end-to-end in production
**Depends on**: Phase 3
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. The cross_module_insights Supabase table exists with severity, module_tags, evidence, and dismissal fields
  2. Running the intelligence cron endpoint twice with the same input does not create duplicate insight rows (content-addressed IDs are stable)
  3. The cron endpoint returns 401 for requests without a valid CRON_SECRET bearer token
  4. After a successful cron run, at least one insight row appears in the cross_module_insights table when rule conditions are met in the snapshot
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — Create cross_module_insights Supabase table migration (DDL, indexes, severity CHECK constraint)
- [ ] 04-02-PLAN.md — Define InsightCandidate types and implement persistInsights with SHA256 content-addressed upsert
- [ ] 04-03-PLAN.md — Wire GET /api/cron/run-intelligence endpoint: CRON_SECRET auth, aggregate → rules → persist pipeline

### Phase 5: LLM Orchestrator
**Goal**: Claude generates a narrative summary synthesizing cross-module state, layered on top of rule results
**Depends on**: Phase 4
**Requirements**: LLM-01, LLM-02
**Success Criteria** (what must be TRUE):
  1. After a cron run, a 2-sentence narrative insight record appears in cross_module_insights alongside rule-generated insights
  2. The narrative is generated from summarized module metrics (counts, totals) — not raw lead or invoice arrays — keeping token usage bounded
  3. If the Claude API call fails, rule-generated insights persist normally — no cron run data is lost due to LLM failure
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md — Create lib/claude-narrative.ts: generateNarrative, buildMetricsText, narrativeInsightId, upsertNarrativeInsight (TDD)
- [ ] 05-02-PLAN.md — Extend run-intelligence cron handler with conditional LLM step and end-to-end verification

### Phase 6: Intelligence API Routes
**Goal**: Persisted insights are served to UI components via typed API endpoints
**Depends on**: Phase 5
**Requirements**: (No direct v1 requirements — delivery infrastructure enabling DASH phase)
**Success Criteria** (what must be TRUE):
  1. GET /api/intelligence/insights returns the current insight list ordered by severity and recency
  2. GET /api/intelligence/nudges?module=sales returns only insights tagged with the sales module
  3. POST /api/intelligence/dismiss with a valid insight ID marks that insight as dismissed and it no longer appears in subsequent GET responses
**Plans**: 2 plans

Plans:
- [ ] 06-01-PLAN.md — Implement GET /api/intelligence/insights and GET /api/intelligence/nudges (read endpoints)
- [ ] 06-02-PLAN.md — Implement POST /api/intelligence/dismiss and POST /api/intelligence/trigger with shared pipeline lib

### Phase 7: Dashboard Intelligence Feed
**Goal**: Users can scan all cross-module AI alerts from a central feed on the home dashboard
**Depends on**: Phase 6
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08
**Success Criteria** (what must be TRUE):
  1. The home dashboard shows an intelligence feed card displaying all active (non-dismissed) cross-module insights
  2. Each insight card shows a severity badge (critical / warning / info), a freshness timestamp, and an evidence explanation
  3. Clicking dismiss on an insight card removes it from the feed immediately without a page reload
  4. Clicking the refresh button triggers a new analysis run and updates the feed with fresh results
  5. When no cross-module patterns are detected, the feed shows a clear empty state message rather than a blank area
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Finance Migration | 3/3 | Complete   | 2026-03-15 |
| 2. Unified Data Layer | 2/2 | Complete    | 2026-03-15 |
| 3. Rule Engine | 3/3 | Complete    | 2026-03-15 |
| 4. Insights Schema and Cron | 3/3 | Complete   | 2026-03-15 |
| 5. LLM Orchestrator | 1/2 | In Progress|  |
| 6. Intelligence API Routes | 1/2 | Complete    | 2026-03-15 |
| 7. Dashboard Intelligence Feed | 0/TBD | Not started | - |
