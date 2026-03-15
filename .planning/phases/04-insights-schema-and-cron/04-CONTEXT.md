# Phase 4: Insights Schema and Cron - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the `cross_module_insights` Supabase table and wire the daily intelligence cron pipeline that runs: data aggregation → rule engine → persist insights. No UI, no API routes — this is the storage and cron backbone only. API routes are Phase 6; dashboard is Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Severity tiers
- 3 tiers: `critical` / `warning` / `info`
- critical = act now (e.g. runway < 60 days with hot leads)
- warning = worth watching
- info = FYI background patterns

### Evidence format
- Plain text string — one human-readable sentence explaining why the insight fired
- Example: "2 hot leads with no reply in 48h and runway at 45 days."
- No structured JSON needed for v1

### module_tags storage
- Postgres `text[]` column (native array)
- Values are lowercase module names: `['sales', 'finance']`, `['hire']`, etc.
- No enum constraint — extensible without migration

### Dismissal behavior
- Soft delete: `dismissed_at` timestamp column (nullable)
- Dismissed rows stay in the table — audit trail preserved
- Hard delete is not used

### Content-addressed dedup
- ID = SHA256(`rule_id + calendar_date`) — e.g. SHA256('R1-2026-03-15')
- One logical row per rule per calendar day
- Cron **upserts**: updates `generated_at`, `severity`, `evidence` on conflict; preserves `dismissed_at` intact
- Result: dismissed insight stays dismissed even as conditions persist day-over-day

### Dismissed insight lifecycle
- No automatic un-dismiss — only the user can clear `dismissed_at`
- No time-decay, no severity-escalation trigger
- If conditions worsen significantly, a different or escalated rule would generate a distinct insight

### Cron pipeline structure
- Single endpoint: `GET /api/cron/run-intelligence`
- Runs sequentially: aggregate snapshot → rule engine → persist insights
- Uses existing `CRON_SECRET` bearer token auth pattern (identical to `scan-sales-gmail`, `evaluate-leads`)
- Returns JSON result: `{ insights_generated, insights_upserted, errors[] }`

### Claude's Discretion
- Exact SHA256 implementation (Node crypto or similar)
- Column ordering in the DDL
- Index strategy for the insights table
- Exact error message wording in cron response

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createAdminClient()` (`lib/supabase/admin.ts`): Use for all Supabase writes in the cron route
- `CRON_SECRET` bearer auth pattern: Copy verbatim from `app/api/cron/scan-sales-gmail/route.ts` lines 59-62
- Error accumulator pattern (`result = { processed, errors[] }`): Same structure used in both existing cron routes — use for insight cron too

### Established Patterns
- Cron routes are `GET` handlers under `app/api/cron/` — follow same file structure
- Auth check is the first thing in the handler, returns 401 before any DB access
- Per-item try/catch accumulates errors without aborting the whole run (loop-level resilience)

### Integration Points
- Phase 3 rule engine output (array of `InsightCandidate` objects with rule_id, severity, evidence, module_tags) feeds directly into the persist step
- Phase 2 data aggregator (`CrossModuleSnapshot`) feeds directly into the rule engine call
- New cron endpoint calls aggregator → rule engine → upsert loop, all in one handler

</code_context>

<specifics>
## Specific Ideas

- No specific UI references — this is pure backend infrastructure
- The upsert-with-dismissed-preservation behavior is the key design choice: `ON CONFLICT (id) DO UPDATE SET generated_at = ..., severity = ..., evidence = ... WHERE dismissed_at IS NULL` (or handle in app layer)

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-insights-schema-and-cron*
*Context gathered: 2026-03-15*
