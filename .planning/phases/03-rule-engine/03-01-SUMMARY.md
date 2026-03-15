---
phase: 03-rule-engine
plan: "01"
subsystem: api
tags: [typescript, intelligence, rule-engine, types]

requires:
  - phase: 02-unified-data-layer
    provides: "lib/intelligence/ directory, CrossModuleSnapshot type skeleton, data-aggregator stub"

provides:
  - "RuleInsight interface — typed output for all 7 rule functions"
  - "RuleSeverity type — critical/warning/info union"
  - "HOT_STAGES constant — 5 active pipeline stages"
  - "isHotLead(lead) helper — single source of truth for hot-lead detection"
  - "HireSnapshot interface with candidates + roles fields"
  - "CrossModuleSnapshot with canonical field names: hire, recent_activity, generated_at"

affects:
  - 03-02-rule-engine-r1-r4
  - 03-03-rule-engine-r5-r7
  - 05-llm-orchestrator

tech-stack:
  added: []
  patterns:
    - "HOT_STAGES as const array with isHotLead helper — single source of truth for hot-stage classification"
    - "RuleInsight as pure value object — no DB concerns, no IDs; persistence layer maps to InsightCandidate"

key-files:
  created:
    - lib/intelligence/types.test.ts
  modified:
    - lib/intelligence/types.ts
    - lib/intelligence/data-aggregator.ts
    - lib/intelligence/data-aggregator.test.ts

key-decisions:
  - "RuleInsight is separate from InsightCandidate — rule engine outputs RuleInsight, cron maps to InsightCandidate for persistence"
  - "HOT_STAGES excludes new (unqualified) and won/lost/nurture (resolved) — 5 active stages only"
  - "CrossModuleSnapshot field renamed from hiring to hire, activities to recent_activity, timestamp to generated_at — aligns with plan 03 contract"
  - "HireSnapshot gains roles field to support R2/R5 capacity-gap rules"

patterns-established:
  - "Rule functions import CrossModuleSnapshot and RuleInsight from lib/intelligence/types.ts only — no direct imports from module-specific type files"
  - "isHotLead uses Lead.status (canonical Supabase field) not SalesLead.stage (legacy mock alias)"

requirements-completed: [RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, RULE-06, RULE-07]

duration: 4min
completed: 2026-03-15
---

# Phase 03 Plan 01: Intelligence Types and isHotLead Helper Summary

**HOT_STAGES constant, isHotLead helper, RuleInsight type, and updated CrossModuleSnapshot with canonical field names — contract layer all 7 rules depend on**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-15T12:34:07Z
- **Completed:** 2026-03-15T12:37:10Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 4

## Accomplishments
- Wrote 14 failing tests covering all isHotLead behavior cases (RED phase)
- Implemented `HOT_STAGES`, `isHotLead`, `RuleSeverity`, `RuleInsight` in `lib/intelligence/types.ts` (GREEN phase)
- Updated `CrossModuleSnapshot` field names (`hiring`→`hire`, `activities`→`recent_activity`, `timestamp`→`generated_at`) to match plan 03 contract
- Added `HireSnapshot.roles` field for R2/R5 capacity-gap detection
- TypeScript compiles clean, all 14 tests pass

## Task Commits

TDD committed in two atomic phases:

1. **RED: Failing tests** - `eb894e5` (test)
2. **GREEN: Implementation** - `f7ea84a` (feat)

## Files Created/Modified
- `lib/intelligence/types.ts` — Added HOT_STAGES, isHotLead, RuleSeverity, RuleInsight; updated CrossModuleSnapshot field names; added HireSnapshot with roles
- `lib/intelligence/types.test.ts` — 14 behavioral tests for isHotLead and HOT_STAGES
- `lib/intelligence/data-aggregator.ts` — Stub updated to match new CrossModuleSnapshot field names
- `lib/intelligence/data-aggregator.test.ts` — Todo descriptions updated to match new field names

## Decisions Made
- `RuleInsight` is intentionally separate from `InsightCandidate` (in `lib/intelligence-types.ts`). Rules output `RuleInsight`; the cron pipeline maps these to `InsightCandidate` for persistence. This keeps rule logic decoupled from DB schema.
- Renamed `hiring`→`hire` in `CrossModuleSnapshot` to match the plan 03 contract. The phase 02 stub used `hiring` — this was corrected here as the plan 03 spec is the authoritative contract for rules.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated CrossModuleSnapshot field names from Phase 02 stub**
- **Found during:** Implementation (GREEN phase)
- **Issue:** Phase 02 stub used `hiring`, `activities`, `timestamp` — plan 03-01 specifies `hire`, `recent_activity`, `generated_at`
- **Fix:** Rewrote `types.ts` with canonical field names; updated `data-aggregator.ts` stub and `data-aggregator.test.ts` descriptions accordingly
- **Files modified:** lib/intelligence/types.ts, lib/intelligence/data-aggregator.ts, lib/intelligence/data-aggregator.test.ts
- **Verification:** `npx tsc --noEmit` clean, all 14 tests pass
- **Committed in:** f7ea84a (GREEN phase commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - field name correction)
**Impact on plan:** Required for plan 03-02/03-03 rules to use the correct CrossModuleSnapshot field names. No scope creep.

## Issues Encountered
- `types.ts` already existed from Phase 02 with partial content (HOT_STAGES and isHotLead were present but without RuleInsight, and with incorrect field names). Required a rewrite rather than pure addition.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `lib/intelligence/types.ts` exports all required types: `RuleInsight`, `CrossModuleSnapshot`, `isHotLead`, `HOT_STAGES`, `RuleSeverity`
- Plans 03-02 and 03-03 can import directly from this file without ambiguity
- `CrossModuleSnapshot.hire` field provides `candidates` and `roles` for R2/R5 capacity detection

---
*Phase: 03-rule-engine*
*Completed: 2026-03-15*
