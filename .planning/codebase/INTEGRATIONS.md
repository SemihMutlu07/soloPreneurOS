# External Integrations

**Analysis Date:** 2026-03-15

## APIs & External Services

**AI Evaluation:**
- Claude API (Anthropic) - Evaluates job candidates and sales leads
  - SDK: `@anthropic-ai/sdk` 0.78.0
  - Auth: `ANTHROPIC_API_KEY`
  - Implementation: `lib/claude-eval.ts` (PDF resume evaluation), `lib/claude-sales-eval.ts` (lead qualification)
  - Model: `claude-sonnet-4-20250514`

**Email Communication:**
- Gmail (Google APIs) - Scans inbound emails for job applications and sales inquiries
  - SDK: `googleapis` 171.4.0
  - Auth: OAuth2 with `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`
  - Implementation: `lib/gmail.ts` (fetches PDF attachments, parses email metadata)
  - Use cases: `app/api/cron/scan-gmail/route.ts` (hiring), `app/api/cron/scan-sales-gmail/route.ts` (sales)

**Email Delivery:**
- Resend - Sends interview invitations and notifications to candidates
  - SDK: `resend` 6.9.3
  - Auth: `RESEND_API_KEY`
  - Implementation: `lib/email.ts` (sendInterviewEmail, sendDuplicateNotification)
  - From address: `FROM_EMAIL` env var
  - Use cases: `app/api/hiring/candidates/[id]/interview/route.ts`

**Market Intelligence APIs:**
- Hacker News - Fetches top stories filtered by education/EdTech keywords
  - Endpoint: `https://hacker-news.firebaseio.com/v0/`
  - No auth required
  - Implementation: `app/api/signals/hackernews/route.ts`
  - Fallback: Mock data from `lib/mock-data.ts`

- Reddit - Fetches hot posts from education/SaaS subreddits
  - Endpoint: `https://www.reddit.com/r/{subreddit}/hot.json`
  - No auth required (User-Agent header required)
  - Implementation: `app/api/signals/reddit/route.ts`
  - Fallback: Mock data when API fails

- Product Hunt - Fetches featured products (optional, requires token)
  - Endpoint: `https://api.producthunt.com/v2/api/graphql`
  - Auth: `PRODUCTHUNT_TOKEN` (optional)
  - Implementation: `app/api/signals/producthunt/route.ts`
  - Fallback: Mock data if token not configured

## Data Storage

**Databases:**
- Supabase PostgreSQL (managed cloud database)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`
  - Auth (anonymous): `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Auth (service role): `SUPABASE_SERVICE_ROLE_KEY`
  - Client: `@supabase/supabase-js` 2.99.1

**File Storage:**
- Supabase Storage - Object storage for candidate resumes (PDF files)
  - Bucket: `resumes`
  - Path pattern: `{role}/{candidateId}.pdf`
  - Uploaded by: `app/api/cron/scan-gmail/route.ts`

**Caching:**
- HTTP response caching (via Next.js response headers)
  - Applied to signal endpoints: 30-minute cache (`s-maxage=1800`)

## Authentication & Identity

**Auth Provider:**
- Supabase Authentication
  - Implementation: Built-in Supabase auth via OAuth
  - Flow: `app/api/auth/callback/route.ts` handles OAuth code exchange
  - Session management: SSR-aware via `@supabase/ssr` package
  - Middleware: `middleware.ts` guards routes `/hiring/*`, `/sales/*`, `/finance/*` with redirect to `/login`
  - Client: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server components), `lib/supabase/admin.ts` (privileged operations)

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, LogRocket, or similar)

**Logs:**
- Standard Node.js console logging
- Cron error tracking: Errors logged in API route response bodies

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from `vercel.json`)

**Cron Jobs:**
- Vercel Cron configuration in `vercel.json`:
  - `/api/cron/scan-gmail` → Daily 2:00 AM (scans for hiring emails)
  - `/api/cron/evaluate` → Daily 3:00 AM (AI evaluates candidates)
  - `/api/cron/scan-sales-gmail` → Daily 2:30 AM (scans for sales emails)
  - `/api/cron/evaluate-leads` → Daily 3:30 AM (AI evaluates leads)
  - Auth: Bearer token via `CRON_SECRET` env var

**CI Pipeline:**
- Not detected (no GitHub Actions, GitLab CI, or similar)

## Environment Configuration

**Required env vars:**
- `ANTHROPIC_API_KEY` - Claude API key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (secret)
- `GMAIL_CLIENT_ID` - Google OAuth client ID
- `GMAIL_CLIENT_SECRET` - Google OAuth client secret
- `GMAIL_REFRESH_TOKEN` - Google OAuth refresh token
- `RESEND_API_KEY` - Resend email service API key
- `FROM_EMAIL` - Sender email address (default: `hiring@yourdomain.com`)
- `CRON_SECRET` - Bearer token for cron endpoints
- `GOOGLE_MEET_LINK` - Interview meeting link
- `EVAL_BATCH_SIZE` - Number of candidates to evaluate per cron run (default: 10)

**Optional env vars:**
- `PRODUCTHUNT_TOKEN` - Product Hunt API token (falls back to mock data if missing)

**Secrets location:**
- `.env.local` file (local development)
- Vercel environment variables (production)

## Webhooks & Callbacks

**Incoming:**
- `/api/auth/callback` - Supabase OAuth callback endpoint
- `/api/cron/scan-gmail` - Vercel cron trigger
- `/api/cron/evaluate` - Vercel cron trigger
- `/api/cron/scan-sales-gmail` - Vercel cron trigger
- `/api/cron/evaluate-leads` - Vercel cron trigger

**Outgoing:**
- Email send via Resend (interview invitations, notifications)
- No webhook callbacks detected

## API Rate Limits & Quotas

**Gmail API:**
- 15 quota units per request (listed in code)
- Batch size: max 50 messages per query
- PDF attachment extraction in-flight

**Claude API:**
- No explicit rate limiting in code
- Batch evaluation: `EVAL_BATCH_SIZE` (default 10) per cron execution to avoid quota issues

**Hacker News / Reddit / Product Hunt:**
- Hacker News: No auth/quota limits
- Reddit: Rate limit headers respected (default API behavior)
- Product Hunt: GraphQL API (limits vary by tier)

---

*Integration audit: 2026-03-15*
