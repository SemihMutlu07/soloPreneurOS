# Domain Pitfalls: Cross-Module AI Intelligence Layer

**Domain:** Cross-module AI insight aggregation added to an existing multi-module solopreneur OS
**Researched:** 2026-03-15
**Confidence:** HIGH — grounded in direct codebase analysis; all pitfalls reference specific files and existing patterns

---

## Critical Pitfalls

Mistakes that cause rewrites, runaway API costs, or user abandonment.

---

### Pitfall 1: Finance Data Is Unreachable from the Server

**What goes wrong:** Finance-OS stores all data (invoices, expenses, KDV, runway) in browser `localStorage` under `finance_invoices`, `finance_expenses`, etc. Any API route or cron job that tries to read Finance data will find nothing — `localStorage` does not exist in Node.js. An insight like "You have three open invoices from leads who just went cold" cannot be generated from the server at all.

**Why it happens:** Finance-OS was built as a pure client module (see `app/finance/page.tsx`, `lib/finance-types.ts`). There is no Supabase table for invoices or expenses. The cross-module engine will naturally be a server-side API route (like the existing cron jobs), so it will have zero access to Finance data unless that gap is bridged first.

**Consequences:**
- Cross-module insights that involve Finance silently produce incomplete or wrong analysis (e.g., runway vs. hire cost alerts reference only mock data)
- The insight engine appears to work but is actually blind to the most financially critical module
- If you build insight logic before migrating Finance data, every Finance-related insight will need to be rewritten

**Prevention:**
- Migrate Finance data to Supabase as the first task of the unified data layer phase, before building any insight logic
- Or, as a lighter alternative, create a server-side Finance API route that accepts a Finance snapshot POSTed from the client on dashboard load, enabling server-side analysis of client-held data

**Detection (warning signs):**
- Any insight generator function that tries to call `getProfile()` or read `localStorage` on the server returns `null`
- Finance-related cross-module insights always produce 0s or empty arrays in test runs
- The brief route (`app/api/brief/route.ts`) already works around this by reading Finance mock data — a pattern that will silently persist

**Phase:** Must be resolved in the unified data access layer phase, before insight engine development.

---

### Pitfall 2: Per-Render Claude API Calls (Cost Explosion)

**What goes wrong:** The existing agent pattern calls Claude on every component mount unless a cached result exists in `localStorage` (see `lib/agent-store.ts`, `isStale()` function). A cross-module insight engine that follows this same pattern but has richer context (Sales + Hire + Finance data) would be significantly more expensive per call. If the cache is invalidated too aggressively — or the insight card is placed on a page that re-mounts frequently — Claude API costs can spike unexpectedly.

**Why it happens:** The agent card pattern is `useEffect → check localStorage → if stale, call API → cache result`. This works for single-module agents with cheap context. Cross-module analysis requires assembling data from three sources and passing it all to Claude, making each call 3-5x more expensive in tokens.

**Consequences:**
- A solopreneur who checks the dashboard 20 times per day could generate 20 cross-module Claude calls instead of 1
- Sonnet 4 at roughly $3/million input tokens: a 2,000-token cross-module context × 20 calls/day = 40,000 tokens/day = ~$0.12/day = ~$43/year just for dashboard refreshes, before any cron jobs
- This is manageable at first but compounds as more insight types are added

**Prevention:**
- Cache cross-module insights server-side in Supabase (a dedicated `insights` table with `generated_at` and `ttl` columns), not just in `localStorage`
- Serve cached insights immediately; only regenerate when data in any source module has changed (use `updated_at` timestamps as cache invalidation signals)
- Enforce a minimum TTL of 4 hours for cross-module LLM analysis; rule-based insights can run more frequently without cost concern
- Use Claude Haiku for high-frequency rule-based checks; reserve Sonnet for the scheduled deep-analysis runs

**Detection (warning signs):**
- No `generated_at` timestamp stored with insight results
- Insight API route has no guard against re-running if last run was recent
- The insight card component calls the insight API directly from `useEffect` without checking a server-side cache first

**Phase:** Cache strategy must be designed before building any insight generation endpoint.

---

### Pitfall 3: Mock Data Masquerading as Real Insights

**What goes wrong:** `lib/mock-data.ts` (814 lines) is imported directly into `app/api/brief/route.ts` and `app/api/ask/route.ts`. The existing morning brief already passes mock lead pipeline data and mock student metrics to Claude as if they were real. A cross-module insight engine built on this foundation will generate confident-sounding, completely fabricated insights based on hardcoded fixture data.

**Why it happens:** Mock data provides a "working demo" feel without requiring real Supabase data. The existing brief route uses `leads` from `mock-data.ts` (not from Supabase) for its "Lead Action" section. There is no runtime guard preventing this in production.

**Consequences:**
- The AI recommends following up with "Arjun Sharma at TechCorp" (a mock lead) while real leads sit unactioned in Supabase
- Cross-module insights appear functional in development but are worthless in production
- Debugging is painful because insights look plausible — only careful inspection reveals they're based on fixtures

**Prevention:**
- Before adding cross-module insight logic, audit every data source the insight engine will use and verify each resolves to a real database query, not `mock-data.ts`
- Add a runtime check: if `NODE_ENV === 'production'` and a data source is returning mock values, log a warning and omit that module's data from the insight context rather than silently using fixtures
- Treat the mock-data migration as a precondition gate for the insight engine milestone

**Detection (warning signs):**
- Insight prompts reference data that was never entered by the user
- Lead names in insights match names in `lib/mock-data.ts`
- The insight API route imports anything from `lib/mock-data.ts`

**Phase:** Must be audited and resolved as part of the unified data layer phase.

---

### Pitfall 4: Alert Fatigue from Low-Signal Insights

**What goes wrong:** A cross-module insight engine that runs every hour and surfaces everything it finds will quickly train the user to ignore it. For a solopreneur, a notification is only valuable if it changes behavior. Generic observations like "You have 5 new leads" or "Your runway is 8 months" are visible on the dashboard already — restating them as "insights" adds noise without value.

**Why it happens:** It is easier to emit all detected patterns than to filter for actionability. Early insight prototypes tend to maximize recall (find everything) rather than precision (surface only things worth acting on). The existing morning brief already demonstrates the right instinct (it is designed to be opinionated and under 400 words) but the cross-module rule engine may not inherit that discipline.

**Consequences:**
- User stops reading the intelligence feed within 1-2 weeks
- High-value insights (a lead whose company just posted a job matching your product, a hire cost that exceeds the revenue from the deal they're meant to support) are buried in low-value ones
- Once users stop reading, it is very difficult to re-engage them

**Prevention:**
- Define an actionability test for every insight type before implementing it: "If this insight surfaces, what would the user do differently in the next 24 hours?" If the answer is "nothing," do not surface it
- Implement insight deduplication: the same pattern should not surface again until the underlying data changes
- Add a "last surfaced at" field to prevent the same insight from appearing more than once every N days unless the data meaningfully changes
- Limit the default feed to 3-5 insights maximum; a queue mechanism can hold lower-priority insights until high-priority ones are resolved

**Detection (warning signs):**
- Insight generation produces more than 5 results per run without any filtering step
- No deduplication or suppression logic exists in the insight storage schema
- Insight text is descriptive ("You have X leads") rather than prescriptive ("Call Y today because Z")

**Phase:** Insight scoring and suppression must be designed alongside (not after) insight generation logic.

---

### Pitfall 5: Assembling a Huge Context Blindly (Token Bloat + Hallucination Risk)

**What goes wrong:** The natural implementation of cross-module analysis is to dump all data from all three modules into a single Claude prompt and ask for insights. This approach quickly hits two problems: (1) the context becomes expensive and slow, and (2) Claude hallucinates correlations between data points that are actually unrelated, because it is pattern-matching on noise.

**Why it happens:** The existing `app/api/brief/route.ts` already constructs a large context string (company info, mind queue, decisions, signals, metrics, lead pipeline) and sends it all in one call. Cross-module analysis tempts the same "throw everything at it" approach. With three real modules worth of data, this context could easily exceed 8,000 tokens per call.

**Consequences:**
- Response latency increases (Sonnet responses at 8K+ token context are noticeably slower)
- Cost per call increases linearly with token count
- More data does not mean better insights — Claude will find patterns between Finance invoice #12 and hiring candidate #7 even when none exist, because it is prompted to find cross-module patterns
- Debug is nearly impossible because you cannot easily trace which data caused which insight

**Prevention:**
- Use the hybrid approach already planned (rules + LLM): rule-based pre-filtering identifies which modules have genuinely new or changed data, then LLM analysis is scoped to only the relevant delta
- Pass summaries, not raw records — e.g., "3 high-scoring leads (score > 70) in proposal stage, total pipeline value 450K TRY" not the full lead objects
- Design a context budget: define the maximum tokens for each module's contribution to the cross-module prompt
- Implement the rules engine first; only escalate to LLM for patterns the rules cannot classify

**Detection (warning signs):**
- Insight API route assembles raw arrays from all three modules into a single prompt string with no summarization step
- No token budget or context size limit is enforced before the Claude call
- The cross-module prompt is longer than the existing brief prompt (`app/api/brief/route.ts` at ~2,000 tokens)

**Phase:** Context assembly design must precede the LLM integration step.

---

## Moderate Pitfalls

---

### Pitfall 6: Hardcoded Business Context in Insight Prompts

**What goes wrong:** The same hardcoded `DEFAULT_BUSINESS_CONTEXT` already present in `lib/claude-sales-eval.ts` (line 25-26) will be copy-pasted into cross-module insight prompts. When the business pivots — different target market, new product, changed pricing — insight prompts become misaligned without any system to track or update them.

**Prevention:**
- Create a single `lib/business-context.ts` (or a `settings` table in Supabase) that is the single source of truth for business context passed to all Claude prompts
- The cross-module insight engine should fetch this context dynamically rather than hardcoding it

**Phase:** Data layer phase; must be unified before the insight engine builds on it.

---

### Pitfall 7: Type Drift Between Modules

**What goes wrong:** Each module has its own type file (`sales-types.ts`, `hiring-types.ts`, `finance-types.ts`) with no shared vocabulary. Notably, `mock-data.ts` defines a `Lead` type (with `stage`, `value`, `lastContact`) that is different from the canonical `Lead` type in `sales-types.ts` (with `status`, `deal_value`, `last_contact_at`). An insight engine that needs to join lead and invoice data will need to reconcile these types.

**Prevention:**
- Create a `lib/intelligence-types.ts` file with normalized cross-module data shapes used exclusively by the insight engine
- The unified data access layer should normalize all module data into these shared types before passing to any analysis function
- Never pass raw module types directly to insight generation functions

**Phase:** Must be done in the unified data layer phase before insight logic is written.

---

### Pitfall 8: Cron Overlap with Existing Evaluation Crons

**What goes wrong:** Adding a cross-module insight cron alongside the existing `evaluate-leads` and `scan-sales-gmail` crons creates scheduling conflicts. If the insight cron runs while `evaluate-leads` is mid-batch, the AI scores it reads may be partially updated — the insight engine sees some leads with `ai_score: null` and some with scores, producing misleading cross-module analysis.

**Prevention:**
- Design the insight cron to only read `ai_score IS NOT NULL` records — never read records that are awaiting evaluation
- Sequence cron jobs explicitly: Gmail scan → evaluate leads → cross-module insights
- Add a `data_freshness_at` field to the insight record so the user knows which data vintage the insight reflects

**Phase:** Insight engine scheduling phase.

---

### Pitfall 9: The In-Module Nudge Becomes Intrusive

**What goes wrong:** Contextual nudges inside each module (e.g., showing Finance context inside the Sales lead drawer) sound useful in design but become annoying if they appear on every record, regardless of relevance. A nudge that says "This lead's deal value exceeds your current monthly burn" for every lead in the pipeline is noise.

**Prevention:**
- Only show an in-module nudge when the cross-module correlation passes a relevance threshold (e.g., deal value > 2× monthly burn, not just > 0)
- Nudges should be dismissable and stay dismissed — use `localStorage` or a Supabase `dismissed_nudges` table
- A/B test the threshold mentally: "Would I act on this nudge if I saw it 10 times in a row?" If no, raise the threshold

**Phase:** In-module nudge implementation phase.

---

## Minor Pitfalls

---

### Pitfall 10: LocalStorage Race Conditions on Dashboard Load

**What goes wrong:** The dashboard loads multiple agent cards simultaneously, each independently reading from and writing to `localStorage`. If a cross-module insight card is added to the home dashboard alongside existing agent cards, they may all attempt to read Finance data from `localStorage` at the same moment, before any Finance data has been populated this session. The result is that the insight card sees empty Finance data and generates an incomplete insight, which then gets cached — causing stale incomplete insights to persist.

**Prevention:**
- Ensure the cross-module insight card does not read Finance data from `localStorage` directly; instead, have Finance-OS post a snapshot to a server endpoint on module load, making it available to subsequent server-side insight generation

---

### Pitfall 11: Insight IDs Not Stable Across Runs

**What goes wrong:** If each insight run generates new UUIDs for all insights (even repeated ones), the user cannot dismiss, snooze, or acknowledge a specific insight persistently. Dismissing "Lead pipeline is stalled" clears it from the UI, but the next cron run generates a new UUID for the same insight and it reappears.

**Prevention:**
- Use content-addressed IDs for insights: hash the insight type + key data points (e.g., `sha256("lead_pipeline_stalled:2026-03-15")`) so the same insight pattern produces the same ID across runs
- This enables reliable dismissal, snooze, and "last seen" tracking

---

### Pitfall 12: Claude Model Version Fragmentation

**What goes wrong:** Cross-module insights will introduce a third or fourth call site for the Claude model string. The model is already hardcoded in three places (`app/api/brief/route.ts`, `lib/claude-sales-eval.ts`, `app/api/cron/evaluate/route.ts`) as `"claude-sonnet-4-20250514"`. When Anthropic deprecates this model, all call sites break independently.

**Prevention:**
- Create `lib/claude-config.ts` with a single `CLAUDE_MODEL` constant before adding any new Claude call sites
- The cross-module insight engine should import from this config, not hardcode the model string

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Unified data access layer | Finance-OS localStorage not accessible server-side | Migrate Finance data to Supabase or design a client-to-server snapshot endpoint before building the layer |
| Unified data access layer | Mock data contaminating real queries | Audit all data sources; add `NODE_ENV` guards before the layer is considered complete |
| Rule-based pattern detection | Rules firing on every cron run regardless of data change | Add per-rule "last triggered at" tracking and suppression windows |
| LLM-powered open-ended analysis | Token bloat from raw module data | Enforce summarization step before assembling cross-module prompt; define token budget per module |
| Insight storage schema | No stable insight IDs enabling dismissal | Use content-addressed IDs from day one; add `dismissed_at` and `snoozed_until` columns |
| Dashboard intelligence feed | Alert fatigue from too many low-signal insights | Limit feed to 3-5 items; implement actionability scoring before surfacing any insight |
| In-module contextual nudges | Nudges appearing on every record regardless of relevance | Define relevance threshold (numeric) for each nudge type before implementing any nudge |
| Cron scheduling | Insight cron reads partially-evaluated lead data | Sequence crons explicitly; filter on `ai_score IS NOT NULL` in insight data queries |

---

## Sources

**Confidence note:** All pitfalls are HIGH confidence, grounded in direct codebase analysis:

- `lib/claude-sales-eval.ts` — hardcoded business context (Pitfalls 1, 6), JSON parse fragility
- `lib/agent-store.ts` + `lib/profile-store.ts` — localStorage-only persistence pattern (Pitfalls 1, 10)
- `app/api/brief/route.ts` — mock data contamination, large context assembly pattern (Pitfalls 3, 5)
- `app/api/cron/evaluate-leads/route.ts` — per-record Claude calls, batch processing (Pitfall 2)
- `lib/mock-data.ts` — mock data mixed with production logic (Pitfall 3)
- `lib/sales-types.ts` vs mock `Lead` type in `lib/mock-data.ts` — type drift (Pitfall 7)
- `.planning/codebase/CONCERNS.md` — tech debt audit confirming hardcoded context, sequential Claude calls, localStorage risks
- `.planning/codebase/ARCHITECTURE.md` — module isolation design, data flow analysis

No external sources were used. Assessment is based entirely on the current state of the codebase as of 2026-03-15.
