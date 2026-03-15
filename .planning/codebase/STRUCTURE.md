# Codebase Structure

**Analysis Date:** 2026-03-15

## Directory Layout

```
soloPreneurOS/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Backend API endpoints
│   │   ├── agents/        # Agent evaluation endpoints
│   │   ├── ask/           # Dashboard Q&A endpoint
│   │   ├── auth/          # Authentication callbacks
│   │   ├── brief/         # Brief generation
│   │   ├── cron/          # Scheduled batch jobs (evaluate, scan emails)
│   │   ├── hiring/        # Hiring pipeline endpoints
│   │   ├── sales/         # Sales pipeline endpoints
│   │   └── signals/       # External market signals (HN, Product Hunt, Reddit)
│   ├── finance/           # Finance-OS module pages
│   ├── hiring/            # Hire-OS module pages
│   ├── sales/             # Sales-OS module pages
│   ├── login/             # Authentication page
│   ├── layout.tsx         # Root layout (Sidebar + global styles)
│   ├── page.tsx           # Home dashboard
│   └── globals.css        # Global Tailwind styles
│
├── components/            # React components (organized by module)
│   ├── agents/            # AI agent cards (Chief of Staff, Daily Ops, etc.)
│   ├── finance/           # Finance-OS UI components
│   ├── hiring/            # Hire-OS UI components
│   ├── sales/             # Sales-OS UI components
│   ├── onboarding/        # Initial setup flow
│   ├── sidebar.tsx        # Main navigation sidebar
│   ├── dashboard-header.tsx # Top bar with user menu
│   ├── ask-dashboard.tsx  # Q&A floating panel
│   ├── lead-pipeline.tsx  # Dashboard lead overview card
│   ├── founder-stories.tsx # Inspiration/stories card
│   └── calendar-view.tsx  # Calendar widget
│
├── lib/                   # Shared utilities, types, and business logic
│   ├── supabase/         # Supabase client instances
│   │   ├── client.ts     # Browser client
│   │   ├── server.ts     # Server/RSC client
│   │   └── admin.ts      # Admin client for cron
│   │
│   ├── types.ts           # Core TypeScript interfaces (UserProfile, AgentConfig)
│   ├── hiring-types.ts    # Hiring-OS types (Candidate, Evaluation, Role, etc.)
│   ├── sales-types.ts     # Sales-OS types (Lead, LeadActivity, LeadAISignals, etc.)
│   ├── finance-types.ts   # Finance-OS types (Invoice, KDVSummary, TaxProvision, etc.)
│   │
│   ├── profile-store.ts   # localStorage persistence for user profile
│   ├── agent-store.ts     # localStorage caching for agent results
│   ├── constants.ts       # Global enums and constants (LEAD_STATUSES, RECOMMENDATION, etc.)
│   ├── mock-data.ts       # Fallback data for dashboard and testing
│   ├── utils.ts           # Utility functions (cn for className merging)
│   │
│   ├── claude-eval.ts     # Hiring candidate evaluation (Claude prompt + scoring)
│   ├── claude-sales-eval.ts # Sales lead evaluation (Claude prompt + scoring)
│   ├── gmail.ts           # Gmail API integration (parse emails, extract leads)
│   ├── email.ts           # Email utilities (compose, send templates)
│   ├── agent-config.ts    # Agent configuration (names, descriptions, icons)
│   └── agent-store.ts     # Agent result persistence
│
├── supabase/             # Supabase migration files and schema
│   └── migrations/       # Database schema migrations
│
├── rubrics/              # Role-specific evaluation rubrics (YAML or JSON)
│
├── tasks/                # Task/prompt definitions for agents
│
├── .planning/            # GSD planning artifacts
│   └── codebase/        # Analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
│
├── .claude/              # Claude artifacts and instructions
│
├── public/               # Static assets (if any)
│
├── node_modules/         # Dependencies (gitignored)
├── .next/                # Next.js build output (gitignored)
├── .env.local            # Environment variables (gitignored)
│
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── vercel.json          # Vercel deployment configuration
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router pages and API routes
- Contains: Page components (page.tsx), layout components, API route handlers
- Key files: `page.tsx` (home), `layout.tsx` (root), `api/*/route.ts` (endpoints)

**app/api/:**
- Purpose: Backend API endpoints for data operations, evaluations, integrations, and cron jobs
- Contains: Route handlers for fetching, creating, updating data; orchestrating Claude evaluations; syncing with external services
- Key files: `/cron/evaluate-leads`, `/sales/leads`, `/hiring/candidates`, `/agents/daily-ops`

**components/:**
- Purpose: Reusable React UI components organized by business domain (module)
- Contains: Cards, forms, tables, drawers, modals, agent wrappers
- Key files: `agents/chief-of-staff.tsx`, `sales/lead-table.tsx`, `hiring/candidate-drawer.tsx`, `finance/invoice-form.tsx`

**lib/:**
- Purpose: Shared utilities, types, business logic, API clients, state management
- Contains: TypeScript types, constants, utility functions, Supabase clients, Claude evaluation logic, mock data
- Key files: `types.ts`, `*-types.ts`, `profile-store.ts`, `claude-*-eval.ts`, `mock-data.ts`

**lib/supabase/:**
- Purpose: Supabase client instances with different access modes
- Contains: Browser client, server client, admin client for privileged operations
- Key files: `client.ts`, `server.ts`, `admin.ts`

**supabase/migrations/:**
- Purpose: Database schema versioning and change tracking
- Contains: SQL migration files for tables, indexes, RLS policies
- Key files: Timestamped .sql files per schema change

**rubrics/:**
- Purpose: Domain-specific evaluation criteria for hiring and sales
- Contains: YAML or JSON files defining scoring rubrics, evaluation questions, decision trees
- Key files: Hiring role rubrics, Sales qualification rubrics

**tasks/:**
- Purpose: Prompt definitions and task specifications for AI agents
- Contains: Agent instructions, context templates, system messages
- Key files: Agent task definitions

**.planning/codebase/:**
- Purpose: GSD analysis documents for code navigation and implementation guidance
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md
- Key files: Analysis documents generated by /gsd:map-codebase

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout with Sidebar and global styles
- `app/page.tsx`: Home dashboard with agent cards and OS module shortcuts
- `app/login/page.tsx`: Login/authentication page
- `app/[module]/page.tsx`: Module home pages (Sales, Hiring, Finance)

**Configuration:**
- `tsconfig.json`: TypeScript compiler options and path aliases (@/* → ./*)
- `next.config.js`: Next.js build and runtime settings
- `tailwind.config.js`: Tailwind CSS theme, colors, spacing
- `postcss.config.js`: PostCSS plugins for Tailwind
- `package.json`: Dependencies, scripts, project metadata
- `vercel.json`: Deployment config (cron schedules, headers, redirects)

**Core Logic:**
- `lib/claude-eval.ts`: Hiring candidate scoring and evaluation
- `lib/claude-sales-eval.ts`: Sales lead scoring and qualification
- `lib/gmail.ts`: Gmail API integration for email parsing and lead extraction
- `app/api/cron/evaluate-leads/route.ts`: Batch evaluation job
- `app/api/cron/scan-sales-gmail/route.ts`: Email scanning job

**Testing:**
- No dedicated test directory; tests would go alongside source files or in `__tests__/` (not present)

**Data Models:**
- `lib/hiring-types.ts`: Candidate, Evaluation, Role, CandidateWithEvaluation
- `lib/sales-types.ts`: Lead, LeadActivity, LeadAISignals, SalesTemplate, SalesEvalResult
- `lib/finance-types.ts`: Invoice, TaxProvision, Expense, KDVSummary, RunwayData

## Naming Conventions

**Files:**

- **React Components:** `PascalCase.tsx` or `.jsx`
  - Example: `ChiefOfStaff.tsx`, `LeadTable.tsx`, `InvoiceForm.tsx`
  - Page routes: `page.tsx`, `layout.tsx` (Next.js convention)
  - API routes: `route.ts` (Next.js convention)

- **Utility/Library Files:** `kebab-case.ts` or `camelCase.ts`
  - Example: `profile-store.ts`, `claude-sales-eval.ts`, `mock-data.ts`
  - Constants: `constants.ts`
  - Types: `*-types.ts` (e.g., `sales-types.ts`)

- **Directories:**
  - Module directories: `kebab-case` (e.g., `sales/`, `hiring/`, `finance/`)
  - Feature directories: `kebab-case` (e.g., `onboarding/`, `agents/`)

**Functions:**

- **React Components:** `PascalCase`
  - Example: `ChiefOfStaff`, `LeadTable`, `InvoiceForm`

- **Regular Functions:** `camelCase`
  - Example: `evaluateLead()`, `getProfile()`, `createClient()`
  - Async functions: same convention
  - Hook functions: `useX` (React convention)
    - Example: `useState()`, `useEffect()`, `useCallback()`

**Variables:**

- **Constants:** `UPPER_SNAKE_CASE`
  - Example: `EVAL_BATCH_SIZE`, `LEAD_STATUSES`, `STORAGE_KEY`
  - Constants exported from `constants.ts`

- **Regular Variables:** `camelCase`
  - Example: `leadId`, `userProfile`, `evalResult`
  - React state: `const [isOpen, setIsOpen] = useState(false)`

**Types & Interfaces:**

- **Interfaces:** `PascalCase`
  - Example: `UserProfile`, `Lead`, `Evaluation`, `AgentConfig`
  - Suffix patterns: `-Input` for function params, `-Result` for returns, `-Config` for configuration

- **Type Aliases:** `PascalCase`
  - Example: `PipelineStage`, `Priority`, `InvoiceStatus`

- **Enums:** `UPPER_SNAKE_CASE` (when stored in constants) or type literals
  - Example: `const RECOMMENDATION = { GORUS: "GÖRÜŞ", ... }`
  - Or: `type PipelineStage = "new" | "qualified" | ...`

## Where to Add New Code

**New Feature in Existing Module (e.g., Sales):**

1. **Component:** Add to `components/sales/` with PascalCase name
   - Example: `components/sales/custom-filters.tsx`

2. **API Endpoint:** Add route handler in `app/api/sales/`
   - Example: `app/api/sales/custom-search/route.ts`

3. **Type Definition:** Update or extend `lib/sales-types.ts`

4. **Data Fetch:** Import from `lib/sales-types.ts`, use Supabase client from `lib/supabase/server.ts`

5. **Example Structure:**
   ```typescript
   // components/sales/custom-filters.tsx
   "use client";
   import { Lead } from "@/lib/sales-types";

   export default function CustomFilters({ onFilter }: { onFilter: (leads: Lead[]) => void }) {
     // Component logic
   }
   ```

**New Module (e.g., Marketing-OS):**

1. **Create Structure:**
   ```
   app/marketing/
   ├── page.tsx         (server component, fetches data)
   ├── layout.tsx       (if needed)
   └── [detail]/
       └── [id]/
           └── page.tsx

   components/marketing/
   ├── marketing-page-client.tsx  (state & client logic)
   ├── campaign-table.tsx
   ├── campaign-form.tsx
   └── stats-bar.tsx

   lib/
   └── marketing-types.ts
   ```

2. **Add Route to Sidebar:**
   - Update `components/sidebar.tsx` NAV_ITEMS array with new module

3. **Create API Routes:**
   ```
   app/api/marketing/
   ├── campaigns/
   │   ├── route.ts      (GET/POST)
   │   └── [id]/
   │       └── route.ts  (GET/PUT)
   └── stats/
       └── route.ts
   ```

4. **Add Types:**
   ```typescript
   // lib/marketing-types.ts
   export interface Campaign {
     id: string;
     name: string;
     // ...
   }
   ```

**New Utility/Helper:**

- Add to `lib/`
- If module-specific, prefix with module name: `lib/sales-utils.ts`
- If cross-cutting, use generic name: `lib/email.ts`, `lib/gmail.ts`

**New Agent:**

1. Create component in `components/agents/`: `components/agents/new-agent.tsx`
2. Export from card wrapper pattern
3. Add to dashboard grid in `app/page.tsx`
4. Create API endpoint if needed: `app/api/agents/new-agent/route.ts`
5. Store agent config in `lib/agent-config.ts`

**New Cron Job:**

1. Create route: `app/api/cron/new-job/route.ts`
2. Check `Authorization: Bearer ${CRON_SECRET}` header
3. Use admin client from `lib/supabase/admin.ts` for privileged access
4. Return JSON: `{ processed: N, errors: [...], message?: "..." }`
5. Add to `vercel.json` crons array if using Vercel

## Special Directories

**node_modules/:**
- Purpose: npm dependencies
- Generated: Yes (from package.json + package-lock.json)
- Committed: No (gitignored)

**.next/:**
- Purpose: Next.js build output and type definitions
- Generated: Yes (by `npm run build`)
- Committed: No (gitignored)

**supabase/migrations/:**
- Purpose: Database schema versioning
- Generated: No (manually created)
- Committed: Yes (version control for schema)

**.env.local:**
- Purpose: Local environment variables and secrets
- Generated: No (manually created)
- Committed: No (gitignored, sensitive data)

**.planning/codebase/:**
- Purpose: GSD analysis documents
- Generated: Yes (by /gsd:map-codebase command)
- Committed: Yes (stable reference documents)

