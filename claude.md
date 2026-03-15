# soloPreneurOS

## Product Definition

**One-liner:** soloPreneurOS is a Turkey-first operating system for solo founders that turns hiring, sales, and funding workflows into a daily decision queue.

**What it is:** An AI-powered daily operating system for solopreneurs. A dashboard that acts as a "thinking partner" — not a task manager, but a decision-support system that works while you sleep and briefs you in the morning.

**What it is NOT:**
- Not a CRM (no contact management depth)
- Not an ATS (no full recruiting workflow)
- Not an accounting tool (no GİB/entegratör integration)
- Not a project management tool (no sprints, no tickets)

**Core value proposition:** "What should I decide today?" — Every module exists to surface decisions, not display data.

### Product Scope

New features must map to one of:
- **Decision support** — helps founder make a better choice
- **Workflow automation** — removes manual steps from a recurring process
- **Pipeline visibility** — shows where things stand at a glance
- **Risk reduction** — flags things that are slipping, stalling, or expiring

If a feature doesn't serve one of these four, it doesn't belong.

### User Model

- **Primary:** Solo founder (tek kurucu), any sector, Turkey-based
- **Secondary:** Small team founder (2-3 people), where founder still handles ops
- **Future:** Operator / chief of staff role
- **Architecture:** Sector-agnostic. Mock data uses EdTech context but all data models are generic.

### Success Metrics

- Time to first useful morning brief
- Time to first decision completed (any module)
- Time to first pipeline item created
- Daily return rate (does the founder come back tomorrow?)
- AI suggestion acceptance rate (how often does founder click "Execute" vs dismiss?)
- Pipeline progression rate (items moving forward, not just sitting)

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4 (CSS variables via `@theme` in globals.css)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Database:** Supabase (Postgres + Auth + Storage)
- **Email:** Resend (transactional emails)
- **Gmail:** googleapis (OAuth2, server-side cron)
- **Deploy:** Vercel (with cron jobs)
- **Icons:** Lucide React
- **Fonts:** Inter (sans), JetBrains Mono (mono) — loaded via Google Fonts in globals.css

## Architecture Principles

- Three independent modules + command center: Today (`/`), Hire-OS (`/hiring`), Sales-OS (`/sales`), Finance-OS (`/finance`)
- Each module has its own layout, components directory, and data layer
- Shared services: Auth, Claude AI, Gmail scanner, Resend email
- Gmail scanner is shared between Hiring and Sales — subject line routing splits traffic
- Mock data in `/lib/mock-data.ts` — realistic, not lorem ipsum
- localStorage used for client-side persistence (mind queue items only — all module data is in Supabase)
- Mobile-responsive but desktop-first
- Dark theme, editorial/magazine aesthetic

### Module Maturity Labels

Every module and sub-feature carries a maturity label:

| Label | Meaning |
|-------|---------|
| `production-ready` | Real API calls, real data, tested |
| `semi-real` | Mix of real and mock, core flow works |
| `demo` | Mock data, interactive UI, looks real |
| `not-built` | Spec exists, implementation pending |

**Current maturity:**

| Module | Overall | Details |
|--------|---------|---------|
| Today / Dashboard | `demo` | Morning brief is `production-ready` (real Claude API). Mind queue `semi-real` (localStorage). Decisions, signals: `demo`. |
| Hire-OS | `production-ready` | Gmail scan, Claude eval, pipeline UI, Resend emails — all working. |
| Sales-OS | `production-ready` | Gmail scan, Claude eval, lead table, drawer, detail page, AI analysis cards, activity timeline, email send — all working. |
| Finance-OS | `production-ready` | Invoice CRUD, expenses, tax provisions, runway — all Supabase-backed. Tax calendar `demo`. |
| Intelligence | `production-ready` | Data aggregator → 7 rules → persist → Claude narrative → dashboard feed. Daily cron. |
| Onboarding | `not-built` | Critical for adoption. Spec in progress. |
| Settings | `not-built` | Business context, API keys, module toggles. |

### Human-in-the-Loop Policy

AI can: recommend, summarize, draft, score, prioritize, flag risks.

AI cannot (without explicit founder confirmation):
- Auto-reject candidates
- Auto-send any email (interview invite, sales reply, investor outreach)
- Change pipeline status (move lead to "won", mark candidate as "reviewed")
- Mark deals as closed
- Disqualify leads

**Rule:** Every AI action that affects external communication or pipeline state requires a human click. All AI actions are logged with `created_by: "ai"` in activity tables.

## Navigation Structure

### Global Nav (Left Sidebar)

```
Today        /           → Morning brief, decisions, attention queue
Hire-OS      /hiring     → Candidate pipeline
Sales-OS     /sales      → Lead pipeline
Finance-OS   /finance    → Invoices, KDV, runway
Settings     /settings   → Context, API keys, modules
```

### Module Sub-Navigation

**Hire-OS:**
- Overview (stats + table)
- Candidate detail (modal)

**Sales-OS:**
- Overview (stats + lead table)
- Lead detail (modal)

**Finance-OS:**
- Dashboard (stats + invoices + KDV)
- Fatura Oluştur (invoice creation)
- Vergi Takvimi (tax calendar)

## Design Direction

- **Aesthetic:** Dark, editorial, magazine-like. Linear meets Raycast. NOT generic SaaS.
- **Color Palette (Deep Forest):**
  - Background: `#012622` (--color-bg)
  - Surface: `#003b36` / `#004d47` (hover) / `#005c54` (elevated)
  - Accent Orange: `#e98a15` (primary CTA)
  - Accent Green: `#6ee7b7`, Red: `#fca5a5`, Blue: `#93c5fd`, Amber: `#fcd34d`
  - Text: `#ece5f0` (primary, lilac-tinted), `#b0a8b8` (secondary), `#6b6278` (muted)
- **Typography:** Inter for body/headings, JetBrains Mono for numbers/code
- **Card rule:** Every card must contain three things: (1) status, (2) why it matters, (3) what to do now. Cards missing any of these are incomplete.
- **Badge Colors (High Contrast):** Use explicit hex values:
  - Amber: `text-[#F59E0B] bg-[#451A03]`
  - Green: `text-[#10B981] bg-[#022C22]`
  - Blue: `text-[#60A5FA] bg-[#1E3A5F]`
  - Red: `text-[#F87171] bg-[#450A0A]`
- **Motion:** Subtle fade-in on load, modal scale-in/out, soft-pulse for alerts
- **Layout:** CSS Grid, dense but readable. Max 5 blocks on main dashboard.

## Module Specifications

### Today / Command Center (`/`)

The main dashboard answers one question: **"Bugün founder olarak neye dikkat etmeliyim?"**

**5 blocks, no more:**

1. **Morning Brief** — AI-generated. Top of page. One summary sentence + 3 actionable items pulled from ALL modules (hiring candidates waiting, hot leads, tax deadlines). Has "Generate Brief" button (real Claude API call). Maturity: `production-ready`.

2. **Needs Attention** — Items across all modules that need founder action NOW. Sorted by urgency. Includes stale/dropping items (lead going cold, candidate waiting too long). Maturity: `demo` (mock data).

3. **Decide Now** — 2-3 binary decisions with execute buttons. "Candidate X: interview or reject?" "Lead Y: send demo invite?" One click to act. Maturity: `demo`.

4. **Pipeline Snapshot** — Three small cards showing each module's health:
   - Hiring: X pending / Y interview-ready
   - Sales: X leads / Y hot / Z closing
   - Finance: runway months / next tax deadline
   Maturity: `demo`.

5. **Market Signals** — External signals (Product Hunt, Reddit, trends). Lightweight. Maturity: `demo`.

**Removed from main dashboard:** Founder Stories, Teacher Insights, Student Insights, Calendar View. These don't serve decision support.

### Hire-OS (`/hiring`)

AI-powered hiring pipeline. Maturity: `production-ready`.

**Flow:** Gmail scan → PDF to Supabase Storage → Claude evaluation → Score + signals → Founder decision → Email action

#### Database (Supabase)
- `candidates` — name, email, role, pdf_url, status (pending → analyzed → reviewed), duplicate tracking
- `evaluations` — strong_signals, risk_flags, critical_question, recommendation (GÖRÜŞ/GEÇME/BEKLET), raw_score
- `roles` — rubric + task content per role, seeded from `rubrics/` and `tasks/` directories
- Storage bucket: `resumes` (private), path: `{role}/{candidate_id}.pdf`

#### Cron Jobs
- `/api/cron/scan-gmail` — daily 02:00 UTC: scans Gmail for emails with `[role-name]` in subject, uploads PDFs, creates candidate rows
- `/api/cron/evaluate` — daily 03:00 UTC: pulls pending candidates (LIMIT 10), runs Claude eval, writes results

#### Claude Evaluation (`lib/claude-eval.ts`)
- Uses `type: "document"` content block (native PDF support)
- System prompt includes role rubric + task from `roles` table
- Returns: `{strong_signals, risk_flags, critical_question, recommendation, raw_score}`

#### Gmail Integration (`lib/gmail.ts`)
- OAuth2 via googleapis
- Role extracted from subject line: `[role-name]` or `role: name` pattern
- Emails WITHOUT role pattern are routed to Sales-OS (see below)
- Duplicate detection: unique constraint on (email, role)

#### Email (Resend)
- Interview invitation + duplicate notification emails
- Triggered via `/api/hiring/candidates/[id]/interview` POST

#### UI Pattern
- Candidate table: sortable/filterable, color-coded AI recommendation chips
- Centered modal (not side drawer): `w-[80vw] max-h-[85vh]`, escape-to-close
- Human decision: inline two-step confirm (click → "Confirm? / Cancel")
- Labels: Turkish values in DB, English labels in UI via `RECOMMENDATION_LABELS`

#### Components (`components/hiring/`)
stats-bar, candidate-table, candidate-drawer, candidate-detail, evaluation-card, human-decision, duplicate-badge, interview-action, hiring-page-client, login-form

### Sales-OS (`/sales`)

AI-powered lead pipeline. Maturity: `production-ready`.

**Flow:** Gmail scan (non-hiring emails) → Claude qualify → Score + draft reply → Founder decision → Email action

Same architectural pattern as Hire-OS. Shares Gmail scanner and Resend infra.

#### Database (Supabase)

```sql
-- leads table
leads (
  id uuid PK,
  name text,
  company text nullable,
  email text UNIQUE,
  phone text nullable,
  source text,              -- 'gmail_scan' | 'manual' | 'referral' | 'website'
  source_email_subject text nullable,
  source_email_snippet text nullable,
  source_email_date timestamptz nullable,
  status text,              -- pipeline stage (see below)
  ai_score int nullable,    -- 0-100
  ai_summary text nullable,
  ai_signals jsonb nullable, -- {positive: [], negative: [], questions: []}
  ai_suggested_action text nullable, -- 'send_demo' | 'follow_up' | 'nurture' | 'disqualify'
  ai_draft_response text nullable,
  assigned_to uuid nullable,
  deal_value numeric nullable,
  currency text default 'TRY',
  notes text nullable,
  last_contact_at timestamptz nullable,
  next_follow_up_at timestamptz nullable,
  lost_reason text nullable,
  previous_lead_id uuid nullable,
  created_at timestamptz,
  updated_at timestamptz
)

-- lead activities table
lead_activities (
  id uuid PK,
  lead_id uuid FK,
  type text,    -- 'email_received' | 'email_sent' | 'note' | 'status_change' | 'call' | 'meeting'
  content text,
  metadata jsonb nullable,
  created_at timestamptz,
  created_by text  -- 'system' | 'ai' | 'user'
)

-- email templates
sales_templates (
  id uuid PK,
  name text,
  subject_template text,
  body_template text,  -- {{name}}, {{company}} placeholders
  stage text,
  created_at timestamptz,
  updated_at timestamptz
)
```

#### Pipeline Stages
```
new          → Gmail'den geldi, henüz değerlendirilmedi
qualified    → Claude scored, founder onayladı
contacted    → İlk mail gönderildi
demo         → Demo planlandı/yapıldı
proposal     → Teklif gönderildi
negotiation  → Pazarlık aşaması
won          → Kapandı ✓
lost         → Kaybedildi ✗
nurture      → Şu an değil, ileride olabilir
```

#### Cron Jobs
- `/api/cron/scan-sales-gmail` — daily 02:30 UTC: processes non-hiring emails from Gmail, creates lead rows
- `/api/cron/evaluate-leads` — daily 03:30 UTC: pulls `status='new'` leads (LIMIT 10), runs Claude qualification

#### Claude Qualification (`lib/claude-sales-eval.ts`)
- System prompt includes business context from Settings
- Input: email subject + snippet + sender info
- Returns: `{ai_score, ai_summary, ai_signals, ai_suggested_action, ai_draft_response}`

#### Gmail Routing Logic
The shared Gmail scanner (`lib/gmail.ts`) routes emails:
- Subject contains `[role-name]` or `role: X` → Hiring pipeline
- Everything else → Sales pipeline as potential lead
- Founder can dismiss false positives from Sales dashboard

#### Pages
```
/sales              → Overview: stats bar + lead table + "needs action" section
/sales/leads        → Full lead list with filters
/sales/lead/[id]    → Lead detail: AI analysis + activity timeline + action bar
```

#### Components (`components/sales/`)
stats-bar, lead-table, lead-drawer, ai-analysis-card, activity-timeline, lead-actions, template-selector, sales-page-client

#### Sub-feature Maturity
| Feature | Maturity |
|---------|----------|
| Gmail scan (shared) | `production-ready` |
| Claude qualification | `production-ready` |
| Pipeline UI | `production-ready` |
| Email send (Resend) | `production-ready` (shared) |
| Kanban view | `not-built` (Faz 2) |
| Deal value tracking | `not-built` (manual input) |
| Reporting/analytics | `not-built` (Faz 3) |

### Finance-OS (`/finance`)

Turkish freelancer/solopreneur finance dashboard. Maturity: `production-ready`.

**Data:** Supabase-backed. No real GİB/entegratör API calls.

#### Data Layer
- Supabase tables: `invoices`, `expenses`, `tax_provisions`, `runway_data`
- API routes: GET/POST `/api/finance/invoices`, GET `/api/finance/expenses`, GET `/api/finance/tax-provisions`
- Dashboard reads from Supabase via API routes

#### Types (`lib/finance-types.ts`)
- `Invoice` — id, client_name, client_vkn, description, gross_amount, kdv_rate, kdv_amount, stopaj_rate/amount, net_amount, invoice_type (e-arsiv/e-smm), status
- `TaxDeadline`, `TaxProvision`, `Expense`, `KDVSummary`, `RunwayData`, `FinanceStats`

#### KDV Calculation
```
kdv = gross_amount × kdv_rate
stopaj = gross_amount × stopaj_rate  (mandatory for e-SMM, optional for e-Arşiv)
müşteri_öder = gross + kdv - stopaj
senin_alacağın = gross - stopaj
```

#### Pages
- `/finance` — Dashboard: stats, invoice list, KDV summary, dual currency, tax provisions
- `/finance/invoices/new` — Invoice creation form with PDF generation (browser print API)
- `/finance/tax-calendar` — Tax deadlines with dynamic KDV from localStorage

#### Components (`components/finance/`)
invoice-form, invoice-list, stats-bar, kdv-summary, tax-calendar, deadline-card, dual-currency-card, tax-provision-card

### Intelligence Layer

Cross-module AI intelligence. Maturity: `production-ready`.

**Pipeline:** Data aggregator → 7 deterministic rules → Persist insights → Claude narrative → Dashboard feed

- `lib/intelligence/data-aggregator.ts` — queries all 3 modules into CrossModuleSnapshot
- `lib/intelligence/rules/` — 7 rules: runway, pipeline health, hiring tension, invoice staleness, lead staleness, cross-module patterns
- `lib/intelligence-pipeline.ts` — orchestrates full pipeline
- `lib/claude-narrative.ts` — 2-sentence morning brief via Claude Haiku
- `lib/persist-insights.ts` — writes to cross_module_insights table (content-addressed dedup)
- Cron: `/api/cron/run-intelligence` — daily 04:00 UTC
- API: `/api/intelligence/insights` (GET), `/api/intelligence/dismiss` (POST), `/api/intelligence/trigger` (POST)

#### Components (`components/intelligence/`)
- `insight-card.tsx` — severity badge, freshness timestamp, evidence, dismiss
- `intelligence-feed.tsx` — stateful container with fetch, refresh/skeleton, empty state, AgentCardWrapper

## Auth

- Supabase Auth (email/password) — login at `/login`
- `middleware.ts` protects `/hiring/*`, `/sales/*`, `/finance/*`. Main dashboard at `/` requires no auth.
- Three Supabase clients:
  - `lib/supabase/client.ts` — browser client (anon key, cookie auth)
  - `lib/supabase/server.ts` — server component client (respects RLS)
  - `lib/supabase/admin.ts` — service role client (bypasses RLS, cron jobs ONLY)

#### Supabase Tables (11)
| Table | Module | Migration |
|-------|--------|-----------|
| `candidates` | Hire-OS | 001 |
| `evaluations` | Hire-OS | 001 |
| `roles` | Hire-OS | 001 |
| `invoices` | Finance-OS | 002 |
| `expenses` | Finance-OS | 002 |
| `tax_provisions` | Finance-OS | 002 |
| `leads` | Sales-OS | 003 |
| `lead_activities` | Sales-OS | 003 |
| `sales_templates` | Sales-OS | 003 |
| `cross_module_insights` | Intelligence | 20260315 |
| `runway_data` | Finance-OS | 005 |

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# AI
ANTHROPIC_API_KEY

# Gmail
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
GMAIL_REFRESH_TOKEN

# Email
RESEND_API_KEY
FROM_EMAIL

# Cron & Config
CRON_SECRET
EVAL_BATCH_SIZE
GOOGLE_MEET_LINK
```

## File Structure

```
soloPreneurOS/
├── app/
│   ├── layout.tsx                       # Root layout + global sidebar
│   ├── page.tsx                         # Today / Command Center
│   ├── globals.css                      # Design system
│   ├── login/page.tsx                   # Auth
│   ├── hiring/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── candidate/[id]/page.tsx
│   ├── sales/
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # Overview + stats + lead table
│   │   └── lead/[id]/page.tsx           # Lead detail
│   ├── finance/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── invoices/new/page.tsx
│   │   └── tax-calendar/page.tsx
│   ├── settings/
│   │   └── page.tsx                     # Business context + API keys + modules
│   └── api/
│       ├── brief/route.ts               # Morning brief (Claude API)
│       ├── auth/callback/route.ts
│       ├── cron/
│       │   ├── scan-gmail/route.ts      # Hiring emails (02:00)
│       │   ├── scan-sales-gmail/route.ts # Sales emails (02:30)
│       │   ├── evaluate/route.ts        # Hiring eval (03:00)
│       │   ├── evaluate-leads/route.ts  # Sales eval (03:30)
│       │   └── run-intelligence/route.ts # Intelligence pipeline (04:00)
│       ├── hiring/candidates/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── interview/route.ts
│       ├── intelligence/
│       │   ├── insights/route.ts        # GET insights
│       │   ├── dismiss/route.ts         # POST dismiss insight
│       │   ├── trigger/route.ts         # POST trigger pipeline
│       │   └── nudges/route.ts          # GET nudges
│       └── sales/leads/
│           ├── route.ts                 # GET leads list
│           └── [id]/
│               ├── route.ts             # GET/PATCH single lead
│               └── reply/route.ts       # POST send reply email
├── components/
│   ├── hiring/                          # All hiring UI components
│   ├── sales/                           # All sales UI components
│   ├── finance/                         # All finance UI components
│   ├── intelligence/                    # Intelligence feed components
│   ├── sidebar.tsx                      # Global navigation sidebar
│   └── ... (dashboard components)
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── claude-eval.ts                   # Hiring evaluation
│   ├── claude-sales-eval.ts             # Sales qualification
│   ├── claude-narrative.ts              # Intelligence narrative (Claude Haiku)
│   ├── intelligence-pipeline.ts         # Full intelligence pipeline orchestrator
│   ├── intelligence-types.ts            # InsightCandidate, CrossModuleInsight
│   ├── persist-insights.ts              # Content-addressed insight persistence
│   ├── intelligence/
│   │   ├── types.ts                     # CrossModuleSnapshot, RuleInsight
│   │   ├── data-aggregator.ts           # Unified data layer
│   │   ├── rule-engine.ts               # (deprecated stub)
│   │   └── rules/                       # 7 rule functions + barrel index
│   ├── gmail.ts                         # Shared Gmail scanner + routing
│   ├── email.ts                         # Resend (hiring + sales templates)
│   ├── hiring-types.ts
│   ├── sales-types.ts
│   ├── finance-types.ts
│   ├── constants.ts                     # Status enums, labels, colors, pipeline stages
│   ├── mock-data.ts
│   └── utils.ts
├── middleware.ts                         # Auth guard (/hiring/*, /sales/*, /finance/*)
├── vercel.json                          # Cron schedules
├── decisions.md                         # Product decisions log
├── .env.local.example
└── CLAUDE.md
```

## Mock Data Guidelines

- Product name: "LearnLoop" (fictional EdTech, but architecture is sector-agnostic)
- Market context: UK expansion, MENA exploration
- Realistic numbers: 1,247 active students, 89 teachers, $4.2k MRR
- Sales mock: realistic B2B leads (school admins, district coordinators, ed-tech resellers)
- Finance: Turkish freelancer invoices (50K TL, e-SMM/e-Arşiv, %20 KDV, stopaj)
- Calendar: realistic founder schedule
- All mock data must feel real enough to demo — no lorem ipsum, no placeholder names

## Code Style

- Functional components only, no classes
- Named exports for components
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- API routes in `/app/api/`
- No unnecessary abstractions — this is an MVP, keep it flat
- No external packages for things browser APIs can handle
- Never use `alert()` — use toast patterns or console

## AI Behavior Rules

- Always check existing files before creating new ones
- Never delete or overwrite mock-data.ts without asking (append only)
- Run `npm run build` after major changes
- When styling, always use CSS variables from globals.css
- Prefer Tailwind classes over inline styles
- Keep components under 150 lines — split if longer
- Don't install packages without mentioning it first
- If a component needs data, import from lib/mock-data.ts
- Commit after each working module with descriptive message
- When in doubt about design, re-read Design Direction above

## What NOT to Do

- Don't touch other modules when working on one (hiring stays in hiring files, sales in sales, etc.)
- Don't use `createAdminClient()` outside of cron jobs
- Don't commit `rubrics/`, `tasks/`, or `supabase/` directories to git
- Don't hardcode Supabase URLs or keys
- Don't cross-contaminate modules
- No over-engineering — ship fast, look good
- No generic dashboard templates — this should feel custom
- Don't add features that don't map to the Product Scope criteria
- Don't build Kanban views, advanced analytics, or multi-user features in Faz 1

## Local-Only Files (Not in Git)

- `rubrics/` — role-specific evaluation rubric .md files
- `tasks/` — role-specific task description .md files
- `supabase/` — migration SQL + seed SQL
- `decisions.md` — product decisions log (may be added to git later)