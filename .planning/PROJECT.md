# soloPreneurOS — Cross-Module Intelligence

## What This Is

A unified operating system for solopreneurs that connects Sales-OS, Hire-OS, and Finance-OS through an AI intelligence layer. The AI watches all modules, detects cross-cutting patterns, and surfaces proactive insights — both on a central dashboard and as contextual nudges inside each module. Built on Next.js 16 with Supabase, Claude API, and Gmail integrations.

## Core Value

The AI connects dots across modules that a solopreneur would otherwise miss — surfacing relationships between leads, invoices, hires, and finances before they become problems or missed opportunities.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Sales-OS pipeline UI with lead table, stats bar, and drawer — existing
- ✓ AI-powered lead evaluation via Claude API with scoring (0-100) — existing
- ✓ Gmail scanning for inbound leads with cron-based processing — existing
- ✓ Hire-OS candidate pipeline with triage-optimized UI — existing
- ✓ AI-powered candidate assessment via Claude API — existing
- ✓ Finance-OS with Turkish tax/invoice tracking and KDV calculations — existing
- ✓ Agent cards (Chief of Staff, Daily Ops, Market Scout) on dashboard — existing
- ✓ Supabase auth with login/logout flow — existing
- ✓ Onboarding flow with profile persistence — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] Central intelligence dashboard with live feed of cross-module insights
- [ ] Cross-module insight engine (hybrid: rules + LLM) that detects patterns across Sales, Hire, Finance
- [ ] Proactive alerts: lead-invoice correlations, budget-hire conflicts, pipeline-revenue connections
- [ ] In-module contextual nudges showing relevant data from other modules
- [ ] Unified data access layer so the AI can query all modules
- [ ] Rule-based pattern detection for known cross-module scenarios
- [ ] LLM-powered open-ended analysis for novel pattern discovery

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Natural language chat interface — focus on proactive alerts first, conversational AI later
- Auto-actions (AI taking actions without user confirmation) — too risky for v1, alerts only
- New OS modules — connect existing three before adding more
- Mobile app — web-first, existing responsive layout sufficient
- Real-time websockets — polling/cron sufficient for insight freshness

## Context

- Three OS modules exist but operate in isolation — no shared data layer or cross-references
- Sales-OS has real Gmail integration and Supabase-backed leads; Finance-OS uses localStorage; Hire-OS uses Supabase
- Data is partially real (Gmail scanning, Supabase leads) and partially mock
- Agent cards on the home dashboard already demonstrate the pattern of AI-powered insight cards
- Claude API is already integrated for evaluations — extending to cross-module analysis is natural
- The codebase follows a modular OS pattern: each module has its own page, components, types, and API routes

## Constraints

- **Tech stack**: Next.js 16 + Supabase + Claude API — extend existing stack, no new frameworks
- **Data heterogeneity**: Finance uses localStorage, Sales/Hire use Supabase — need unified access
- **AI cost**: Claude API calls cost money — batch and cache insights, don't call per-render
- **Single user**: No multi-tenancy needed, this is a personal solopreneur tool

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid AI (rules + LLM) | Rules catch known patterns cheaply; LLM discovers novel ones | — Pending |
| Both dashboard + in-module nudges | Central view for overview, contextual nudges for in-flow awareness | — Pending |
| Alerts only, no auto-actions | Build trust in AI insights before letting it take actions | — Pending |
| Extend existing agent card pattern | Reuse proven UI pattern from dashboard agents | — Pending |

---
*Last updated: 2026-03-15 after initialization*
