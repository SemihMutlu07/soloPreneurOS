# Coding Conventions

**Analysis Date:** 2026-03-15

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension
  - Examples: `Sidebar.tsx`, `LeadTable.tsx`, `DailyOps.tsx`
  - Exceptions: lowercase for utility modules (`utils.ts`, `constants.ts`, `types.ts`)
- API routes: lowercase with kebab-case in path structure
  - Examples: `/app/api/brief/route.ts`, `/app/api/cron/scan-sales-gmail/route.ts`
- Type/interface files: descriptive with `-types` suffix
  - Examples: `sales-types.ts`, `hiring-types.ts`, `finance-types.ts`
- Store/state files: `-store` suffix
  - Examples: `profile-store.ts`, `agent-store.ts`

**Functions:**
- Exported components: PascalCase
  - Examples: `export function Sidebar()`, `export function LeadTable()`
- Regular functions: camelCase
  - Examples: `formatRelativeTime()`, `formatTRY()`, `evaluateCandidate()`
- Helper/utility functions: camelCase with descriptive verb prefixes
  - Examples: `loadTasks()`, `saveTasks()`, `getResend()`, `isActive()`
- Handler functions: `handle*` or `on*` pattern for event handlers
  - Examples: `handleSort()`, `onSelectLead()`, `onComplete()`

**Variables:**
- Constants (non-object): UPPERCASE_SNAKE_CASE
  - Example: `STORAGE_KEY = "daily-ops-tasks"`
- Object constants: PascalCase with `as const`
  - Examples: `NAV_ITEMS`, `LEAD_STATUSES`, `priorityConfig`
- Local variables/state: camelCase
  - Examples: `sortKey`, `filterStage`, `lastRun`
- Boolean variables: `is*`, `has*`, `should*` prefixes
  - Examples: `isActive()`, `hasCompletedOnboarding()`, `showOnboarding`
- React state variables: camelCase (from `useState`)
  - Examples: `const [showOnboarding, setShowOnboarding] = useState()`

**Types:**
- Interfaces: PascalCase with `Interface` suffix or descriptive name
  - Examples: `interface UserProfile`, `interface LeadTableProps`, `interface TaskItem`
- Type aliases: PascalCase
  - Examples: `type SortKey = "name" | "ai_score" | "stage"`, `type PipelineStage`
- Enum-like union types: ALL_CAPS for values
  - Examples: `"GÖRÜŞ" | "GEÇME" | "BEKLET"` (Turkish recommendation types)
- Union discriminator properties: specific strings
  - Examples: `status: "pending" | "analyzed" | "reviewed"`

## Code Style

**Formatting:**
- No explicit linter/formatter configured
- TypeScript strict mode enabled (`"strict": true` in tsconfig.json)
- Module resolution: `bundler` with path aliases
- Target: ES2017

**Import Organization:**
- Order: React/Next imports → third-party libraries → local imports → types
  - Example from `app/page.tsx`:
    ```typescript
    import { useState, useEffect } from "react";
    import DashboardHeader from "@/components/dashboard-header";
    import { hasCompletedOnboarding } from "@/lib/profile-store";
    ```
- Use `import type` for type-only imports to avoid circular dependencies
  - Example: `import type { SalesLead } from "@/lib/sales-types"`
- Prefer named imports over default imports for consistency
- Group related imports together with blank lines between groups

**Linting:**
- ESLint configured via Next.js: `"lint": "next lint"` (in package.json)
- Strict TypeScript compilation enforced
- No explicit `.eslintrc` file (uses Next.js defaults)

## Path Aliases

**Configuration:**
- Base alias: `@/*` maps to root directory
  - `tsconfig.json`: `"paths": { "@/*": ["./*"] }`
- Usage pattern: `@/components/`, `@/lib/`, `@/app/`
- Examples:
  - `import { Sidebar } from "@/components/sidebar"`
  - `import { cn } from "@/lib/utils"`
  - `import { LEAD_STATUSES } from "@/lib/constants"`

## Error Handling

**Patterns:**
- Try-catch blocks in async functions for API calls and JSON parsing
  - Example from `app/api/brief/route.ts`:
    ```typescript
    try {
      const body = await request.json();
      previousDecisions = body.previousDecisions || [];
    } catch {
      // No body or invalid JSON — that's fine
    }
    ```
- Null/undefined checks using optional chaining (`?.`) and nullish coalescing (`??`)
  - Example: `const evaluation: Evaluation | null = c.evaluations?.[0] || null`
- Error propagation via thrown Error objects with descriptive messages
  - Example from `lib/email.ts`:
    ```typescript
    if (error) {
      throw new Error(`Failed to send interview email: ${error.message}`);
    }
    ```
- API routes return `NextResponse.json()` with explicit status codes
  - Success: `NextResponse.json(data)` (defaults to 200)
  - Error: `NextResponse.json({ error: message }, { status: 500 })`
- Silent catch blocks for non-critical operations
  - Example: Fallback to mock data if live API fetch fails

## Logging

**Framework:** Console methods (no dedicated logging library)

**Patterns:**
- No structured logging; direct console usage
- No log levels configured (info/warn/error not differentiated)
- Debugging via browser console for client code
- API errors logged implicitly via thrown errors

## Comments

**When to Comment:**
- Inline comments for complex logic or non-obvious intent
  - Example: `// Don't show sidebar on login page`
  - Example: `// Flatten evaluations (take first if exists)`
- Comments explaining "why", not "what" (code is self-documenting)
- Section markers for logical groupings
  - Example: `// --- Sales OS Constants ---`

**JSDoc/TSDoc:**
- No formal JSDoc documentation used
- Types and interfaces are self-documenting via TypeScript
- Function purposes inferred from names and signatures

## Function Design

**Size:** Functions are generally compact (15-50 lines)
- Longer functions reserved for complex logic (e.g., `brief/route.ts` ~200 lines for system prompt construction and API orchestration)
- Component functions typically 60-150 lines

**Parameters:**
- Typed explicitly with interfaces for complex objects
  - Example: `interface LeadTableProps { leads: SalesLead[]; onSelectLead?: (id: string) => void; }`
- Optional parameters marked with `?`
- Destructuring used in function signatures for clarity
  - Example: `export default function Home({ children }: { children: React.ReactNode; })`

**Return Values:**
- Async functions always return `Promise<Type>`
- Client components return JSX.Element
- API routes return `NextResponse<T>`
- Utility functions return specific types (strings, numbers, booleans, objects)

**Callbacks:**
- `useCallback` hook used to prevent unnecessary re-renders
  - Example: `const runAnalysis = useCallback(async () => { ... }, [])`
- Event handlers passed as props with `on*` naming
  - Example: `onSelectLead?: (id: string) => void`

## Module Design

**Exports:**
- Named exports preferred for components and utilities
  - Examples: `export function Sidebar()`, `export async function evaluateCandidate()`
- Default exports used for page components (Next.js convention)
  - Examples: `export default function Home()`, `export default function DailyOps()`
- Type exports use `export type` to avoid runtime pollution
  - Example: `export type SalesLeadStage = keyof typeof LEAD_STATUSES`

**Barrel Files:**
- Not extensively used; imports are specific
- Each component typically imported directly from its file
- No central `index.ts` re-exports observed

**Component Composition:**
- Client components marked with `"use client"` directive
  - Example: All interactive components in `components/` directory
- Server components used for data fetching (implicit, no directive)
  - Example: Page components in `app/*/page.tsx`
- Context/state management via custom hooks and localStorage
  - Example: `profile-store.ts` uses `localStorage` for persistence

## Turkish Language Use

**Constants and UI:**
- Turkish labels used for domain-specific terminology
  - Examples: `GÖRÜŞ` (Interview), `GEÇME` (Pass), `BEKLET` (Hold)
  - Examples: `Yeni` (New), `Nitelikli` (Qualified), `İletişime Geçildi` (Contacted)
- English used for technical terms and code structure
- Bidirectional naming: Turkish in constants, English in technical code

## Type System

**Interface Patterns:**
- Flat, descriptive interfaces for data structures
  - Example: `interface UserProfile { name, productName, teamSize, customerType }`
- Extended interfaces for relationships
  - Example: `interface CandidateWithEvaluation extends Candidate { evaluation: Evaluation | null }`
- Union types for enums (no `enum` keyword used)
  - Example: `type PipelineStage = (typeof PIPELINE_STAGES)[number]`

---

*Convention analysis: 2026-03-15*
