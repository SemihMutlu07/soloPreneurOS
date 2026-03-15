---
phase: 2
slug: unified-data-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (none detected — Wave 0 installs) |
| **Config file** | none — Wave 0 creates `vitest.config.ts` |
| **Quick run command** | `npx vitest run lib/intelligence/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` (fast type check, no test infra required)
- **After every plan wave:** Run `npx vitest run lib/intelligence/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 0 | DATA-04 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 0 | DATA-03 | unit | `npx vitest run lib/intelligence/data-aggregator.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | DATA-03 | unit | `npx vitest run lib/intelligence/data-aggregator.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 1 | DATA-03 | unit | `npx vitest run lib/intelligence/data-aggregator.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-03 | 02 | 1 | DATA-03 | unit | `npx vitest run lib/intelligence/data-aggregator.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-04 | 02 | 1 | DATA-03, DATA-04 | unit + type | `npx vitest run lib/intelligence/ && npx tsc --noEmit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D vitest` — no test framework currently installed
- [ ] `lib/intelligence/data-aggregator.test.ts` — stubs for DATA-03: partial-failure contract (null module on error, empty arrays on zero records, errors[] populated)
- [ ] `lib/intelligence/types.ts` — must exist before test stubs can import from it (types file created in Wave 0 alongside test setup)

*Wave 0 creates both test infrastructure and the types file (since tests import from types).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RunwayData table name matches Phase 1 output | DATA-03 | Phase 1 creates the table; name unknown at plan time | After Phase 1 ships: confirm table name in Supabase dashboard, update `fetchFinanceModule` table reference, run `npx vitest run` to confirm no query errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
