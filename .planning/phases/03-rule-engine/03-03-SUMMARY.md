---
phase: 03-rule-engine
plan: "03"
subsystem: intelligence/rules
tags: [tdd, rules, rule-engine, hire, finance, sales]
dependency_graph:
  requires:
    - 03-01  # types.ts, isHotLead
    - 03-02  # R1-R4 rule functions
  provides:
    - R5 candidate stall rule
    - R6 invoice/payroll collision rule
    - R7 hot leads no-reply rule
    - lib/intelligence/rules/index.ts barrel with runAllRules
  affects:
    - 04-xx  # Phase 4 cron pipeline imports runAllRules from this barrel
tech_stack:
  added: []
  patterns:
    - TDD RED-GREEN cycle with vitest fake timers
    - Barrel re-export pattern for rule orchestration
    - try/catch per-rule error isolation in runAllRules
key_files:
  created:
    - lib/intelligence/rules/r5-candidate-stall.ts
    - lib/intelligence/rules/r5-candidate-stall.test.ts
    - lib/intelligence/rules/r6-invoice-payroll.ts
    - lib/intelligence/rules/r6-invoice-payroll.test.ts
    - lib/intelligence/rules/r7-hot-leads-no-reply.ts
    - lib/intelligence/rules/r7-hot-leads-no-reply.test.ts
    - lib/intelligence/rules/index.ts
  modified: []
decisions:
  - "R6 large invoice threshold set at 10000 TL — filters minor billing issues from cash-flow alerts"
  - "R6 uses pending invoices (beklemede) as proxy for upcoming payroll/operational costs — no explicit payroll field in Finance module"
  - "runAllRules catches individual rule errors to prevent one failing rule from blocking others"
  - "index.ts uses explicit named imports for ALL_RULES registry to preserve function names for error logging"
metrics:
  duration: "3 minutes"
  completed_date: "2026-03-15"
  tasks_completed: 3
  files_created: 7
  tests_added: 33
---

# Phase 03 Plan 03: Rules R5-R7 and Barrel Index Summary

**One-liner:** Rules R5-R7 (candidate stall, invoice/payroll collision, hot-leads no-reply) implemented TDD with runAllRules barrel completing the rule engine.

## What Was Built

Three rule functions completing the full 7-rule engine, plus the barrel index that Phase 4's cron pipeline will use as its single import surface.

### R5 — Candidate Stall (`checkR5CandidateStall`)
Fires when pending/analyzed candidates stall 7+ days while active hiring roles exist. Uses `applied_at` as the staleness timestamp — no `updated_at` field on Candidate type.

### R6 — Invoice/Payroll Collision (`checkR6InvoicePayroll`)
Fires when a large overdue invoice (gross_amount > 10000 TL, status "gecmis") exists alongside pending financial obligations (status "beklemede"). Pending invoices are used as a proxy for upcoming payroll and operational costs.

### R7 — Hot Leads No-Reply (`checkR7HotLeadsNoReply`)
Fires when 2+ hot leads exist in the pipeline AND at least one has `last_contact_at` null or older than 48 hours. Requires 2+ hot leads to avoid false positives from single-lead pipelines.

### Barrel Index (`lib/intelligence/rules/index.ts`)
Re-exports all 7 rule functions by name. Exports `runAllRules(snapshot: CrossModuleSnapshot): RuleInsight[]` which:
- Calls all rules in sequence
- Catches individual rule errors (logs to console.error, does not propagate)
- Filters null results
- Returns RuleInsight[] — may be empty array

## Test Results

33 tests across 3 test files — all passing. Tests use `vi.useFakeTimers()` for time-dependent assertions (7-day stall, 48h no-reply).

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All created files confirmed on disk. All 3 task commits confirmed in git log:
- d55e075: test(03-03) — RED phase test files
- 86e3dd7: feat(03-03) — GREEN phase rule implementations
- b71399e: feat(03-03) — barrel index with runAllRules
