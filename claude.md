# soloPreneurOS

## What is this?
An AI-powered daily operating system for EdTech solopreneurs. It's a dashboard that acts as a "thinking partner" — not a task manager, but a decision-support system that works while you sleep and briefs you in the morning.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Database:** Supabase (Postgres + Auth + Storage)
- **Email:** Resend (transactional emails)
- **Gmail:** googleapis (OAuth2, server-side cron)
- **Deploy:** Vercel (with cron jobs)
- **Icons:** Lucide React

## Architecture Principles
- Main dashboard at `/` is a single-page layout (unchanged from MVP)
- Mock data in `/lib/mock-data.ts` — realistic, not lorem ipsum
- One real API integration: Sabah Brief (Morning Brief) uses Anthropic API
- All other modules render mock data that looks real
- Mobile-responsive but desktop-first (jüri will likely view on desktop)
- Dark theme, editorial/magazine aesthetic — NOT generic SaaS dashboard

## Module Structure

### Tier 1 — Core (Real functionality)
1. **Morning Brief** (`/components/morning-brief.tsx`)
   - AI-generated daily brief via Anthropic API
   - "Bugün şunu yap" format — actionable, opinionated
   - Pulls context from mock data (signals, priorities, decisions)
   - Has a "Generate Brief" button that makes real API call

2. **Mind Queue / Kafandaki Konular** (`/components/mind-queue.tsx`)
   - Interactive priority list: critical / important / can wait
   - Drag or click to reprioritize
   - Items persist in localStorage

3. **Today's Decisions / Bugünün Kararları** (`/components/todays-decisions.tsx`)
   - 2-3 binary or multiple-choice decisions
   - "Decide now" UX — reduce decision fatigue
   - Mock data but interactive (user can pick)

4. **External Signals / Dış Sinyaller** (`/components/external-signals.tsx`)
   - Product Hunt, Reddit, Google Trends cards
   - Mock data with realistic titles, scores, timestamps
   - Shows "what's happening in your market"

### Tier 2 — Insight Layers (Mock data, AI-styled commentary)
5. **Student Insights** (`/components/student-insights.tsx`)
   - Where students get stuck, what they learn
   - Mock analytics with AI-generated commentary (static strings)

6. **Teacher Insights** (`/components/teacher-insights.tsx`)
   - Are teachers actually using the system?
   - Usage patterns, engagement mock data

### Tier 3 — Integrations (Mock UI, no real API)
7. **Calendar View** (`/components/calendar-view.tsx`)
   - Fake Google Calendar events
   - Shows "mind queue items → calendar blocks" concept

8. **Lead Pipeline** (`/components/lead-pipeline.tsx`)
   - Fake email signals parsed from "Gmail"
   - Kanban-style: New → Contacted → Demo → Won/Lost

9. **Founder Stories** (`/components/founder-stories.tsx`)
   - Daily rotating quote/insight from indie hackers
   - Static, one card, lightweight

## Design Direction
- **Aesthetic:** Dark, editorial, magazine-like. Think Linear meets Raycast meets Bloomberg Terminal.
- **Typography:** Use a distinctive monospace or geometric sans for headings. Not Inter, not Roboto.
- **Color:** Dark background (#0a0a0a or similar), accent color — sharp green or amber.
- **Cards:** Subtle borders, no heavy shadows. Glass-morphism sparingly.
- **Motion:** Subtle fade-in on load, no excessive animation.
- **Layout:** CSS Grid, asymmetric where it makes sense. Dense but readable.

## Hiring Module (Hire-OS)

### Overview
AI-powered hiring pipeline at `/hiring`. Separate from the main dashboard — has its own layout, auth guard, and data layer via Supabase.

### Auth
- Supabase Auth (email/password) — login at `/login`
- `middleware.ts` protects `/hiring/*` routes only. Main dashboard at `/` requires no auth.
- Three Supabase clients:
  - `lib/supabase/client.ts` — browser client (anon key, cookie auth)
  - `lib/supabase/server.ts` — server component client (anon key, cookie auth, respects RLS)
  - `lib/supabase/admin.ts` — service role client (bypasses RLS, used by cron jobs only)

### Database (Supabase)
- `candidates` — name, email, role, pdf_url, status (pending → analyzed → reviewed), duplicate tracking
- `evaluations` — strong_signals, risk_flags, critical_question, recommendation (GÖRÜŞ/GEÇME/BEKLET), raw_score
- `roles` — rubric + task content per role, seeded from `rubrics/` and `tasks/` directories
- Storage bucket: `resumes` (private), path: `{role}/{candidate_id}.pdf`
- RLS enabled on all tables — authenticated users can read/write, service role bypasses
- Schema + RLS in `supabase/migrations/001_initial_schema.sql` (not pushed to git)
- Seed data in `supabase/seed.sql` (not pushed to git)

### Cron Jobs (Vercel)
- `/api/cron/scan-gmail` — daily 02:00 UTC: scans Gmail for PDF attachments, uploads to Supabase Storage, creates candidate rows
- `/api/cron/evaluate` — daily 03:00 UTC: pulls pending candidates (LIMIT 10), runs Claude PDF evaluation, writes results
- Both require `Authorization: Bearer {CRON_SECRET}` header
- Schedule defined in `vercel.json`

### Claude Evaluation
- `lib/claude-eval.ts` — uses `type: "document"` content block (native PDF support)
- System prompt includes role rubric + task from `roles` table
- Returns: `{strong_signals, risk_flags, critical_question, recommendation, raw_score}`
- Model: claude-sonnet-4-20250514

### Gmail Integration
- `lib/gmail.ts` — OAuth2 via googleapis, fetches emails with PDF attachments
- Role extracted from subject line: `[role-name]` or `role: name` pattern, defaults to "general"
- Duplicate detection: unique constraint on (email, role), `previous_application_id` links re-applications

### Email (Resend)
- `lib/email.ts` — interview invitation + duplicate notification emails
- Triggered via `/api/hiring/candidates/[id]/interview` POST endpoint

### Pages & Components
- `/hiring` — stats bar + sortable/filterable candidate table (server component)
- `/hiring/candidate/[id]` — candidate detail + evaluation card + interview action
- Components in `components/hiring/`: stats-bar, candidate-table, evaluation-card, candidate-detail, duplicate-badge, interview-action, login-form

### Env Vars (Hiring)
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
RESEND_API_KEY, FROM_EMAIL
EVAL_BATCH_SIZE, GOOGLE_MEET_LINK, CRON_SECRET
```

### Local-only files (not in git)
- `rubrics/` — role-specific evaluation rubric .md files
- `tasks/` — role-specific task description .md files
- `supabase/` — migration SQL + seed SQL

## Code Style
- Functional components only, no classes
- Named exports for components
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- API routes in `/app/api/`
- Environment variables: see `.env.local.example` for full list
- No unnecessary abstractions — this is an MVP, keep it flat

## File Structure
```
soloPreneurOS/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                         # Main dashboard (unchanged)
│   ├── globals.css
│   ├── login/page.tsx                   # Supabase auth login
│   ├── hiring/
│   │   ├── layout.tsx                   # Hiring section layout + nav
│   │   ├── page.tsx                     # Candidate list + stats
│   │   └── candidate/[id]/page.tsx      # Candidate detail + eval
│   └── api/
│       ├── brief/route.ts              # Anthropic API call
│       ├── auth/callback/route.ts       # Supabase auth callback
│       ├── cron/
│       │   ├── scan-gmail/route.ts      # Gmail PDF scan cron
│       │   └── evaluate/route.ts        # Claude evaluation cron
│       └── hiring/candidates/
│           ├── route.ts                 # GET candidates list
│           └── [id]/
│               ├── route.ts             # GET single candidate
│               └── interview/route.ts   # POST send interview email
├── components/
│   ├── hiring/
│   │   ├── candidate-table.tsx
│   │   ├── candidate-detail.tsx
│   │   ├── evaluation-card.tsx
│   │   ├── stats-bar.tsx
│   │   ├── duplicate-badge.tsx
│   │   ├── interview-action.tsx
│   │   └── login-form.tsx
│   └── ... (existing dashboard components)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # Browser client
│   │   ├── server.ts                    # Server client
│   │   └── admin.ts                     # Service role client
│   ├── claude-eval.ts                   # Claude PDF evaluation
│   ├── gmail.ts                         # Gmail API integration
│   ├── email.ts                         # Resend email sending
│   ├── hiring-types.ts                  # Candidate, Evaluation, Role types
│   ├── constants.ts                     # Status enums, config
│   ├── mock-data.ts
│   └── utils.ts
├── middleware.ts                         # Auth guard (/hiring/* only)
├── vercel.json                          # Cron schedules
├── .env.local.example
└── CLAUDE.md
```

## Mock Data Guidelines
- EdTech context: The solopreneur runs an AI-powered K-12 learning platform
- Product name in mock data: "LearnLoop" (fictional)
- Market: UK expansion, MENA exploration
- Realistic numbers: 1,247 active students, 89 teachers, $4.2k MRR
- Signals: real Product Hunt product names, real Reddit subreddit names
- Calendar: realistic founder schedule (investor call, user interview, dev sprint)

## AI Behavior Rules
- Always check existing files before creating new ones — don't overwrite work
- Never delete or overwrite mock-data.ts without asking
- Run `npm run build` after major changes to catch TS errors early
- When styling, always use the CSS variables defined in globals.css
- Prefer Tailwind classes over inline styles
- Keep components under 150 lines — split if longer
- Don't install packages without mentioning it first
- If a component needs data, import from lib/mock-data.ts — don't hardcode
- Commit after each working module with a descriptive message
- When in doubt about design, re-read the Design Direction section above

## What NOT to do
- Don't touch the main dashboard (`/`) when working on hiring module
- Don't modify existing components in `components/` root — hiring components live in `components/hiring/`
- Don't use `createAdminClient()` outside of cron jobs — dashboard/API routes use `createClient()` (server)
- Don't commit `rubrics/`, `tasks/`, or `supabase/` directories to git
- Don't hardcode Supabase URLs or keys — always use env vars
- No over-engineering — ship fast, look good
- No generic dashboard templates — this should feel custom