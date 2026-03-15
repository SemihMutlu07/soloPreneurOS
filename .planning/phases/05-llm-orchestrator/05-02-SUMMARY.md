---
phase: 05-llm-orchestrator
plan: 02
subsystem: api
tags: [anthropic, claude, llm, narrative, cron, pipeline, supabase]

# Dependency graph
requires:
  - phase: 05-llm-orchestrator/05-01
    provides: generateNarrative, upsertNarrativeInsight, NarrativeMetrics from lib/claude-narrative.ts
  - phase: 04-insights-schema-and-cron
    provides: cross_module_insights table, InsightCandidate, runIntelligencePipeline
  - phase: 02-unified-data-layer
    provides: CrossModuleSnapshot with sales/hire/finance sub-objects
provides:
  - lib/intelligence-pipeline.ts extended with conditional LLM narrative step after rule persist
  - PipelineResult.narrative_generated boolean field
  - NarrativeMetrics computation from CrossModuleSnapshot (hotLeadCount, runwayDays, openRoleCount, overdueInvoiceCount, daysSinceLastInvoice)
affects:
  - 06-intelligence-api-routes
  - 07-dashboard-ui

# Tech tracking
tech-stack:
  added: []
  patterns:
    - LLM step isolated in its own inner try/catch inside pipeline — generateNarrative failure silent, rule insights always preserved
    - NarrativeMetrics computed inline from CrossModuleSnapshot scalars before LLM call
    - Guard condition candidates.length > 0 prevents LLM cost when no rules fired
    - Supabase admin client created on-demand inside LLM block (only when narrative is produced)

key-files:
  created: []
  modified:
    - lib/intelligence-pipeline.ts

key-decisions:
  - "Extended lib/intelligence-pipeline.ts (not route.ts) — Phase 6 had already extracted pipeline logic into this shared module used by both cron and trigger endpoints"
  - "NarrativeMetrics computed inline in pipeline from CrossModuleSnapshot: hotLeadCount via isHotLead filter, runwayDays as runway_months * 30, overdueInvoiceCount via status === 'gecmis'"
  - "Supabase admin client instantiated inside LLM try/catch block — only created when at least one rule fired and narrative is non-empty, avoids unnecessary client creation"
  - "Overdue invoice detection uses status === 'gecmis' (Turkish for past-due) — canonical InvoiceStatus value per finance-types.ts"

patterns-established:
  - "Pipeline LLM guard: candidates.length > 0 before any generateNarrative call — zero rules = zero LLM cost"
  - "Failure isolation: LLM inner try/catch swallows errors, pushes to result.errors[], outer pipeline returns 200 with rule insights intact"
  - "NarrativeMetrics scalar extraction: derive counts from nested snapshot arrays before passing to narrative module — keeps claude-narrative.ts free of raw array access"

requirements-completed: [LLM-01, LLM-02]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 05 Plan 02: LLM Orchestrator Cron Integration Summary

**Conditional LLM narrative step wired into runIntelligencePipeline — generateNarrative called after rule persist, guarded by candidates.length > 0, with failure isolation and NarrativeMetrics scalar computation from CrossModuleSnapshot**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-15T12:55:28Z
- **Completed:** 2026-03-15T12:59:00Z
- **Tasks:** 1 auto + 1 checkpoint (human-verify)
- **Files modified:** 1

## Accomplishments

- Extended `lib/intelligence-pipeline.ts` with Step 4 LLM narrative after rule persist
- Added `narrative_generated: boolean` to `PipelineResult` interface (false by default)
- Computed scalar `NarrativeMetrics` inline from `CrossModuleSnapshot` (hot leads, runway days, open roles, overdue invoices, days since last invoice)
- LLM step guarded by `candidates.length > 0` — no API cost when no rules fired
- LLM failure isolated in inner try/catch — error appended to `result.errors[]`, rule insights preserved, endpoint still returns 200

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend intelligence pipeline with conditional LLM step** - `db7a959` (feat)

**Plan metadata:** (docs commit — see state updates below)

## Files Created/Modified

- `lib/intelligence-pipeline.ts` — Extended with: `narrative_generated` in PipelineResult, NarrativeMetrics computation, guarded LLM step with isolated inner try/catch

## Decisions Made

- **Extended `intelligence-pipeline.ts` not `route.ts`** — Phase 6 had already refactored the cron handler to delegate to `runIntelligencePipeline()`. The shared pipeline function is also used by `POST /api/intelligence/trigger`. Extending the pipeline rather than just the route ensures both endpoints benefit from narrative generation.
- **NarrativeMetrics computed inline** — Rather than passing `CrossModuleSnapshot` directly to `generateNarrative` (which takes `NarrativeMetrics`), scalar counts are computed inside the LLM block. This preserves the Plan 01 design decision to keep `claude-narrative.ts` free of raw array iteration.
- **Supabase client created on-demand** — The admin client is instantiated inside the LLM try/catch block, only when `candidates.length > 0` and after `generateNarrative` returns a non-empty string. This avoids creating an unused connection on cron runs where no rules fire.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Architecture Adaptation] Extended intelligence-pipeline.ts instead of route.ts**
- **Found during:** Task 1 (reading current codebase state)
- **Issue:** The plan specified modifying `app/api/cron/run-intelligence/route.ts`, but Phase 6 (which ran after this plan was written) had already extracted the pipeline logic into `lib/intelligence-pipeline.ts` and refactored the route to a thin wrapper calling `runIntelligencePipeline()`. The route now has only auth + try/catch.
- **Fix:** Added LLM step to `lib/intelligence-pipeline.ts` instead of the route — same logical outcome (LLM runs after persist), correct file given current architecture
- **Files modified:** `lib/intelligence-pipeline.ts`
- **Verification:** TypeScript compiles clean (npx tsc --noEmit), 108 tests pass
- **Committed in:** `db7a959` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (architecture adaptation — file target changed due to Phase 6 refactor)
**Impact on plan:** The logical integration is identical — LLM step fires after rule persist, guarded, isolated. Only the file location changed. No scope creep.

## Issues Encountered

- Phase 6 had executed before this plan (05-02) and extracted `runIntelligencePipeline` into a shared module. The plan's target file (`route.ts`) was now a thin wrapper. Adapted automatically by targeting the correct file.
- The plan's interface showed `generateNarrative(snapshot: CrossModuleSnapshot, ...)` but the actual Plan 01 implementation uses `NarrativeMetrics`. Computed scalars inline per the Plan 01 Summary's documented deviation.

## User Setup Required

ANTHROPIC_API_KEY must be set in `.env.local` for the narrative step to produce output. The Anthropic SDK reads this automatically. Without it, `generateNarrative` returns `""` (per Plan 01 failure isolation), `narrative_generated` stays `false`, and the endpoint returns 200 with rule insights intact.

## Next Phase Readiness

- Phase 5 pipeline complete: rules fire, insights persist, LLM narrative generated and upserted with `rule_id='LLM'`
- Phase 7 (dashboard UI) can query `cross_module_insights WHERE rule_id = 'LLM'` to display the narrative as a header above rule insight cards
- No blockers

## Self-Check: PASSED

- lib/intelligence-pipeline.ts: FOUND
- 05-02-SUMMARY.md: FOUND
- Commit db7a959: FOUND

---
*Phase: 05-llm-orchestrator*
*Completed: 2026-03-15*
