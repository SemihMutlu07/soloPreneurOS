# Technology Stack

**Analysis Date:** 2026-03-15

## Languages

**Primary:**
- TypeScript 5.9.3 - Type-safe development across codebase
- JavaScript/JSX - React components

**Secondary:**
- SQL - Supabase database queries and migrations
- CSS - Styling via Tailwind

## Runtime

**Environment:**
- Node.js (no specific version pinned, no .nvmrc file)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with API routes, middleware, SSR
- React 19.2.4 - UI library for components
- React DOM 19.2.4 - React rendering library

**Styling:**
- Tailwind CSS 4.2.1 - Utility-first CSS framework
- PostCSS 8.5.8 - CSS processing pipeline
- Autoprefixer 10.4.27 - Vendor prefix auto-addition
- @tailwindcss/postcss 4.2.1 - Tailwind PostCSS plugin
- tailwind-merge 3.5.0 - Merge Tailwind class utilities without conflicts

**Icons:**
- lucide-react 0.577.0 - React icon library

**Utilities:**
- clsx 2.1.1 - Conditional className builder

## Key Dependencies

**AI/ML Integration:**
- @anthropic-ai/sdk 0.78.0 - Claude API integration for candidate and lead evaluation

**Database & Authentication:**
- @supabase/supabase-js 2.99.1 - Supabase client for database and auth
- @supabase/ssr 0.9.0 - Server-side rendering support for Supabase auth

**Email Delivery:**
- resend 6.9.3 - Email service API for sending interview invitations and notifications

**Google Integration:**
- googleapis 171.4.0 - Google APIs client (Gmail, Google Meet)

**Development Tools:**
- @types/node 25.5.0 - Node.js type definitions
- @types/react 19.2.14 - React type definitions

## Configuration

**Environment:**
- Variables configured via `.env.local` (example at `.env.local.example`)
- Critical vars: `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `RESEND_API_KEY`, `FROM_EMAIL`, `CRON_SECRET`, `EVAL_BATCH_SIZE`, `GOOGLE_MEET_LINK`, `PRODUCTHUNT_TOKEN` (optional)

**TypeScript:**
- Config: `tsconfig.json`
- Target: ES2017
- Module resolution: bundler
- Strict mode enabled
- Path alias: `@/*` maps to project root

**Next.js:**
- Config: `next.config.ts` (minimal config)

**PostCSS:**
- Config: `postcss.config.mjs`
- Uses Tailwind CSS PostCSS plugin

## Platform Requirements

**Development:**
- Node.js runtime
- npm package manager

**Production:**
- Vercel deployment (inferred from `vercel.json` cron configuration)
- Edge runtime capable (Next.js 16 support)

**Database:**
- Supabase PostgreSQL (cloud)
- Storage: Supabase object storage for resume PDFs

---

*Stack analysis: 2026-03-15*
