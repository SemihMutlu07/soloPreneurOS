# Phase 6: Intelligence API Routes - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Expose the persisted insights from `cross_module_insights` (built in Phases 4–5) via typed HTTP endpoints that Phase 7's dashboard UI can consume. This phase delivers API infrastructure only — no UI, no new insight generation logic.

Four endpoints in scope:
1. `GET /api/intelligence/insights` — list active insights
2. `GET /api/intelligence/nudges?module=sales` — module-filtered insights
3. `POST /api/intelligence/dismiss` — soft-delete an insight
4. `POST /api/intelligence/trigger` — kick off a fresh intelligence pipeline run

</domain>

<decisions>
## Implementation Decisions

### Route Authentication
- No auth checks in route handlers — follow the existing project pattern
- Middleware protects the pages that call these routes; routes themselves are unprotected
- This is appropriate for a single-user personal tool

### GET /insights Behavior
- Always returns only non-dismissed insights (dismissed=false filter hardcoded)
- No `?include_dismissed=true` support — active only, always
- Ordering hardcoded: severity descending (critical → warning → info), then `created_at` descending within each tier
- No sort query params — Phase 7 is the sole consumer and always wants this ordering

### POST /dismiss Behavior
- Request body: `{ id: string }`
- On success: **204 No Content** — Phase 7 removes the card client-side; no need to return the updated record
- On unknown ID: 404
- On missing/invalid body: 400

### POST /trigger Behavior
- Invokes the existing cron pipeline logic (reuses the same pipeline, not a duplicate)
- Returns **202 Accepted** immediately — does not wait for pipeline completion
- Phase 7 re-fetches `GET /insights` after a short delay to get fresh results
- This avoids HTTP timeout risk if the LLM call is slow

### Claude's Discretion
- How to internally invoke the cron pipeline from the trigger endpoint (module import vs. fetch to self)
- Exact error response bodies beyond the status codes decided above
- Whether to add a `running: true` flag to 202 response for Phase 7 to use as a loading hint

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@/lib/supabase/server`: `createClient()` — used by all user-facing routes for Supabase queries
- `@/lib/supabase/admin`: `createAdminClient()` — used by cron routes; trigger endpoint may need this to bypass RLS when writing insights
- Existing error pattern: `return NextResponse.json({ error: error.message }, { status: 500 })` — use consistently

### Established Patterns
- All routes use `NextResponse` from `next/server`
- Query params parsed via `new URL(request.url).searchParams` — use for `?module=` param on nudges endpoint
- Routes return flat arrays for list responses (sales leads, hiring candidates) — insights list should follow this

### Integration Points
- `cross_module_insights` Supabase table (created in Phase 4) — all 4 endpoints query or mutate this table
- `POST /api/cron/intelligence` (Phase 4's cron endpoint) — trigger endpoint reuses this pipeline logic
- Phase 7 dashboard components will be the sole consumers of all 4 endpoints

</code_context>

<specifics>
## Specific Ideas

- Trigger endpoint reuses the existing cron pipeline as its execution path — single source of truth, no duplicated logic
- 202 Accepted on trigger + client-side polling pattern keeps Phase 7's refresh button simple (fire-and-forget, then refetch after delay)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-intelligence-api-routes*
*Context gathered: 2026-03-15*
