# soloPreneurOS

## What is this?
An AI-powered daily operating system for EdTech solopreneurs. It's a dashboard that acts as a "thinking partner" — not a task manager, but a decision-support system that works while you sleep and briefs you in the morning.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Database:** None (MVP — mock data + localStorage)
- **Deploy:** Vercel
- **Icons:** Lucide React

## Architecture Principles
- Single-page dashboard layout, no routing needed for MVP
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

## Code Style
- Functional components only, no classes
- Named exports for components
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- API routes in `/app/api/`
- Environment variables: `ANTHROPIC_API_KEY` in `.env.local`
- No unnecessary abstractions — this is an MVP, keep it flat

## File Structure
```
soloPreneurOS/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       └── brief/
│           └── route.ts          # Anthropic API call
├── components/
│   ├── morning-brief.tsx
│   ├── mind-queue.tsx
│   ├── todays-decisions.tsx
│   ├── external-signals.tsx
│   ├── student-insights.tsx
│   ├── teacher-insights.tsx
│   ├── calendar-view.tsx
│   ├── lead-pipeline.tsx
│   ├── founder-stories.tsx
│   └── dashboard-header.tsx
├── lib/
│   ├── mock-data.ts
│   └── utils.ts
├── CLAUDE.md
├── .env.local
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
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
- No auth system
- No database
- No real Google/Gmail OAuth
- No multiple pages/routing
- No over-engineering — ship fast, look good
- No generic dashboard templates — this should feel custom