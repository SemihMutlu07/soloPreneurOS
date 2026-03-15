---
phase: 5
slug: llm-orchestrator
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (existing) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | LLM-01 | unit | `npx vitest run lib/claude-narrative` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | LLM-01 | unit | `npx vitest run lib/claude-narrative` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 2 | LLM-02 | unit | `npx vitest run lib/run-intelligence` | ❌ W0 | ⬜ pending |
| 5-01-04 | 01 | 2 | LLM-02 | integration | `npx vitest run lib/run-intelligence` | ❌ W0 | ⬜ pending |
| 5-01-05 | 01 | 2 | LLM-02 | unit | `npx vitest run lib/run-intelligence` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/claude-narrative.test.ts` — unit stubs for LLM-01 (prompt construction, text extraction)
- [ ] `__tests__/lib/run-intelligence-llm.test.ts` — stubs for LLM-02 (cron integration, error isolation)

*Existing vitest infrastructure covers framework; only test files need creation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Narrative appears in cross_module_insights after live cron run | LLM-01 | Requires real Claude API call + real Supabase | Trigger cron endpoint with valid CRON_SECRET; query cross_module_insights for rule_id='LLM' row |
| Narrative is 2 sentences, readable, references module metrics | LLM-01 | Content quality not machine-assertable | Review narrative text in Supabase; confirm it references sales/finance/hiring metrics |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
