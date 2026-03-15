# Phase 7: Dashboard Intelligence Feed - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the central intelligence feed on the home dashboard that surfaces cross-module AI insights from the `cross_module_insights` table (built in Phases 4–5, served by Phase 6 API routes). Users can see severity-ranked insight cards, read evidence, dismiss individual cards, and manually trigger a fresh analysis run. No new insight generation logic — UI only.

</domain>

<decisions>
## Implementation Decisions

### Feed placement on the dashboard
- Position: full-width row below LeadPipeline/FounderStories, above where ComingSoon was
- Section label: small uppercase header matching the existing "More agents coming soon" style (text-xs font-medium text-text-muted uppercase tracking-wider) — label to be something like "Cross-Module Intelligence"
- Remove the ComingSoonAgents section entirely — intelligence feed is the new bottom section
- Inside the feed: narrative header card sits above rule insight cards; rule cards arranged in a horizontal scroll row

### Insight card layout
- Narrative card: rendered at the top of the feed, visually elevated/distinct from rule cards (per Phase 5: "distinct type, rendered as a header summary")
- Rule insight cards: horizontal scroll row beneath the narrative card
- Each rule card shows: severity badge (critical/warning/info), freshness timestamp, evidence explanation, dismiss button
- Cards use the `AgentCardWrapper` component pattern consistent with existing agents

### Refresh UX
- Button label: "Refresh" (matches DASH-06 spec language)
- On click: POST /api/intelligence/trigger (202 Accepted), immediately replace cards with skeleton placeholders, wait 3 seconds, then re-fetch GET /api/intelligence/insights
- Loading state during the 3s window: skeleton cards replace existing insight cards (not an overlay, not just spinner-on-button)
- AgentCardWrapper status switches to "running" during the skeleton window

### Initial load behavior
- On mount: fetch GET /api/intelligence/insights immediately — show whatever the last cron run produced
- No auto-trigger on page load — user must click Refresh to kick off a fresh pipeline run
- Rationale: avoid surprise Claude API costs on every page visit; cron runs daily so data is already fresh

### Dismiss behavior
- Clicking dismiss calls POST /api/intelligence/dismiss immediately
- Phase 6 returns 204 No Content on success — remove card client-side on 204
- No explicit rollback design needed (204 is reliable; single-user app)

### Empty state (DASH-07)
- Shown when GET /insights returns zero active insights
- Clear message (e.g., "No cross-module patterns detected") rather than blank area

### Claude's Discretion
- Exact skeleton card dimensions and animation style
- Exact section label text ("Cross-Module Intelligence" or similar)
- Narrative card visual treatment (border, background, icon) vs. rule cards
- Severity badge color mapping (e.g., critical → red, warning → amber, info → blue)
- Error state if GET /insights fails

</decisions>

<specifics>
## Specific Ideas

- The narrative card is the "executive summary" — visually set apart from rule cards, not just another card in the row
- The feed replaces ComingSoonAgents as the bottom section — the intelligence layer is now the final "agent" on the page
- Horizontal scroll for rule cards keeps the page height compact (no tall stacks pushing footer far down)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/agents/agent-card-wrapper.tsx`: AgentCardWrapper with status prop ("idle" | "running" | "success" | "error"), onRun callback, lastRun timestamp — wire directly for the feed card header and Refresh button
- `app/page.tsx`: grid layout with `col-span-full` for full-width rows, stagger animation classes (`opacity-0 animate-fade-in stagger-N`) — use same pattern for the feed section
- `app/page.tsx` section header pattern: `<h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">` — use for intelligence feed section label
- `components/agents/chief-of-staff.tsx`: skeleton loading pattern (animate-pulse divs with bg-surface-hover) — reuse for insight card skeletons

### Established Patterns
- `use client` + `useState` + `useEffect` + `useCallback` — all agent cards are client components with this pattern
- Fetch on mount via `useEffect` with no auto-retry (see ChiefOfStaff: cached check → auto-trigger only on cold start)
- Error state: `p-3 rounded-xl bg-accent-red/5 text-accent-red text-sm border border-accent-red/10` — reuse for fetch errors
- `cn()` utility for conditional class merging (from `@/lib/utils`)

### Integration Points
- `GET /api/intelligence/insights` (Phase 6) — mount fetch for initial load
- `POST /api/intelligence/trigger` (Phase 6) — Refresh button handler; returns 202
- `POST /api/intelligence/dismiss` (Phase 6) — per-card dismiss; expects `{ id: string }`, returns 204
- `app/page.tsx` — add intelligence feed section between FounderStories row and the removed ComingSoon section
- `cross_module_insights` table: `id`, `severity` (critical/warning/info), `created_at`, `evidence`, `module_tags`, `dismissed_at`, insight `type` (narrative vs. rule)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-dashboard-intelligence-feed*
*Context gathered: 2026-03-15*
