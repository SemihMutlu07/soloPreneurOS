# decisions.md — Product Decisions Log

> This document tracks every significant product, architecture, and scope decision made during soloPreneurOS development. It serves two purposes:
> 1. **Internal:** Prevents re-litigating settled decisions and gives context to future contributors
> 2. **Portfolio:** Demonstrates engineering judgment — knowing what to build, what to defer, and why

Last updated: 2026-03-15

---

## Format

Each decision follows this structure:
- **Decision:** What we decided
- **Context:** Why this came up
- **Alternatives considered:** What else was on the table
- **Rationale:** Why we chose this
- **Status:** `accepted` | `deferred` | `revisit-at` | `reversed`

---

## Architecture Decisions

### AD-001: Modular architecture over single dashboard
**Decision:** Separate the product into independent modules (Today, Hire-OS, Sales-OS, Finance-OS) with their own routes, layouts, and component directories — rather than a single-page dashboard.

**Context:** Early prototype had everything on one page: morning brief, hiring pipeline, lead cards, finance stats, founder quotes, student insights. It looked impressive in screenshots but was unusable — too much information, no clear action path.

**Alternatives considered:**
- Single page with collapsible sections
- Tab-based layout (one page, tabbed content)
- Fully separate apps (micro-frontend)

**Rationale:** Modular routes give each domain room to breathe. A founder dealing with hiring doesn't need sales cards distracting them. The shared sidebar provides navigation without cognitive overload. This also makes the codebase maintainable — hiring changes can't accidentally break finance.

**Status:** `accepted`

---

### AD-002: Shared Gmail scanner with subject-line routing
**Decision:** One Gmail OAuth connection feeds both Hire-OS and Sales-OS. Emails with `[role-name]` in the subject go to hiring; everything else goes to sales as potential leads.

**Context:** Both modules need email ingestion. Running two separate Gmail integrations would mean double OAuth setup, double token management, and confusing UX ("which Gmail connection is this?").

**Alternatives considered:**
- Two separate Gmail OAuth connections (one per module)
- Label-based routing (Gmail labels instead of subject parsing)
- Manual forwarding to different inboxes

**Rationale:** Single connection = single setup for the user. Subject-line routing is simple, deterministic, and easy to explain. False positives in sales can be dismissed with one click. Label-based routing requires the user to set up Gmail filters, which adds friction. We can always add label support later as an enhancement.

**Trade-off:** Some non-lead emails will land in the sales pipeline (newsletters, receipts, etc.). The founder dismisses these manually. Claude's qualification step will also filter most of these out with low scores.

**Status:** `accepted`

---

### AD-003: localStorage for Finance, Supabase for Hiring/Sales
**Decision:** Finance-OS stores invoices and mind queue items in localStorage. Hiring and Sales use Supabase.

**Context:** Finance module was built as a self-contained tool — no server-side processing needed. Invoices are created manually, KDV is calculated client-side, PDF is generated via browser print API.

**Alternatives considered:**
- Supabase for everything (including finance)
- IndexedDB for more robust client storage
- File-based storage (JSON export/import)

**Rationale:** localStorage is simple, works offline, and requires zero setup. For a solo founder's invoice tracking, it's sufficient. Hiring and Sales need server-side storage because cron jobs write to them (Gmail scan, Claude eval). Moving finance to Supabase is a future option if we add features like multi-device sync or automated tax calculations.

**Risk:** localStorage has a ~5MB limit and no backup. If the founder clears browser data, invoices are lost. Acceptable for MVP; mitigate later with optional Supabase sync or JSON export button.

**Status:** `accepted` — revisit when multi-device sync becomes a priority

---

### AD-004: Dark theme only (no light mode toggle)
**Decision:** Ship with dark theme only. No light/dark toggle.

**Context:** The editorial/magazine aesthetic is designed around the deep forest color palette (#012622 background). Supporting light mode would require designing, testing, and maintaining a second complete color system.

**Alternatives considered:**
- Full light/dark toggle with system preference detection
- Light mode only (more accessible)
- Dark default with basic light mode

**Rationale:** Dark theme is a deliberate design choice that defines the product's character. Building a quality light mode doubles the CSS surface area for marginal benefit. Solo founders using this at 2am will thank us. Accessibility is addressed through high-contrast badge colors and sufficient text contrast ratios.

**Status:** `accepted` — revisit only if user feedback strongly requests it

---

### AD-005: No real-time features (polling/websockets)
**Decision:** All data updates happen via page refresh or manual "refresh" buttons. No real-time subscriptions.

**Context:** Supabase supports real-time subscriptions. Could show new candidates appearing live, lead scores updating in real-time.

**Alternatives considered:**
- Supabase real-time subscriptions
- Server-sent events (SSE) for cron job completion notifications
- Short polling (every 30s)

**Rationale:** Cron jobs run once daily (02:00-03:30 UTC). The founder checks the dashboard in the morning. Real-time adds complexity (connection management, state sync, error handling) for a use case where data changes once every 24 hours. A "Last updated: 03:30 today" timestamp is sufficient.

**Status:** `accepted`

---

## Scope Decisions

### SD-001: Dashboard reduced from 9 blocks to 5
**Decision:** Main dashboard shows only: Morning Brief, Needs Attention, Decide Now, Pipeline Snapshot, Market Signals.

**Removed:** Founder Stories, Teacher Insights, Student Insights, Calendar View.

**Context:** Three independent reviews (internal + external) all identified the same problem: the dashboard was a "feature depot" trying to show everything at once. Founder Stories was decorative. Teacher/Student Insights were domain-specific (EdTech only, not generic). Calendar View without real Google Calendar integration was misleading.

**Rationale:** The dashboard's job is decision support, not information display. Every block must either surface a decision or provide context for one. "Cool to look at" is not a valid reason to exist on the main screen.

**Status:** `accepted`

---

### SD-002: Kanban view deferred to Faz 2
**Decision:** Sales pipeline launches with table/list view only. No Kanban drag-and-drop.

**Context:** Kanban is the expected UX for pipeline management (Trello, Pipedrive, etc.). But implementing drag-and-drop with proper state management, optimistic updates, and mobile support is significant effort.

**Alternatives considered:**
- Launch with Kanban only (skip table)
- Launch with both (toggle between views)
- Third-party Kanban library (react-beautiful-dnd, @hello-pangea/dnd)

**Rationale:** Table view with sorting and filtering covers the core use case: "show me my leads, let me act on them." Kanban adds visual pipeline awareness but doesn't enable any action that the table can't. Building it well takes 2-3 days; building it poorly (janky drag, broken on mobile) hurts more than not having it. Ship table first, add Kanban when the pipeline has enough items to make the visual layout valuable.

**Status:** `deferred` — Faz 2, after Sales-OS core is stable

---

### SD-003: Generic hiring tasks instead of role-specific challenges
**Decision:** MVP uses generic evaluation tasks across all roles. Role-specific technical challenges are deferred.

**Context:** The hiring pipeline evaluates candidates against a rubric + task. Ideally, each role (engineer, designer, PM, marketer, ops) would have a unique, well-designed challenge that tests role-relevant skills. Designing 5 good challenges requires significant thought — what to test, how to evaluate, what's fair.

**Alternatives considered:**
- Design all 5 role-specific tasks before launch
- Use AI to generate role-specific tasks dynamically
- Skip tasks entirely, evaluate on CV only

**Rationale:** A generic task ("write a brief analysis of X") is better than no task and much better than a poorly designed role-specific one. Bad challenges (too easy, too hard, irrelevant, biased) actively harm hiring quality. This needs dedicated time with domain expertise for each role.

**What "good" looks like for later:**
- Engineer: debug a real code snippet or design a small system
- Designer: redesign a specific screen with constraints
- PM: write a PRD for a given problem
- Marketer: draft a go-to-market plan for a specific scenario
- Ops: create a process for a described operational challenge

**Status:** `deferred` — requires dedicated design sprint per role

---

### SD-004: No onboarding wizard in Faz 1
**Decision:** Onboarding is deferred. Users land directly on the dashboard with mock data visible.

**Context:** Every external review flagged onboarding as critical. A setup wizard (business context, API keys, module selection) would dramatically improve first-use experience. But building it well requires: multi-step form, validation, conditional flows, secure key storage, and "first run" detection.

**Alternatives considered:**
- Full onboarding wizard before any other feature
- Inline setup prompts (banners on each page saying "connect Gmail to activate")
- README-based setup (document the steps, user follows manually)

**Rationale:** Onboarding is important but doesn't add new capability — it makes existing capability accessible. Right now the priority is building the capability (Sales-OS). The current state (mock data + manual env var setup) works for demos and portfolio review. Onboarding becomes critical when real users try to self-serve.

**Mitigation:** Good README, clear .env.local.example, mock data that demonstrates value without setup.

**Status:** `deferred` — Faz 2, before any public user testing

---

### SD-005: No Funding module in Faz 1
**Decision:** Fund-OS (investor pipeline, outreach, meeting notes) is fully deferred.

**Context:** The original vision had three operational modules: Hiring, Sales, Funding. But Funding has the least defined data model and the most relationship-heavy workflow. Investor outreach is highly personal and varies dramatically by stage, geography, and sector.

**Alternatives considered:**
- Build a basic investor CRM (name, stage, last contact, notes)
- Build funding as a "special case" of the sales pipeline
- Skip entirely

**Rationale:** Building a mediocre funding module hurts the product's credibility more than not having one. The Sales pipeline architecture (leads, activities, templates, AI scoring) could potentially be adapted for investor outreach with minimal changes. Better to ship Sales well, learn from it, then design Funding with that experience.

**Status:** `deferred` — Faz 3, after Sales-OS is stable and tested

---

### SD-006: Turkish-first UI with English technical terms
**Decision:** UI text is in Turkish. Technical terms (pipeline, lead, candidate, score) stay in English.

**Context:** Target users are Turkish founders who use English-origin business terminology daily. Full Turkish translation of terms like "pipeline" to "boru hattı" would feel unnatural.

**Alternatives considered:**
- Full English UI
- Full Turkish UI (including translated technical terms)
- i18n setup with language toggle

**Rationale:** Turkish body text + English jargon matches how Turkish startup founders actually communicate. No i18n infrastructure needed now — all strings should be in a constants file (not hardcoded in JSX) so translation is possible later without refactoring every component.

**Status:** `accepted`

---

### SD-007: No command palette (Cmd+K) in Faz 1
**Decision:** Raycast-style command palette is deferred.

**Context:** A global search/command interface (Cmd+K → "add new lead", "generate brief", "reject candidate X") would be a killer UX feature. But it requires: fuzzy search across all entities, action registry, keyboard navigation, and testing across all modules.

**Rationale:** High effort, high polish requirement. A bad command palette (slow search, missing actions, keyboard bugs) is worse than no command palette. The sidebar navigation handles all current workflows. Revisit when there are enough entities and actions to make quick-access genuinely useful.

**Status:** `deferred` — Faz 3, polish phase

---

### SD-008: No multi-user / team features
**Decision:** The product assumes a single authenticated user (the founder). No team roles, permissions, or shared access.

**Context:** `assigned_to` fields exist in the data model (for future-proofing), but the UI doesn't expose team assignment, and auth is single-user.

**Rationale:** "Solo" is in the product name. Multi-user adds: role-based access control, invitation flow, notification preferences per user, activity attribution, and conflict resolution. Each of these is a product in itself. Ship for one user first.

**Status:** `deferred` — revisit only if product pivots toward team use

---

## Technical Decisions

### TD-001: Vercel cron over external scheduler
**Decision:** Use Vercel's built-in cron (vercel.json) for scheduled jobs instead of external services like Upstash QStash or Railway cron.

**Context:** Gmail scanning and Claude evaluation need to run on a schedule (daily 02:00-03:30 UTC).

**Alternatives considered:**
- Upstash QStash (more reliable, retry logic)
- Supabase Edge Functions with pg_cron
- External cron service (cron-job.org, EasyCron)
- Self-hosted with node-cron

**Rationale:** Vercel cron is zero-config, lives in the same repo, and is free on the Hobby plan. The jobs are idempotent (re-running is safe), run once daily, and don't need retry logic. If reliability becomes an issue, migrate to QStash without changing the API route code — only the trigger mechanism changes.

**Status:** `accepted`

---

### TD-002: Claude native PDF support over text extraction
**Decision:** Use Claude's `type: "document"` content block to send PDFs directly, rather than extracting text first with a library like pdf-parse.

**Context:** Hiring evaluation needs to read CV/resume PDFs.

**Alternatives considered:**
- pdf-parse → extract text → send to Claude as text
- pdf.js → render to images → send to Claude as images
- Textract / Google Document AI for extraction

**Rationale:** Claude's native PDF support preserves formatting, tables, and layout context that text extraction loses. A well-formatted CV conveys information through its structure, not just its text. Direct PDF also means fewer dependencies and no extraction bugs.

**Trade-off:** Higher token usage per evaluation (PDF is larger than extracted text). Acceptable given the batch size (LIMIT 10 per cron run) and daily frequency.

**Status:** `accepted`

---

### TD-003: No external component library
**Decision:** All UI components are custom-built with Tailwind. No shadcn/ui, no Radix, no Headless UI.

**Context:** Component libraries accelerate development but add dependency weight and constrain design.

**Alternatives considered:**
- shadcn/ui (copy-paste components, good DX)
- Radix Primitives (unstyled, accessible)
- Headless UI (Tailwind Labs, minimal)

**Rationale:** The product's visual identity ("editorial, magazine-like, not generic SaaS") requires full design control. Component libraries push toward their own aesthetic, and overriding it often takes more time than building from scratch. The component count is manageable (tables, modals, cards, forms) — not building a design system for hundreds of components.

**Trade-off:** Accessibility may suffer (no built-in ARIA patterns from Radix). Mitigate by manually adding focus management and keyboard navigation to modals and forms.

**Status:** `accepted` — revisit if component count exceeds ~30 unique patterns

---

### TD-004: Browser print API for PDF generation
**Decision:** Invoice PDFs are generated via `window.print()` with a formatted HTML template, not a server-side PDF library.

**Context:** Finance-OS needs to generate downloadable invoice PDFs.

**Alternatives considered:**
- puppeteer / playwright (server-side, high fidelity)
- react-pdf (@react-pdf/renderer)
- jsPDF (client-side, programmatic)
- html2canvas + jsPDF

**Rationale:** Browser print gives native PDF quality, handles Turkish characters perfectly, requires zero dependencies, and the user can preview before saving. For invoices (single-page, structured layout), it's ideal. Server-side generation would require a headless browser runtime on Vercel, which adds cost and complexity.

**Trade-off:** User sees a print dialog instead of instant download. The preview is actually a feature — they can check the invoice before committing.

**Status:** `accepted`

---

## Decisions Pending

These need resolution but aren't blocking current work:

### PD-001: API usage tracking / cost dashboard
**Question:** Should we show Claude API usage and costs in the Settings page?

**Context:** Users provide their own Anthropic API key. Knowing how much the system is spending on their behalf builds trust and prevents bill shock.

**Leaning:** Yes, but simple — total calls today, estimated cost, per-module breakdown. No fancy charts. Could pull from Anthropic's usage API or track locally per request.

**Status:** `pending` — implement during Settings page build

---

### PD-002: Demo / test mode
**Question:** Should there be a `/demo` route that shows the full system with mock data, no auth required?

**Context:** For portfolio presentation, it would be powerful to have a live demo that works without any setup. Employers/investors could click through the full UX.

**Leaning:** Yes. Route all data calls through a `isDemo` flag that returns mock data instead of hitting Supabase. Mock the Gmail scan results, mock the Claude evaluations, show realistic pipeline states.

**Status:** `pending` — implement after Sales-OS is built

---

### PD-003: Empty states design
**Question:** What does each module look like with zero data?

**Context:** First-time users (after onboarding eventually exists) will see empty pipelines. "No data" messages waste the opportunity to guide the user.

**Leaning:** Each empty state should include: (1) what this module does in one sentence, (2) how to get started, (3) an AI-generated suggestion or prompt. Example: "No leads yet. Connect your Gmail to start capturing inbound interest, or add your first lead manually."

**Status:** `pending` — design during onboarding sprint

---

### PD-004: Notification system
**Question:** Should the system notify the founder outside the dashboard (email, push, Slack)?

**Context:** Morning brief is generated daily but the founder has to open the dashboard to see it. A morning email with the brief summary would increase daily return rate.

**Leaning:** Start with email (Resend is already integrated). Daily morning email at 07:00 local time with brief summary + "open dashboard" link. Push notifications and Slack are Faz 3.

**Status:** `pending`