# Feature Landscape

**Domain:** Cross-module AI intelligence layer for a solopreneur operating system
**Researched:** 2026-03-15
**Confidence note:** Web search unavailable. Analysis is based on codebase context, existing architecture docs, domain expertise in AI-augmented SaaS dashboards, and patterns from comparable products (HubSpot AI, Linear AI, Notion AI, Superhuman). Confidence is MEDIUM — core feature reasoning is well-grounded, but exact industry prevalence of some differentiators is unverified.

---

## Table Stakes

Features users expect from any AI intelligence layer. If missing, the product feels like a glorified data dashboard, not an AI operating system.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Central insight feed | Users need one place to scan all AI-generated alerts — without it the AI is invisible | Medium | Extends existing agent card pattern on home dashboard |
| Cross-module correlations (rule-based) | Expected after seeing Sales, Hire, Finance co-exist — the implicit promise is "these are connected" | Medium | Lead + invoice correlation, pipeline vs runway, hire cost vs revenue coverage |
| Insight severity levels | Alerts without urgency ranking create noise blindness; users stop reading everything | Low | Three levels: critical / watch / info — maps to visual badge treatment |
| Insight freshness timestamps | Users need to know "is this stale?" — AI insight systems lose trust if the data age is hidden | Low | Show "generated X minutes ago" on each insight card |
| Dismiss / acknowledge actions | Without a way to clear insights, the feed becomes cluttered noise fast | Low | Mark as read, dismiss, or snooze — insights should not pile up unacted |
| Per-insight explanation ("why this?") | AI recommendations without reasoning are distrusted — users want to audit the logic | Medium | Each alert must surface its evidence (e.g., "3 invoices unpaid, 2 hot leads in pipeline") |
| Refresh / on-demand trigger | Scheduled cron is not enough — users must be able to manually trigger re-analysis at will | Low | Button to force regeneration of insights, especially after taking action |
| No-data / empty states | If no cross-module patterns exist yet, the dashboard must say so clearly and helpfully | Low | Empty state with explanation and expected next trigger condition |

---

## Differentiators

Features that make this intelligence layer genuinely useful vs. a list of notifications.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| In-module contextual nudges | AI insight appears inside the relevant module (e.g., finance shows "this lead could close $12K — consider delaying hire") — no context switching needed | High | Requires each OS module to consume cross-module insight data; needs unified data access layer first |
| Hybrid AI engine (rules + LLM) | Rules catch known patterns cheaply and reliably; LLM covers novel combinations that rules can't enumerate | High | Rules run every cron cycle; LLM analysis runs on delta or weekly cadence to control cost |
| Insight narrative summaries | Instead of "3 alerts", produce a 2-sentence morning briefing: "Your pipeline is strong but your runway only covers 2 more hires. Prioritize closing deals before scaling the team." | Medium | Leverages existing `/api/agents/daily-ops` pattern; extends to cross-module synthesis |
| Pattern history / trend detection | Show that a correlation has appeared before (e.g., "revenue dips always follow hire spikes for you") — temporal memory builds trust | High | Requires persisting past insight records, not just current; adds `insights` table to Supabase |
| Insight-to-action shortcuts | Each insight card links directly to the relevant record (lead drawer, invoice, candidate profile) — one click to act | Medium | Deep-link routing from insight to module; no new API needed, just navigation params |
| Finance-aware pipeline scoring | Adjust lead urgency score by current runway: a medium lead becomes high-priority when cash runway is under 60 days | High | Combines Finance (localStorage) and Sales (Supabase) data in one computation; requires unified access layer |
| Hire-pipeline tension detection | Alert when team capacity (open roles) doesn't match near-term revenue outlook — "You have 3 open roles but only 45 days of runway" | Medium | Combines Hire (Supabase candidates count) and Finance (runway calculation) |
| Insight confidence scoring | Each AI-generated insight should expose its confidence — "HIGH: based on 4 correlated signals" vs "LOW: based on 1 data point" | Medium | Requires structured Claude output format with confidence field; prevents false positives from polluting the feed |

---

## Anti-Features

Features to deliberately NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Natural language chat interface | Conversational AI is a separate product feature; building it now dilutes focus on proactive alerting, which is higher ROI for a solopreneur who is time-constrained | Proactive push insights — user pulls context only when needed via existing ask/brief routes |
| Auto-actions (AI takes action without confirmation) | Trust in AI recommendations hasn't been established yet; auto-send, auto-status-change, or auto-dismiss without user action creates irreversible mistakes | Alerts-only: show recommendation, let user execute it |
| Notification system / email digests | External notifications (email, push) add infrastructure complexity (Resend templates, browser push service worker) out of scope for an in-app intelligence layer | In-app insight feed only; user sees it when they open the dashboard |
| Per-insight user feedback / rating | Feedback loops (thumbs up/down) require ML model retraining infrastructure that doesn't exist; collecting feedback with no training pipeline is dead data | Dismiss/acknowledge is sufficient signal for v1 |
| Multi-user collaboration on insights | This is a single-user solopreneur tool — no sharing, assignment, or collaborative annotation needed | Keep single-user model; no user_id columns on insight records needed |
| Real-time streaming insights | Streaming requires WebSockets or SSE infrastructure; cron-based batch updates are sufficient for hourly/daily pattern detection | Polling + cron remains correct architecture; polling interval can be short (60s) for UI freshness without sockets |
| Predictive forecasting / ML models | Training custom ML models on one user's data is impossible at this scale; LLM pattern analysis is the right tool | Claude-based analysis with rule-based thresholds |
| Admin / insight configuration UI | Building a UI to configure insight rules adds scope; rules belong in code for v1 | Hardcode the initial rule set; make it easy to add rules in code without a config UI |

---

## Feature Dependencies

```
Unified data access layer
  → Rule-based pattern detection
    → Cross-module correlations (rule-based)
      → Insight feed (central dashboard)
        → Insight severity levels
        → Insight freshness timestamps
        → Dismiss / acknowledge actions
        → Per-insight explanation
        → Insight-to-action shortcuts

Unified data access layer
  → LLM-powered cross-module analysis
    → Insight narrative summaries
    → Insight confidence scoring
    → Pattern history / trend detection (requires Supabase insights table)

Unified data access layer
  → Finance-aware pipeline scoring (Finance localStorage + Sales Supabase)
  → Hire-pipeline tension detection (Hire Supabase + Finance localStorage)

Insight feed (central dashboard)
  → In-module contextual nudges (feed data reused in per-module view)

Pattern history / trend detection
  → Insight confidence scoring (history strengthens confidence)
```

**Critical path:** Unified data access layer must be built first. Everything else depends on it. Finance's localStorage isolation is the main blocker — without normalizing Finance data into a queryable form, cross-module rules cannot operate.

---

## MVP Recommendation

For a solopreneur OS, the primary job is "surface what I would have missed." The MVP should do this reliably for the three most high-value cross-module patterns, then extend.

**Prioritize:**

1. Unified data access layer — read Finance from localStorage, Sales/Hire from Supabase into a shared in-memory context object that the insight engine can query
2. Rule-based pattern detection — implement 5-7 specific known-good cross-module rules (see below)
3. Central insight feed — render insights as cards on the home dashboard, extending the existing agent card pattern
4. Insight severity + dismiss — make the feed actionable, not just informational
5. Per-insight explanation — show the evidence, not just the conclusion
6. In-module contextual nudges — highest value UX differentiator; implement after feed is stable

**The 5-7 MVP rules to hardcode:**

| Rule ID | Pattern | Modules | Trigger |
|---------|---------|---------|---------|
| R1 | Runway < 60 days AND hot leads in pipeline | Finance + Sales | Cash is low, close a deal |
| R2 | Open hire roles AND runway < 90 days | Finance + Hire | Can't afford new hire yet |
| R3 | Deals closed AND candidates advancing simultaneously | Sales + Hire | Revenue covers hire cost |
| R4 | No invoices sent in 14 days AND no leads marked won | Finance + Sales | Revenue drought alert |
| R5 | Candidate pipeline stalled (no movement in 7 days) AND team capacity gap exists | Hire | Hiring is blocking growth |
| R6 | Large invoice overdue AND payroll/contractor cost upcoming | Finance | Cash flow timing risk |
| R7 | Multiple hot leads AND no reply sent in 48 hrs | Sales | Leads going cold |

**Defer:**

- Pattern history / trend detection: Requires persisting insight records over time — schema migration needed, adds complexity, low immediate value
- LLM open-ended analysis: High Claude API cost; start with rules, add LLM when rules miss patterns the user notices
- Finance-aware pipeline scoring (modifying individual lead scores based on runway): Deep integration that changes existing Sales-OS behavior; risky to scope into this milestone

---

## Sources

- Project context: `.planning/PROJECT.md` (HIGH confidence — first-party source)
- Architecture analysis: `.planning/codebase/ARCHITECTURE.md` (HIGH confidence — first-party)
- Integrations analysis: `.planning/codebase/INTEGRATIONS.md` (HIGH confidence — first-party)
- Concerns analysis: `.planning/codebase/CONCERNS.md` (HIGH confidence — first-party)
- Domain patterns: Agent card pattern (existing), daily-ops brief pattern (existing), lead evaluation pattern (existing) — all inferred from codebase analysis (HIGH confidence)
- Industry analogues: HubSpot AI Insights, Linear AI triage, Notion AI summaries, Superhuman triage — feature reasoning derived from known product patterns without live verification (MEDIUM confidence)
- Web search: Unavailable — all findings based on codebase + domain expertise
