---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 05-llm-orchestrator/05-01-PLAN.md
last_updated: "2026-03-15T12:54:13.378Z"
last_activity: "2026-03-15 — Executed 01-02: Finance seed script with stable UUID upsert pattern"
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 15
  completed_plans: 12
  percent: 23
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-15)

**Core value:** The AI connects dots across modules that a solopreneur would otherwise miss — surfacing relationships between leads, invoices, hires, and finances before they become problems or missed opportunities.
**Current focus:** Phase 1 — Finance Migration

## Current Position

Phase: 1 of 7 (Finance Migration)
Plan: 2 of 3 in current phase (01-02 complete)
Status: In progress
Last activity: 2026-03-15 — Executed 01-02: Finance seed script with stable UUID upsert pattern

Progress: [██░░░░░░░░] 23%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: none yet
- Trend: -

*Updated after each plan completion*
| Phase 04-insights-schema-and-cron P01 | 2 | 1 tasks | 2 files |
| Phase 04-insights-schema-and-cron P02 | 8 | 2 tasks | 4 files |
| Phase 01-finance-migration P02 | 5 | 1 task | 1 file |
| Phase 01-finance-migration P01 | 1 | 2 tasks | 3 files |
| Phase 04-insights-schema-and-cron P03 | 165 | 1 tasks | 3 files |
| Phase 03-rule-engine P01 | 4 | 2 tasks | 4 files |
| Phase 02-unified-data-layer P01 | 4 | 2 tasks | 5 files |
| Phase 03-rule-engine P02 | 3 | 1 tasks | 8 files |
| Phase 02-unified-data-layer P02 | 2 | 2 tasks | 2 files |
| Phase 01-finance-migration P03 | 5 | 3 tasks | 6 files |
| Phase 03-rule-engine P03 | 3 | 3 tasks | 7 files |
| Phase 05-llm-orchestrator P01 | 319 | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Hybrid AI (rules + LLM): Rules catch known patterns cheaply; LLM discovers novel ones
- Both dashboard + in-module nudges: Central view for overview, contextual nudges for in-flow awareness
- Alerts only, no auto-actions: Build trust in AI insights before letting it take actions
- Extend existing agent card pattern: Reuse proven UI pattern from dashboard agents
- [Phase 04-insights-schema-and-cron]: severity constrained to critical/warning/info via CHECK constraint (not enum) for extensibility
- [Phase 04-insights-schema-and-cron]: module_tags as text[] native Postgres array — extensible without migration
- [Phase 04-insights-schema-and-cron]: content-addressed PK: SHA256(rule_id + calendar_date) enables idempotent daily upserts
- [Phase 04-insights-schema-and-cron]: SHA256 content-addressed IDs (ruleId-calendarDate) prevent duplicate insight rows across daily cron runs
- [Phase 04-insights-schema-and-cron]: dismissed_at omitted from upsert payload to preserve dismissed state — Supabase only updates columns present in the payload
- [Phase 01-finance-migration P02]: Seed data defined inline (not imported from mock-data.ts) to avoid path alias resolution outside Next.js context
- [Phase 01-finance-migration P02]: Stable deterministic UUIDs (00000000-0000-0000-000X-00000000000Y) used for idempotent seeding via upsert onConflict: id
- [Phase 01-finance-migration P02]: FINANCE_USER_ID = "00000000-0000-0000-0000-000000000001" as canonical placeholder user ID for seeded Finance data
- [Phase 01-finance-migration]: Admin client (not server client) used for Finance routes to bypass RLS — app has no user auth
- [Phase 01-finance-migration]: FINANCE_USER_ID hardcoded as 00000000-0000-0000-0000-000000000001 — single solopreneur, no multi-tenancy
- [Phase 01-finance-migration]: expenses and tax-provisions routes are GET-only in Phase 1 — seeded/calculated data, not user-created
- [Phase 04-insights-schema-and-cron]: Stubs created for buildCrossModuleSnapshot and runRuleEngine in lib/intelligence/ — allows cron route to compile and run before Phase 2/3 complete
- [Phase 04-insights-schema-and-cron]: CRON_SECRET bearer auth is always the first cron handler operation — 401 returned before any Supabase calls
- [Phase 03-rule-engine]: RuleInsight is separate from InsightCandidate — rule engine outputs RuleInsight, cron maps to InsightCandidate for persistence
- [Phase 03-rule-engine]: CrossModuleSnapshot fields renamed to hire/recent_activity/generated_at — canonical contract for all rule functions
- [Phase 02-unified-data-layer]: CrossModuleSnapshot uses HireSnapshot/hire + recent_activity + generated_at field names consistent with Phase 03 parallel plan
- [Phase 02-unified-data-layer]: errors: string[] always required on CrossModuleSnapshot (not optional) — callers never need to null-check
- [Phase 02-unified-data-layer]: Vitest with node environment + @ alias — server-side intelligence tests have no DOM dependency
- [Phase 03-rule-engine]: R1 severity is critical (runway + hot leads = cash-flow emergency signal)
- [Phase 03-rule-engine]: R3 uses applied_at as proxy for candidate advancement — v1 limitation documented in source
- [Phase 02-unified-data-layer]: Field names use hire/recent_activity/generated_at aligned with types.ts (not plan code samples which used old names)
- [Phase 02-unified-data-layer]: fetchHiringModule fetches active roles (roles.active=true) — HireSnapshot.roles required by Phase 03 rule R3
- [Phase 02-unified-data-layer]: Runway query is non-fatal (try/catch inside fetchFinanceModule) — runway: null does not cause finance module failure
- [Phase 01-finance-migration]: Static runway/tax-provision/KDV-paid data defined as inline constants in Finance page — keep static as simplest approach per user decision
- [Phase 01-finance-migration]: Brief route Finance section is non-blocking — Supabase failure omits section rather than crashing the brief
- [Phase 03-rule-engine]: R6 large invoice threshold set at 10000 TL — filters minor billing issues from cash-flow alerts
- [Phase 03-rule-engine]: runAllRules catches individual rule errors to prevent one failing rule from blocking others
- [Phase 05-llm-orchestrator]: NarrativeMetrics interface introduced — cron handler computes scalar counts from CrossModuleSnapshot before calling buildMetricsText, keeping narrative module free of raw array access
- [Phase 05-llm-orchestrator]: Class-based Anthropic mock in Vitest tests — vi.fn() as constructor triggers Vitest warning and unreliable new Anthropic() behavior; class mock is stable across clearAllMocks
- [Phase 05-llm-orchestrator]: claude-haiku-4-5-20251001 model for narrative generation — lighter/cheaper task than candidate evaluation (which uses Sonnet)

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 1: Finance-OS currently uses localStorage — server-side cron reads zero Finance data until migration completes. This is the hard blocker for all intelligence logic.
- Phase 3: Rule field names must be validated against live Supabase schema before shipping. Mock Lead type uses `stage`/`value`/`lastContact`; canonical Supabase type may use `status`/`deal_value`/`last_contact_at`. Silent null returns if mismatched.
- Phase 5: Claude Haiku model ID needs verification at implementation time — `claude-haiku-3-5` is placeholder with MEDIUM confidence.

## Session Continuity

Last session: 2026-03-15T12:53:41.136Z
Stopped at: Completed 05-llm-orchestrator/05-01-PLAN.md
Resume file: None
