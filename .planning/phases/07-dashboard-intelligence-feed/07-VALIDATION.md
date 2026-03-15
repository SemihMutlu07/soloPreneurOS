---
phase: 7
slug: dashboard-intelligence-feed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds (tsc), ~15 seconds (vitest) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green + manual browser verification
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | DASH-01 | manual | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 7-01-02 | 01 | 1 | DASH-02 | manual | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 7-01-03 | 01 | 1 | DASH-03 | manual | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 7-01-04 | 01 | 1 | DASH-05 | manual | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 7-02-01 | 02 | 1 | DASH-04 | manual | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 7-02-02 | 02 | 1 | DASH-06 | manual | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 7-02-03 | 02 | 1 | DASH-07 | manual | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 7-03-01 | 03 | 2 | DASH-08 | TypeScript compile | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Confirm `npx tsc --noEmit` passes before starting Wave 1 (baseline TypeScript check)
- [ ] Confirm `npx vitest run` passes (existing server-side tests green)

*Note: No new test files required — UI components are tested via manual browser verification. TypeScript compilation is the automated compile-time guard for prop contracts.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Feed renders on dashboard and calls GET /api/intelligence/insights on mount | DASH-01 | React component rendering requires jsdom; vitest config is node-only | Load dashboard, open Network tab, confirm GET /intelligence/insights fires |
| Severity badges render with correct color (critical=red, warning=amber, info=blue) | DASH-02 | Visual rendering — no DOM test env | Visually inspect each severity badge color on a real insight card |
| Freshness timestamp displays relative time from generated_at | DASH-03 | UI rendering | Check insight card shows "X minutes ago" or similar |
| Dismiss calls POST /dismiss and removes card on 204 | DASH-04 | Network + DOM interaction | Click dismiss, confirm card disappears, check Network tab for 204 |
| Evidence text from insight.evidence displays on card | DASH-05 | UI rendering | Confirm evidence explanation text appears on each rule card |
| Refresh calls POST /trigger, shows skeleton 3s, then re-fetches | DASH-06 | Timing + DOM interaction | Click Refresh, confirm skeleton appears for ~3s, then cards reload |
| Empty state message shown when no active insights | DASH-07 | Conditional rendering | Dismiss all insights or test with empty DB; confirm "No cross-module patterns detected" message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
