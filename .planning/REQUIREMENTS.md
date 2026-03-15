# Requirements: soloPreneurOS — Cross-Module Intelligence

**Defined:** 2026-03-15
**Core Value:** The AI connects dots across modules that a solopreneur would otherwise miss

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Data Infrastructure

- [ ] **DATA-01**: Finance invoices, expenses, and tax data persist in Supabase instead of localStorage
- [ ] **DATA-02**: Finance-OS page reads and writes from Supabase with no localStorage dependency
- [ ] **DATA-03**: Unified data aggregator reads Sales, Hire, and Finance from Supabase into a single CrossModuleSnapshot
- [ ] **DATA-04**: CrossModuleSnapshot type captures lead pipeline, candidate pipeline, invoice/expense state, and runway metrics

### Rule Engine

- [ ] **RULE-01**: Rule R1 fires when runway < 60 days AND hot leads exist in pipeline (Finance + Sales)
- [ ] **RULE-02**: Rule R2 fires when open hire roles exist AND runway < 90 days (Finance + Hire)
- [ ] **RULE-03**: Rule R3 fires when deals close AND candidates advance simultaneously (Sales + Hire)
- [ ] **RULE-04**: Rule R4 fires when no invoices sent in 14 days AND no leads marked won (Finance + Sales)
- [ ] **RULE-05**: Rule R5 fires when candidate pipeline stalls 7+ days AND capacity gap exists (Hire)
- [ ] **RULE-06**: Rule R6 fires when large invoice overdue AND upcoming payroll cost (Finance)
- [ ] **RULE-07**: Rule R7 fires when multiple hot leads AND no reply sent in 48 hours (Sales)

### Intelligence Infrastructure

- [ ] **INFRA-01**: cross_module_insights Supabase table stores insights with severity, module_tags, evidence, and dismissal state
- [ ] **INFRA-02**: Insight records use content-addressed IDs to prevent duplicates across cron runs
- [ ] **INFRA-03**: Intelligence cron job runs daily, executing data aggregation then rule engine then persist pipeline
- [ ] **INFRA-04**: Cron endpoint validates bearer token authorization (CRON_SECRET pattern)

### LLM Analysis

- [ ] **LLM-01**: Claude generates a 2-sentence narrative summary synthesizing cross-module state after rules run
- [ ] **LLM-02**: Narrative summary uses summarized module context (counts and key metrics), not raw records

### Dashboard Feed

- [ ] **DASH-01**: Central intelligence feed on home dashboard shows insight cards from cross_module_insights
- [ ] **DASH-02**: Each insight card displays severity level (critical/warning/info) with visual badge
- [ ] **DASH-03**: Each insight card shows freshness timestamp ("generated X minutes ago")
- [ ] **DASH-04**: User can dismiss/acknowledge individual insight cards
- [ ] **DASH-05**: Each insight card shows evidence explanation ("why this?" with supporting data points)
- [ ] **DASH-06**: User can manually trigger re-analysis via refresh button
- [ ] **DASH-07**: Empty state shown when no cross-module patterns are detected
- [ ] **DASH-08**: Intelligence feed extends existing agent card pattern (AgentCardWrapper)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### LLM Enhancement

- **LLM-03**: Claude-powered open-ended pattern discovery for novel cross-module correlations
- **LLM-04**: Per-insight confidence scoring (HIGH/MEDIUM/LOW) based on signal count

### Advanced UI

- **NUDGE-01**: In-module contextual nudge strips inside Sales, Hire, Finance pages
- **NUDGE-02**: Module-filtered nudges via module_tags
- **NUDGE-03**: Insight-to-action deep links from insight card to relevant record

### Intelligence

- **INTEL-01**: Pattern history and trend detection over time
- **INTEL-02**: Finance-aware lead pipeline scoring (adjust lead urgency by runway)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Natural language chat interface | Focus on proactive alerts first; conversational AI is a separate product |
| Auto-actions (AI executes without confirmation) | Trust in AI not yet established; alerts only for v1 |
| Email/push notification digests | In-app only; external notifications add infrastructure complexity |
| Per-insight user feedback/rating | No ML retraining pipeline exists; dismiss is sufficient signal |
| Real-time streaming (WebSockets/SSE) | Polling + cron sufficient for daily/hourly pattern detection |
| Insight configuration UI | Rules hardcoded in code for v1; no admin config screen |
| Multi-user collaboration | Single-user solopreneur tool |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 2 | Pending |
| DATA-04 | Phase 2 | Pending |
| RULE-01 | Phase 3 | Pending |
| RULE-02 | Phase 3 | Pending |
| RULE-03 | Phase 3 | Pending |
| RULE-04 | Phase 3 | Pending |
| RULE-05 | Phase 3 | Pending |
| RULE-06 | Phase 3 | Pending |
| RULE-07 | Phase 3 | Pending |
| INFRA-01 | Phase 4 | Pending |
| INFRA-02 | Phase 4 | Pending |
| INFRA-03 | Phase 4 | Pending |
| INFRA-04 | Phase 4 | Pending |
| LLM-01 | Phase 5 | Pending |
| LLM-02 | Phase 5 | Pending |
| DASH-01 | Phase 6 | Pending |
| DASH-02 | Phase 6 | Pending |
| DASH-03 | Phase 6 | Pending |
| DASH-04 | Phase 6 | Pending |
| DASH-05 | Phase 6 | Pending |
| DASH-06 | Phase 6 | Pending |
| DASH-07 | Phase 6 | Pending |
| DASH-08 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 after initial definition*
