---
phase: 05-llm-orchestrator
plan: 01
subsystem: api
tags: [anthropic, claude, llm, narrative, sha256, vitest, tdd]

# Dependency graph
requires:
  - phase: 04-insights-schema-and-cron
    provides: cross_module_insights table, InsightCandidate type, content-addressed ID pattern
  - phase: 02-unified-data-layer
    provides: CrossModuleSnapshot shape (nested sales/hire/finance sub-objects)
provides:
  - lib/claude-narrative.ts with 4 exports: generateNarrative, buildMetricsText, narrativeInsightId, upsertNarrativeInsight
  - NarrativeMetrics interface — scalar metrics contract for buildMetricsText
  - TDD test suite (6 tests) covering LLM-01 and LLM-02 requirements
affects:
  - 05-02-cron-integration
  - 07-dashboard-ui

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Class-based Anthropic mock in Vitest (not vi.fn()) — avoids constructor warning and works reliably with new Anthropic()
    - NarrativeMetrics as separate scalar interface — decouples buildMetricsText from raw CrossModuleSnapshot arrays
    - Failure isolation via bare catch {} returning "" — LLM failure never propagates to cron caller

key-files:
  created:
    - lib/claude-narrative.ts
    - lib/__tests__/claude-narrative.test.ts
  modified: []

key-decisions:
  - "NarrativeMetrics interface introduced as buildMetricsText param — cron handler computes scalar counts from nested CrossModuleSnapshot before calling, keeping buildMetricsText free of raw array access"
  - "Class-based mock for Anthropic SDK (not vi.fn()) — vi.fn() as constructor causes Vitest warning and unreliable new Anthropic() behavior; class mock is stable"
  - "mockCreate defined at module scope (not in beforeEach) — shared reference survives vi.mock hoisting and module import caching"
  - "mockCreate.mockReset() in beforeEach (not clearAllMocks) — only resets the create fn, preserves class-based constructor mock stability"
  - "claude-haiku-4-5-20251001 model chosen for cost-efficient narrative generation (lighter task than candidate evaluation which uses Sonnet)"

patterns-established:
  - "Failure isolation: wrap entire LLM call in try/catch, return '' on any error — rule insights survive API failure"
  - "Guard condition: check firedInsights.length === 0 before any API call — no LLM cost when no rules fired"
  - "Supabase client injected as parameter to upsertNarrativeInsight — enables unit testing without real DB calls"
  - "Content-addressed ID: SHA256('LLM-{calendarDate}') — same date always produces same ID, prevents duplicate narrative rows"

requirements-completed: [LLM-01, LLM-02]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 05 Plan 01: LLM Orchestrator — Narrative Module Summary

**Anthropic SDK narrative synthesis module with TDD — generateNarrative wraps claude-haiku-4-5-20251001 to produce 2-sentence CEO briefing from scalar metrics, with complete failure isolation and SHA256 content-addressed upsert**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-15T12:47:47Z
- **Completed:** 2026-03-15T12:52:00Z
- **Tasks:** 2 (TDD: RED then GREEN)
- **Files modified:** 2

## Accomplishments

- Created `lib/claude-narrative.ts` with 4 required exports: `generateNarrative`, `buildMetricsText`, `narrativeInsightId`, `upsertNarrativeInsight`
- All 6 tests pass: failure isolation, empty guard, scalar-only metrics text, deterministic SHA256 ID
- TypeScript compiles clean with no errors in claude-narrative files

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests (RED)** - `8d22371` (test)
2. **Task 2: Implement claude-narrative.ts (GREEN)** - `f88de65` (feat)

_Note: TDD — test commit first (RED), then implementation commit (GREEN)_

## Files Created/Modified

- `lib/claude-narrative.ts` — narrative synthesis module: buildMetricsText, narrativeInsightId, generateNarrative, upsertNarrativeInsight
- `lib/__tests__/claude-narrative.test.ts` — 6 tests covering LLM-01, LLM-02 with class-based Anthropic mock

## Decisions Made

- `NarrativeMetrics` interface introduced rather than passing `CrossModuleSnapshot` directly — `CrossModuleSnapshot` holds nested arrays (sales.leads, hire.candidates, etc.) and the plan requires scalar counts only. The cron handler (Plan 02) will compute scalar counts from the snapshot before calling `buildMetricsText`, keeping narrative module free of raw array iteration.
- Class-based mock for Anthropic SDK: `class MockAnthropic { messages = { create: mockCreate } }` — `vi.fn()` as a constructor in `vi.mock` triggered Vitest warning and unreliable `new Anthropic()` behavior. Class mock is stable and doesn't get disrupted by `vi.clearAllMocks()`.
- `mockCreate` defined at module scope and only reset with `mockCreate.mockReset()` per test — avoids clearing the class-based constructor mock inadvertently.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test mock strategy: class-based instead of vi.fn() for Anthropic constructor**
- **Found during:** Task 2 (implementation — GREEN phase)
- **Issue:** Plan's prescribed mock pattern `vi.fn().mockImplementation(() => ({ messages: { create: vi.fn() } }))` triggered Vitest warning "vi.fn() mock did not use 'function' or 'class'" causing `new Anthropic()` in `generateNarrative` to return `undefined` after `clearAllMocks()`, making Test 1 fail (result was `""` instead of the expected narrative text)
- **Fix:** Changed `vi.mock` factory to use a real `class MockAnthropic` with `messages = { create: mockCreate }`, and used `mockCreate.mockReset()` in `beforeEach` instead of `vi.clearAllMocks()`
- **Files modified:** `lib/__tests__/claude-narrative.test.ts`
- **Verification:** All 6 tests pass, no Vitest warnings
- **Committed in:** `f88de65` (Task 2 commit)

**2. [Rule 2 - Missing Critical] NarrativeMetrics interface for scalar type safety**
- **Found during:** Task 2 (implementing buildMetricsText)
- **Issue:** Plan's `buildMetricsText` signature used `CrossModuleSnapshot` parameter but real type has nested sub-objects (no flat `hotLeadCount`, `runwayDays` fields) — would cause TypeScript error or silent undefined at runtime
- **Fix:** Defined exported `NarrativeMetrics` interface with the 5 scalar fields; tests use `as any` mock matching this interface; cron (Plan 02) will compute scalars before calling
- **Files modified:** `lib/claude-narrative.ts`
- **Verification:** TypeScript compiles clean, tests pass
- **Committed in:** `f88de65` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug in test setup, 1 missing type safety)
**Impact on plan:** Both fixes necessary for correctness. No scope creep. The NarrativeMetrics interface is a cleaner API than passing raw CrossModuleSnapshot.

## Issues Encountered

- Anthropic SDK vi.fn() mock pattern in plan is incompatible with Vitest's constructor behavior — class-based mock is the correct pattern for SDK classes instantiated with `new`. This is a common Vitest gotcha documented in their docs.

## User Setup Required

None — no external service configuration required. The module uses `ANTHROPIC_API_KEY` from environment (read by Anthropic SDK automatically), which was already required by existing `lib/claude-eval.ts`.

## Next Phase Readiness

- `lib/claude-narrative.ts` exports are ready for cron integration (Plan 02)
- Cron handler needs to: compute `NarrativeMetrics` scalars from `CrossModuleSnapshot`, call `generateNarrative`, call `upsertNarrativeInsight` with injected Supabase client
- No blockers

---
*Phase: 05-llm-orchestrator*
*Completed: 2026-03-15*
