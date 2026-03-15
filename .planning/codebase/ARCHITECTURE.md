# Architecture

**Analysis Date:** 2026-03-15

## Pattern Overview

**Overall:** Multi-module dashboard with modular business operating systems (OS modules)

**Key Characteristics:**
- Modular feature isolation: Each OS (Hire-OS, Sales-OS, Finance-OS) operates independently with dedicated pages, components, and data types
- Client/server separation: Next.js App Router with server components handling data fetching, client components managing state
- API-first design: RESTful backend routes enable cron jobs, agent evaluations, and external integrations
- AI-driven evaluations: Claude API integration for hiring candidate assessment and lead qualification
- Browser state persistence: localStorage for user profiles, agent results, and finance data
- Database-agnostic: Supabase (PostgreSQL) with abstraction layer enabling offline-first fallbacks

## Layers

**Presentation Layer:**
- Purpose: UI components and page layouts for each OS module
- Location: `components/` and `app/` (page.tsx, layout.tsx for each module)
- Contains: React components, agent cards, dashboards, forms, data visualizations
- Depends on: `lib/` utilities, mock-data, types, state management
- Used by: User browser, Next.js routing system

**Backend API Layer:**
- Purpose: Route handlers for data operations, evaluations, external integrations, and cron jobs
- Location: `app/api/` with subdirectories for each domain (hiring/, sales/, agents/, auth/, signals/)
- Contains: Next.js route handlers (GET, POST), request/response handling, orchestration logic
- Depends on: Supabase clients, Claude SDK, Gmail API, external service SDKs
- Used by: Frontend client code (fetch calls), external cron systems (Vercel, external schedulers)

**Data Layer:**
- Purpose: Database abstraction and data persistence
- Location: `lib/supabase/` (client.ts, server.ts, admin.ts)
- Contains: Supabase client instances (browser, server, admin modes)
- Depends on: Environment variables, Supabase SDK
- Used by: All API routes and server components

**Business Logic Layer:**
- Purpose: AI evaluation logic, data transformation, decision-making
- Location: `lib/` (claude-eval.ts, claude-sales-eval.ts, email.ts, gmail.ts)
- Contains: Claude API prompts, evaluation functions, email parsing, external API orchestration
- Depends on: Anthropic SDK, Gmail SDK, data types
- Used by: API routes, component event handlers

**State Management Layer:**
- Purpose: Client-side data persistence and agent result caching
- Location: `lib/` (profile-store.ts, agent-store.ts)
- Contains: localStorage-based persistence for user profiles and agent outputs
- Depends on: Browser APIs
- Used by: Components, pages

**Type Definition Layer:**
- Purpose: Shared TypeScript interfaces and constants
- Location: `lib/` (types.ts, hiring-types.ts, sales-types.ts, finance-types.ts, constants.ts)
- Contains: Type definitions, enums, constant values, validation schemas
- Depends on: Nothing
- Used by: All other layers

## Data Flow

**Dashboard Load → Component Render:**

1. User lands on `/` → `app/layout.tsx` loads root layout (Sidebar, globals.css)
2. `app/page.tsx` (client component) checks `localStorage` for onboarding status via `profile-store.ts`
3. If not onboarded, shows `OnboardingFlow` component
4. If onboarded, renders dashboard grid of agents:
   - `ChiefOfStaff` → calls `POST /api/agents/daily-ops` with tasks → Claude prioritizes → caches result in localStorage
   - `DailyOps`, `MarketScout` → make fetch calls to respective API endpoints
   - `LeadPipeline` → pulls from `mock-data.ts` (local fallback) or database
5. Components render with animation classes, real-time updates via polling/fetch

**Lead/Candidate Evaluation Pipeline:**

1. **Inbound Event:** Email arrives (Gmail), webhook triggers, or manual entry
2. **Extraction:** `lib/gmail.ts` parses email → extracts subject, snippet, sender
3. **Storage:** Data saved to Supabase `leads` or `candidates` table with `status: "new"`
4. **Cron Job:** External scheduler calls `GET /api/cron/evaluate-leads?token=CRON_SECRET`
5. **Evaluation:**
   - Fetch batch of new leads (limit: EVAL_BATCH_SIZE)
   - For each lead, call `evaluateLead()` from `lib/claude-sales-eval.ts`
   - Claude scores 0-100, categorizes signals, suggests action
6. **Update:** Write ai_score, ai_summary, ai_signals to Supabase
7. **Status Transition:** If score ≥ 40, status changes from "new" → "qualified"
8. **UI Feedback:** `components/sales/lead-table.tsx` fetches from `GET /api/sales/leads` → displays pipeline

**Lead Response Draft Flow:**

1. User clicks "Use Draft" in `lead-drawer.tsx` or `ai-analysis-card.tsx`
2. Component state stores ai_draft_response from lead record
3. User edits draft in text area
4. On send: `POST /api/sales/leads/[id]/reply` with email body
5. Response marked in activity log (LeadActivity table)

**Finance Invoice Processing:**

1. User creates invoice in `components/finance/invoice-form.tsx`
2. Form validates KDV calculation: `net_amount = gross_amount * (1 - kdv_rate/100)`
3. Saves to localStorage (`STORAGE_KEY: "finance_invoices"`)
4. Component reads from localStorage on mount, merges with mock-data
5. Recalculates totals: KDV payable, runway, tax provisions
6. Displays in `InvoiceList`, `KDVSummaryCard`, `TaxProvisionCard`

**State Management:**

- **User Profile:** Stored in localStorage (`solopreneuros-profile`), checked on app load
- **Agent Results:** Each agent caches output in localStorage (`agent-{agentId}`), with timestamp + status
- **Finance Data:** User invoices merged with mock data, recalculated on component mount
- **Lead/Candidate:** Server-side in Supabase, fetched on page load or on search/filter

## Key Abstractions

**Agent Pattern:**
- Purpose: Reusable AI-powered UI cards that fetch, process, and display insights
- Examples: `components/agents/chief-of-staff.tsx`, `components/agents/daily-ops.tsx`, `components/agents/market-scout.tsx`
- Pattern:
  - useState + useEffect to check localStorage for cached result
  - If stale or missing, POST to `/api/agents/[name]` with context (tasks, metrics, etc.)
  - Parse JSON response, cache in localStorage, render in card UI
  - Fallback to mock data if API fails or key not set

**OS Module Pattern:**
- Purpose: Self-contained business operating system with pages, components, types, and API routes
- Examples: Sales-OS, Hire-OS, Finance-OS
- Pattern:
  - Page route: `app/[module]/page.tsx` (layout structure)
  - Client wrapper: `components/[module]/[module]-page-client.tsx` (state, fetch, render)
  - Sub-routes: `app/[module]/[sub]/[id]/page.tsx` for detail views
  - Components: Modular UI in `components/[module]/`
  - Types: `lib/[module]-types.ts`
  - API: `app/api/[module]/...`

**Evaluation Pattern:**
- Purpose: Async batch processing of candidates/leads with AI scoring
- Examples: Hiring evaluation (claude-eval.ts), Sales evaluation (claude-sales-eval.ts)
- Pattern:
  - Input interface: name, email, context, role/business
  - System prompt with scoring criteria and JSON schema
  - Claude call with validation
  - Output: score (0-100), summary, signals (positive/negative), suggested action
  - Database update with batch processing for scale

**Supabase Client Pattern:**
- Purpose: Different client modes for browser, server, and admin operations
- Examples: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`
- Pattern:
  - client.ts: Browser client for `createClient()` calls in client components
  - server.ts: Async server client for RSC and API routes
  - admin.ts: Admin client for cron jobs with elevated privileges
  - Each returns configured Supabase instance with environment variables

## Entry Points

**Web Application:**
- Location: `app/layout.tsx` (root layout), `app/page.tsx` (home page)
- Triggers: User navigates to `/`, browser loads app
- Responsibilities: Initialize root UI, load sidebar, inject global styles, render children

**API Routes:**
- Location: `app/api/*/route.ts`
- Triggers: Fetch requests from frontend, cron systems, external webhooks
- Responsibilities: Handle HTTP methods, validate auth headers, orchestrate backend logic

**Cron Jobs:**
- Location: `app/api/cron/*/route.ts`
- Triggers: External scheduler (Vercel, external cron service)
- Responsibilities: Batch evaluate leads/candidates, scan emails, sync data at scheduled intervals

**Authentication:**
- Location: `app/login/page.tsx`, `app/api/auth/callback/route.ts`
- Triggers: User navigates to /login or clicks "logout"
- Responsibilities: OAuth flow with Supabase, session management

## Error Handling

**Strategy:** Graceful degradation with mock data fallbacks

**Patterns:**

- **API Errors:** Try/catch in route handlers, return NextResponse.json({ error: message }, { status: 500 })
- **Claude API:** Check for ANTHROPIC_API_KEY, fallback to mock analysis if missing
- **Supabase Errors:** Log error.message, return user-friendly error UI component
- **Evaluation Failures:** Catch per-record, collect in errors array, continue batch processing
- **Storage Errors:** Try/catch around localStorage access, return null/empty array on failure
- **Email Parsing:** Validate snippet/subject exist, handle null values with defaults

## Cross-Cutting Concerns

**Logging:**
- No structured logging framework; uses console logs in components and route handlers
- Error logging in try/catch blocks sends to client or response

**Validation:**
- TypeScript types provide compile-time validation
- Runtime validation in route handlers checks query params (?.get()), body JSON parsing
- Claude API responses validated by parsing JSON and checking required fields

**Authentication:**
- Supabase Auth handles user sessions
- Cron endpoints check `Authorization: Bearer ${CRON_SECRET}` header
- No user authentication on Sales/Hiring pages (assumed single-user or internal)

**Rate Limiting:**
- EVAL_BATCH_SIZE (default 10) limits leads evaluated per cron run
- No explicit rate limiting on API routes; relies on Supabase quotas

