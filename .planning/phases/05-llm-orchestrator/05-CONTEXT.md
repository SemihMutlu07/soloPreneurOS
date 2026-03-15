# Phase 5: LLM Orchestrator - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

After the rule engine runs and produces insights, invoke Claude to generate a 2-sentence narrative summary synthesizing cross-module state. Store the narrative as an additional insight record in `cross_module_insights`. This phase does NOT touch the dashboard UI — that's Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Narrative tone & purpose
- Audience framing: "The founder as CEO" — reads like a daily briefing from a trusted advisor, not a status report or alarm bell
- Purpose: synthesize the rule findings that fired into a coherent story — not open-ended Claude pattern discovery
- Structure: 2 sentences — sentence 1 synthesizes what the rules found, sentence 2 ends with an actionable nudge (a suggested next step)
- Relationship to rule cards on the dashboard: the narrative is the executive summary / header above the rule insight cards — visually elevated, a distinct insight type (e.g., `type: "narrative"`)

### LLM invocation trigger
- Conditional: only invoke Claude when at least one rule insight fired during this cron run
- Severity threshold: none — even if all fired insights are info-level, still generate a narrative (synthesis value is not just urgency)
- Exactly one narrative per cron run — content-addressed ID prevents duplicates on double-runs
- Manual refresh (Phase 7 dashboard button) triggers a full re-run: rules + LLM narrative both re-execute; fresh narrative replaces old one

### Failure handling
- Claude's Discretion: if the API call fails, rule-generated insights persist normally and the narrative is silently skipped — no cron data lost (per LLM success criteria 3)

</decisions>

<specifics>
## Specific Ideas

- Narrative tone example target: "Three signals this week point to a cash-flow risk while your pipeline is heating up. Consider following up on the 3 hot leads before runway tightens further."
- The narrative insight should be distinguishable from rule insights on the dashboard — use a distinct type or source field so Phase 7 can render it differently (as a header summary above the cards)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/claude-sales-eval.ts` + `lib/claude-eval.ts`: established Anthropic SDK pattern — `messages.create()`, JSON regex extraction (`text.match(/\{[\s\S]*\}/)`), field validation. The narrative call will follow the same pattern but returns plain text (2 sentences), not structured JSON.
- `app/api/cron/evaluate-leads/route.ts`: CRON_SECRET bearer token auth pattern — reuse exactly for the intelligence cron endpoint
- Per-item try/catch in cron loops: the existing pattern of not letting one failure abort the whole run applies here — wrap the LLM call in try/catch so rule insights survive a Claude API failure

### Established Patterns
- Claude model in use: `claude-sonnet-4-20250514` for evaluations — **verify at implementation time** whether to use Sonnet or downgrade to Haiku for cost on this lighter narrative task (STATE.md flags this)
- No streaming used anywhere — standard `await messages.create()` is the pattern
- Structured JSON prompts with explicit output format instructions in system prompt

### Integration Points
- Phase 4 delivers `cross_module_insights` Supabase table and the content-addressed ID dedup logic — the narrative insight is inserted into that same table
- Phase 4 delivers the intelligence cron endpoint — Phase 5 extends that cron to add the LLM call after the rule engine step
- Phase 2 delivers `CrossModuleSnapshot` — the narrative prompt's context (summarized counts/metrics) is derived from that snapshot, not raw Supabase arrays

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-llm-orchestrator*
*Context gathered: 2026-03-15*
