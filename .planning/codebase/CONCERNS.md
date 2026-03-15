# Codebase Concerns

**Analysis Date:** 2026-03-15

## Tech Debt

**Hardcoded business context for sales lead evaluation:**
- Issue: Sales lead evaluation uses hardcoded `DEFAULT_BUSINESS_CONTEXT` in `lib/claude-sales-eval.ts` (line 25-26). When the business pivots or targeting changes, all historical lead evaluations become misaligned and the AI scoring criteria is outdated.
- Files: `lib/claude-sales-eval.ts`, `app/api/cron/evaluate-leads/route.ts`
- Impact: Lead qualification scores become unreliable as the business evolves. Sales team may follow incorrect AI recommendations based on stale context.
- Fix approach: Move `businessContext` to a Settings page or configuration table in Supabase. Fetch dynamically in evaluation functions. Version context changes to track scoring drift over time.

**Mock data embedded in production codebase:**
- Issue: `lib/mock-data.ts` (814 lines) contains extensive mock data for invoices, expenses, leads, candidates, and decisions. This data is mixed with real application logic and type definitions, making it difficult to distinguish between development fixtures and actual data.
- Files: `lib/mock-data.ts` (entire file), consumed by `app/api/brief/route.ts`, `app/api/ask/route.ts`, and multiple UI components
- Impact: Risk of accidentally deploying mock data to production. Difficult to test with realistic data volumes. No clear separation of concerns between type definitions and test fixtures.
- Fix approach: Move type definitions to separate `lib/*-types.ts` files. Create a dedicated test fixtures directory (`__fixtures__/`) or mocking library. Use environment variables to gate mock data loading to development only.

**Inconsistent environment variable validation:**
- Issue: 32 uses of `process.env.*` throughout codebase with inconsistent handling. Some routes check for required keys (`ANTHROPIC_API_KEY` in `/api/brief`), others silently fail with non-nullish assertion (`process.env.GMAIL_CLIENT_ID!` in multiple Gmail functions). No centralized configuration validation at application startup.
- Files: `app/api/brief/route.ts`, `app/api/cron/scan-sales-gmail/route.ts`, `lib/gmail.ts`, `lib/supabase/admin.ts`
- Impact: Missing environment variables cause runtime errors instead of failing fast at startup. Production deployments may proceed without critical secrets configured. Difficult to diagnose missing config issues.
- Fix approach: Create `lib/env.ts` with a validation function that runs at app startup. Use `zod` or similar schema validator to parse and validate all required environment variables. Export typed config object for use throughout codebase.

**Unused or placeholder type definitions:**
- Issue: Type system uses broad `any` types in several places: `agentContext: { signals?: any[]; tasks?: any[] }` in `/api/brief/route.ts` (line 27), `normalizeSignals(phRes: any, redditRes: any, hnRes: any)` in `components/agents/market-scout.tsx` (line 36).
- Files: `app/api/brief/route.ts`, `components/agents/market-scout.tsx`
- Impact: Loss of type safety in critical data processing code. Harder to catch API response shape changes. Reduced IDE autocomplete and refactoring support.
- Fix approach: Define concrete types for all API responses. Use discriminated unions for signal types. Generate types from API schemas or documentation.

## Known Bugs

**No recovery from JSON parse errors in lead evaluation:**
- Symptoms: If Claude returns malformed JSON in sales lead evaluation, the regex extraction fails silently and throws "Failed to parse sales evaluation response as JSON" with no indication of what Claude actually returned.
- Files: `lib/claude-sales-eval.ts` (lines 91-93)
- Trigger: Claude API response contains valid text but not valid JSON (e.g., markdown code block wrapper, explanatory text before JSON)
- Workaround: None — lead evaluation fails and cron job logs error but doesn't retry
- Fix approach: Log the full response text before parsing failure. Implement retry logic with exponential backoff. Add fallback to conservative scoring (low score) instead of hard failure.

**Timer cleanup missing in onboarding flow:**
- Symptoms: Agent appearance animations use multiple `setTimeout` calls but potential edge case if component unmounts during staggered animation sequence (lines 186-196 in `components/onboarding/onboarding-flow.tsx`).
- Files: `components/onboarding/onboarding-flow.tsx` (lines 186-196)
- Trigger: User navigates away during onboarding completion animations
- Workaround: None — minor memory leak on rare occurrence
- Fix approach: Store all timeout IDs in array and clear all timeouts in cleanup function on unmount.

**Lead email duplicate detection relies on subject line stability:**
- Symptoms: Duplicate detection uses email address + subject line as composite key in `/api/cron/scan-sales-gmail/route.ts` (lines 90-92). If same sender emails about the same topic twice, second email is skipped even if it's a legitimate follow-up.
- Files: `app/api/cron/scan-sales-gmail/route.ts` (lines 87-96)
- Trigger: Sender replies to same email thread or sends new email with same subject
- Workaround: Manually delete duplicate from database if needed
- Fix approach: Use Gmail message ID instead of subject line. Or extend duplicate detection to check creation date — only skip if within 24 hours.

## Security Considerations

**CRON_SECRET is single shared token across all cron endpoints:**
- Risk: All four cron jobs use the same `CRON_SECRET` bearer token. If token is compromised, all cron endpoints are exposed. No per-endpoint authentication or rate limiting.
- Files: `app/api/cron/scan-gmail/route.ts`, `app/api/cron/evaluate/route.ts`, `app/api/cron/scan-sales-gmail/route.ts`, `app/api/cron/evaluate-leads/route.ts`
- Current mitigation: Token is in environment variable, not hardcoded
- Recommendations:
  1. Implement Vercel's built-in `Authorization: Bearer <Vercel-Cron-Secret>` header validation instead of custom token
  2. Or use separate secrets per cron endpoint
  3. Add request signing with HMAC to detect tampering
  4. Add rate limiting per endpoint (e.g., max 1 request per 5 minutes)

**Gmail OAuth credentials stored as plain text environment variables:**
- Risk: `GMAIL_REFRESH_TOKEN` and OAuth client ID/secret stored in `.env.local`. If `.env.local` is committed accidentally or system is compromised, full Gmail account access is exposed.
- Files: `.env.local.example` (lines 10-12), `lib/gmail.ts` (lines 4-11)
- Current mitigation: `.env.local` is in `.gitignore` (assumed)
- Recommendations:
  1. Use Supabase vault or AWS Secrets Manager for secrets in production
  2. Implement secret rotation policy for long-lived refresh tokens
  3. Add audit logging for all Gmail API calls
  4. Consider using delegated auth or service account instead of personal Gmail

**No validation of email sender before creating leads:**
- Risk: `app/api/cron/scan-sales-gmail/route.ts` extracts sender email from Gmail header and inserts directly into database without sanitization. Email regex extraction could be bypassed.
- Files: `app/api/cron/scan-sales-gmail/route.ts` (lines 46-49), `lib/gmail.ts` (lines 46-58)
- Current mitigation: Supabase constraints (if any)
- Recommendations:
  1. Validate email format using standard email validation library
  2. Check against disposable email provider lists
  3. Implement DKIM/SPF verification for corporate emails
  4. Add spam/phishing detection scoring

**API response data passed through localStorage without sanitization:**
- Risk: Morning brief and decision history stored in localStorage and parsed back without sanitization. Malicious data stored in localStorage could execute during JSON.parse or render as XSS if output to DOM.
- Files: `components/agents/chief-of-staff.tsx` (lines 57-97), `app/finance/page.tsx`, `components/agents/daily-ops.tsx`
- Current mitigation: Data is from trusted sources (own API), but no defense-in-depth
- Recommendations:
  1. Use secure JSON parsing library that validates structure
  2. Store only serialization-safe primitive values
  3. Validate schema after parsing (use zod/yup)
  4. Consider IndexedDB instead of localStorage for sensitive data

## Performance Bottlenecks

**Gmail email fetching loops through messages sequentially:**
- Problem: `fetchRecentEmails` and `fetchEmailsWithPDFs` in `lib/gmail.ts` (lines 34-58, 43-85) use `for...of` loops that fetch each email detail sequentially. With 50 email limit, each email fetch is a network round-trip.
- Files: `lib/gmail.ts` (lines 34-58 for regular emails, 43-85 for PDFs)
- Cause: No parallelization of Gmail API calls. Native Gmail API doesn't support batch operations for message details in this SDK version.
- Improvement path:
  1. Use `Promise.all()` to fetch all 50 messages in parallel (check Gmail API rate limits — likely 5000 requests/minute)
  2. Consider using googleapis batch API if available
  3. Cache recently fetched message IDs to avoid re-fetching same messages across cron runs

**Sales lead evaluation calls Claude API once per lead (not batched):**
- Problem: `app/api/cron/evaluate-leads/route.ts` calls `evaluateLead()` in a loop (lines 29-66) with individual Claude API requests. With `EVAL_BATCH_SIZE=10`, that's 10 separate API calls, each with overhead.
- Files: `app/api/cron/evaluate-leads/route.ts` (lines 29-66)
- Cause: No batch processing. Each lead waits for previous evaluation to complete.
- Improvement path:
  1. Evaluate multiple leads in a single Claude prompt using batch scoring
  2. Use Claude's batch API (if available in SDK version) for asynchronous processing
  3. Implement caching so repeated evaluations of same lead don't re-call Claude
  4. Consider cheaper models (Claude Haiku) for initial screening

**No pagination/limits on Supabase queries without explicit limit:**
- Problem: `/api/sales/leads` route selects all leads from database with `.select("*")` (line 15). With thousands of leads, query becomes slow and memory-intensive. No cursor-based pagination.
- Files: `app/api/sales/leads/route.ts` (lines 15-27)
- Cause: Query returns full dataset. No default limit. Client receives all records regardless of display.
- Improvement path:
  1. Add default limit (e.g., 50) and cursor-based pagination
  2. Use Supabase RLS row filtering instead of client-side filters
  3. Add database indexes on `status` and `source` columns
  4. Implement search with full-text search instead of filtering in memory

**Mock data loaded on every API request:**
- Problem: `lib/mock-data.ts` (814 lines) is imported into `/api/brief` and `/api/ask` routes. Entire mock dataset is parsed and passed to Claude on every request.
- Files: `lib/mock-data.ts` (imported by `app/api/brief/route.ts`, `app/api/ask/route.ts`)
- Cause: No caching of mock data. String templates rebuild context data every request.
- Improvement path:
  1. Move to real database queries instead of mock data
  2. Cache context data in memory or Redis
  3. Or lazy-load only requested data slices
  4. Use incremental static regeneration for frequently-requested briefings

## Fragile Areas

**Gmail authentication setup has no validation:**
- Files: `lib/gmail.ts` (lines 4-11), `app/api/cron/scan-sales-gmail/route.ts` (lines 7-16)
- Why fragile: `getAuthClient()` creates OAuth2 client with environment variables but doesn't validate if refresh token is still valid. If token expires and isn't refreshed by Gmail API wrapper, all email fetching fails silently.
- Safe modification: Add refresh token validation function. Test OAuth flow in non-production environment first. Log token refresh events.
- Test coverage: No tests for Gmail authentication refresh flow.

**Sales lead status progression has no validation:**
- Files: `app/api/cron/evaluate-leads/route.ts` (line 40-41), `app/api/sales/leads/[id]/reply/route.ts` (lines 78-79)
- Why fragile: Status transitions are hardcoded (`"new"` → `"qualified"` if score >= 40). No state machine to prevent invalid transitions (e.g., can't go from `"won"` back to `"new"`). Concurrent updates could corrupt status.
- Safe modification: Implement status transition validation. Use Supabase transactions to prevent concurrent updates. Define explicit state machine with allowed transitions.
- Test coverage: No tests for status transition edge cases.

**Claude response parsing depends on exact JSON format:**
- Files: `lib/claude-sales-eval.ts` (lines 91-96)
- Why fragile: Regex `/\{[\s\S]*\}/` extracts first JSON object from Claude response. If Claude includes multiple JSON objects or wraps response in markdown code block, parsing breaks.
- Safe modification: Use dedicated JSON parsing library (e.g., `json-to-ast`). Add response validation with schema. Implement Claude function calling instead of string parsing.
- Test coverage: Only tested with specific Claude model output. Brittle to model behavior changes.

**Invoice and expense financial calculations use floating point:**
- Files: `lib/mock-data.ts` (lines 259-425), `components/finance/invoice-form.tsx` (implicitly)
- Why fragile: No explicit rounding or decimal handling. KDV calculations, currency conversions (`245000 / TCMB_USD_RATE`), and tax computations use JavaScript floats which accumulate precision errors.
- Safe modification: Use BigDecimal or currency library (e.g., `dinero.js`). Round explicitly after each calculation. Store amounts as integers (cents) in database.
- Test coverage: No financial calculation validation tests.

## Scaling Limits

**Hard limit of 50 Gmail messages per cron run:**
- Current capacity: 50 messages scanned per run (hardcoded in `lib/gmail.ts` line 37, 36)
- Limit: If more than 50 sales emails arrive between 2:30 AM runs, some leads are missed. No queue for backlog.
- Scaling path:
  1. Implement sliding window with timestamp tracking to fetch all messages since last run
  2. Or split into multiple API calls with pagination
  3. Or use Gmail push notifications instead of polling

**Single-threaded Claude evaluations:**
- Current capacity: `EVAL_BATCH_SIZE=10` (default) limits to 10 lead evaluations per cron run
- Limit: With 10-15 new leads per day, backlog will grow. Evaluation becomes 2+ hours of cron execution, risking timeout.
- Scaling path:
  1. Move to background job queue (Bull, Inngest)
  2. Or use Claude batch API for async processing
  3. Or implement pre-qualification filters (whitelist domains, regex patterns) before Claude evaluation

**Hardcoded single Vercel deployment:**
- Current capacity: All cron jobs, API routes, and UI run on single Vercel instance
- Limit: As leads and evaluations scale, single function can timeout. No redundancy. Database contention on concurrent leads API calls.
- Scaling path:
  1. Separate cron jobs to dedicated serverless functions
  2. Add database read replicas for high-traffic endpoints
  3. Implement caching layer (Redis) for frequently accessed data
  4. Consider managed queue service (AWS SQS, Google Cloud Tasks)

## Dependencies at Risk

**Claude API model hardcoded as `claude-sonnet-4-20250514`:**
- Risk: Model version hardcoded in three places (`app/api/brief/route.ts`, `lib/claude-sales-eval.ts`, `app/api/cron/evaluate/route.ts`). If Anthropic deprecates model, application breaks. No fallback or version negotiation.
- Impact: Update requires code changes and redeployment. No gradual migration path.
- Migration plan:
  1. Create `lib/claude-config.ts` with model version constant
  2. Implement fallback chain (try latest model, fall back to stable)
  3. Add monitoring/alerting for model deprecation notices
  4. Consider using model selection based on use case (brief uses latest, evaluations use cheaper Haiku)

**Gmail API uses deprecated `google.auth.OAuth2` directly:**
- Risk: OAuth2 flow is manual and error-prone. googleapis v171+ may have breaking changes. No refresh token rotation built-in.
- Impact: Long-lived refresh tokens could be compromised. Manual refresh token management is fragile.
- Migration plan:
  1. Migrate to OAuth 2.0 Service Account if possible
  2. Or use third-party Gmail service (e.g., Zapier, IFTTT) for email polling
  3. Implement automatic refresh token rotation
  4. Add token expiration monitoring

## Missing Critical Features

**No lead response templating or preview before sending:**
- Problem: Lead reply endpoint (`app/api/sales/leads/[id]/reply/route.ts`) sends email immediately without user preview or template selection. AI-drafted response from `ai_draft_response` field is not user-edited.
- Blocks: User cannot verify/customize AI response before sending. Risk of sending inappropriate or off-brand responses to prospects.

**No duplicate candidate detection or cross-hiring-pool dedup:**
- Problem: Two similar candidates could be evaluated separately without system knowing they're the same person. No email/name similarity matching.
- Blocks: Hiring team wastes time on duplicate evaluations. Candidate experience degrades if they see conflicting communications.

**No audit trail for lead status changes:**
- Problem: `lead_activities` table exists but status changes aren't logged. Admin can't see who changed status or why.
- Blocks: No accountability. Difficult to debug lead pipeline issues. Compliance/audit requirements not met.

**No rate limiting on API endpoints:**
- Problem: Public endpoints like `/api/sales/leads` have no rate limiting. Single user could enumerate all leads or cause resource exhaustion.
- Blocks: Production vulnerability. No protection against abuse.

**No transaction support for multi-step operations:**
- Problem: Sending reply to lead and logging activity are two separate Supabase calls. If second fails, reply was sent but activity wasn't logged.
- Blocks: Data integrity issues. Lead history becomes inaccurate.

## Test Coverage Gaps

**No tests for Claude evaluation robustness:**
- What's not tested: Response parsing with various JSON formats, malformed responses, timeouts, rate limiting
- Files: `lib/claude-sales-eval.ts`
- Risk: Claude API changes or unexpected responses will cause silent failures in cron jobs
- Priority: High — this is critical path for sales pipeline

**No tests for email extraction regex:**
- What's not tested: Email addresses with special characters, non-ASCII names, quoted strings in headers
- Files: `lib/gmail.ts` (lines 46-49, 55-58)
- Risk: Leads with malformed email headers are silently skipped or stored incorrectly
- Priority: High — impacts data quality

**No tests for localStorage caching logic:**
- What's not tested: Stale cache handling, corrupted localStorage data, quota exhaustion
- Files: `components/agents/chief-of-staff.tsx` (lines 57-97), `components/agents/daily-ops.tsx`
- Risk: Users see stale briefs/tasks, or UI breaks if localStorage is full
- Priority: Medium — impacts UX but non-critical

**No tests for Supabase query builders:**
- What's not tested: SQL injection via dynamic query parameters, missing required parameters
- Files: `app/api/sales/leads/route.ts` (lines 15-27), `app/api/cron/scan-sales-gmail/route.ts` (lines 87-92)
- Risk: Malicious input or missing validation could expose sensitive data
- Priority: High — security-relevant

**No end-to-end tests for cron job workflows:**
- What's not tested: Full Gmail scan → lead extraction → Claude evaluation → database update cycle
- Files: All cron job routes
- Risk: Silent failures in production that aren't caught until business impact (missed leads, wrong evaluations)
- Priority: High — these are background processes with no user feedback

---

*Concerns audit: 2026-03-15*
