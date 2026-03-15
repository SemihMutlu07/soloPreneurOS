# Testing Patterns

**Analysis Date:** 2026-03-15

## Test Framework

**Status:** No test framework currently configured

**Installation Note:**
- No Jest, Vitest, Playwright, or Cypress dependencies in `package.json`
- No test configuration files (`jest.config.js`, `vitest.config.ts`, etc.) present
- No test files (`.test.ts`, `.spec.ts`) found in the codebase
- No test scripts in `package.json` (`test`, `test:watch`, `test:coverage`)

**Recommendation for Implementation:**
To add testing, install one of these setups:

1. **Jest + Testing Library** (recommended for React/Next.js):
   ```bash
   npm install --save-dev jest @testing-library/react @testing-library/jest-dom ts-jest @types/jest
   ```
   Add `jest.config.js`:
   ```javascript
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'jsdom',
     roots: ['<rootDir>/'],
     testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
     moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
   };
   ```

2. **Vitest** (faster, modern):
   ```bash
   npm install --save-dev vitest @vitest/ui jsdom
   ```

## Test File Organization

**Proposed Location Pattern:**
- Co-located with source: `components/sidebar.test.tsx` next to `components/sidebar.tsx`
- Or centralized: `__tests__/components/sidebar.test.tsx`
- API tests: `__tests__/api/brief.test.ts` or `app/api/brief/route.test.ts`

**Naming Convention:**
- `*.test.ts` or `*.test.tsx` for unit and component tests
- `*.spec.ts` for integration tests (not currently used)
- Test files in same directory as source or in `__tests__` subdirectory

**Example Directory Structure (proposed):**
```
src/
├── components/
│   ├── sidebar.tsx
│   ├── sidebar.test.tsx
│   ├── sales/
│   │   ├── lead-table.tsx
│   │   └── lead-table.test.tsx
├── lib/
│   ├── utils.ts
│   ├── utils.test.ts
│   ├── claude-eval.ts
│   └── claude-eval.test.ts
└── app/
    └── api/
        ├── brief/
        │   ├── route.ts
        │   └── route.test.ts
```

## Test Structure

**Suite Organization (Proposed Pattern):**
```typescript
// Based on common Next.js testing patterns with Jest
describe('Sidebar Component', () => {
  describe('Navigation Items', () => {
    it('should render all nav items', () => {
      // Arrange
      const expectedItems = ['Today', 'Hire-OS', 'Sales-OS', 'Finance-OS'];

      // Act
      render(<Sidebar />);

      // Assert
      expectedItems.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });

    it('should mark current route as active', () => {
      // Test routing behavior
    });

    it('should hide on login page', () => {
      // usePathname() returns '/login'
      // Expect null render
    });
  });
});
```

**Patterns to Implement:**

### Setup Pattern:
```typescript
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';

// Wrapper for providers (if using context)
const Wrapper = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
  localStorage.clear();
});
```

### Teardown Pattern:
```typescript
afterEach(() => {
  jest.restoreAllMocks();
  cleanup(); // from @testing-library/react
});

afterAll(() => {
  // Global cleanup if needed
});
```

### Assertion Pattern:
```typescript
// Component rendering
expect(component).toBeInTheDocument();
expect(component).toHaveTextContent('Expected text');

// Visibility/interaction
expect(input).toHaveFocus();
expect(button).toBeDisabled();
expect(element).toHaveClass('active');

// Async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Mocking

**Framework:** Jest (once installed)

**Patterns to Implement:**

### Mock Fetch (for API calls):
```typescript
// Used extensively in components like `daily-ops.tsx` which calls `/api/agents/daily-ops`
global.fetch = jest.fn();

afterEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

it('should handle API success', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ analysis: 'Test analysis' })
  });

  // Test component behavior
});

it('should handle API error', async () => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

  // Test error handling
});
```

### Mock localStorage (used in components like `daily-ops.tsx`):
```typescript
// Mock localStorage for state persistence tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock as any;

beforeEach(() => {
  jest.clearAllMocks();
});

it('should load tasks from localStorage', () => {
  const mockTasks = [{ id: '1', text: 'Task 1', priority: 'critical', completed: false }];
  (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockTasks));

  // Test component initialization
});
```

### Mock Next.js Hooks:
```typescript
// For components using usePathname, useSearchParams, etc.
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/hiring'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    pathname: '/hiring',
  })),
}));
```

### Mock Supabase Client:
```typescript
// For API routes using createClient() from lib/supabase/server.ts
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  })),
}));
```

### Mock External APIs (Anthropic, Gmail, etc.):
```typescript
// For lib/claude-eval.ts and lib/claude-sales-eval.ts
jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"recommendation": "GÖRÜŞ"}' }],
      }),
    },
  })),
}));
```

**What to Mock:**
- External API calls (Anthropic, Gmail, Supabase)
- Browser APIs (`localStorage`, `fetch`)
- Next.js routing hooks (`useRouter`, `usePathname`)
- Third-party library instances (Resend email client, Supabase client)
- Date/time in tests (use `jest.useFakeTimers()`)

**What NOT to Mock:**
- Component internals (useState, useEffect, hooks)
- Utility functions (`cn()`, `formatRelativeTime()`)
- Constants and type definitions
- CSS and styling utilities
- Router components (use Next.js test utilities instead)

## Fixtures and Factories

**Test Data Pattern (Proposed):**

Create `__tests__/fixtures/` directory for reusable test data:

```typescript
// __tests__/fixtures/sales-leads.ts
import type { SalesLead } from '@/lib/sales-types';

export const mockSalesLead: SalesLead = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  company: 'Acme Corp',
  role: 'Product Manager',
  stage: 'qualified',
  deal_value: 50000,
  ai_score: 85,
  ai_signals: {
    positive: ['Engaged with pricing page', 'Requested demo'],
    negative: [],
    questions: ['Budget approval timeline?'],
  },
  created_at: '2026-03-01T10:00:00Z',
  last_contact_at: '2026-03-14T15:30:00Z',
};

export const createMockLead = (overrides: Partial<SalesLead> = {}): SalesLead => ({
  ...mockSalesLead,
  ...overrides,
});

// __tests__/fixtures/candidates.ts
import type { Candidate, Evaluation } from '@/lib/hiring-types';

export const mockCandidate: Candidate = {
  id: '1',
  name: 'Jane Smith',
  email: 'jane@example.com',
  role: 'Senior Developer',
  applied_at: '2026-03-10T08:00:00Z',
  pdf_url: 'https://example.com/jane-smith-resume.pdf',
  status: 'analyzed',
  previous_application_id: null,
  gmail_message_id: null,
  created_at: '2026-03-10T08:00:00Z',
};

export const mockEvaluation: Evaluation = {
  id: '1',
  candidate_id: '1',
  strong_signals: ['10+ years experience', 'Built distributed systems'],
  risk_flags: ['Limited frontend experience'],
  critical_question: 'Can you lead architecture decisions for async systems?',
  recommendation: 'GÖRÜŞ',
  raw_score: { 'System Design': 9, 'Communication': 8, 'Experience': 9 },
  created_at: '2026-03-10T09:00:00Z',
};
```

**Usage in Tests:**
```typescript
import { createMockLead } from '__tests__/fixtures/sales-leads';

it('should display high-scoring leads', () => {
  const hotLead = createMockLead({ ai_score: 85 });
  const coldLead = createMockLead({ ai_score: 25 });

  render(<LeadTable leads={[hotLead, coldLead]} />);

  expect(screen.getByText('John Doe')).toHaveClass('text-accent-green');
});
```

## Coverage

**Requirements:** None currently enforced

**Coverage Report (not yet configured):**
To add coverage tracking once tests are implemented:

```bash
# Run tests with coverage
npm test -- --coverage

# Generate HTML report
npm test -- --coverage --coverageReporters=html
```

**Coverage thresholds to enforce (suggested):**
```javascript
// jest.config.js
module.exports = {
  // ... other config
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

## Test Types

**Unit Tests:**
- Scope: Individual functions and components in isolation
- Approach: Mock all dependencies (API calls, localStorage)
- Examples to test:
  - `lib/utils.ts`: `cn()` function merges Tailwind classes correctly
  - `lib/claude-eval.ts`: `evaluateCandidate()` parses JSON response
  - `components/sidebar.tsx`: Renders nav items, active state logic
  - Format functions: `formatRelativeTime()`, `formatTRY()`

**Integration Tests:**
- Scope: Multiple components/services working together
- Approach: Test with minimal mocking, use real data structures
- Examples:
  - LeadTable with sorting and filtering
  - Daily Ops component with localStorage persistence
  - API route handlers with Supabase client
  - Email sending flow with Resend client

**E2E Tests:**
- Framework: Not currently used
- Recommendation: Add Playwright or Cypress for:
  - User authentication flow
  - Complete lead management workflow
  - Sales pipeline interactions
  - Can be added later as separate suite

## Common Patterns

**Async Testing:**
```typescript
// Using async/await with waitFor
it('should load analysis results', async () => {
  render(<DailyOps />);

  const button = screen.getByRole('button', { name: /analyze/i });
  await userEvent.click(button);

  await waitFor(() => {
    expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
  });
});

// Using jest.runAllTimers for setTimeout
it('should debounce input changes', async () => {
  jest.useFakeTimers();

  render(<SearchInput onSearch={mockHandler} />);
  const input = screen.getByRole('textbox');

  await userEvent.type(input, 'test');

  expect(mockHandler).not.toHaveBeenCalled();

  jest.runAllTimers();

  expect(mockHandler).toHaveBeenCalled();

  jest.useRealTimers();
});
```

**Error Testing:**
```typescript
// Testing error states in components
it('should display error message on API failure', async () => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(
    new Error('Failed to connect to Anthropic API')
  );

  render(<DailyOps />);
  const button = screen.getByRole('button', { name: /analyze/i });

  await userEvent.click(button);

  await waitFor(() => {
    expect(screen.getByText(/failed to connect/i)).toBeInTheDocument();
  });
});

// Testing error handling in utility functions
it('should throw error for invalid JSON response', () => {
  const invalidJson = 'not json';

  expect(() => {
    const match = invalidJson.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Failed to parse evaluation response as JSON');
  }).toThrow('Failed to parse evaluation response as JSON');
});

// Testing API route error responses
it('should return 500 error when API key is missing', async () => {
  delete process.env.ANTHROPIC_API_KEY;

  const response = await POST(mockRequest);

  expect(response.status).toBe(500);
  const data = await response.json();
  expect(data.error).toContain('ANTHROPIC_API_KEY not set');
});
```

**User Interaction Testing:**
```typescript
import userEvent from '@testing-library/user-event';

it('should toggle task completion on checkbox click', async () => {
  const user = userEvent.setup();

  render(<DailyOps />);

  const checkbox = screen.getByRole('checkbox', { name: /task name/i });

  await user.click(checkbox);

  expect(checkbox).toBeChecked();
});

it('should update sort order on column header click', async () => {
  const user = userEvent.setup();

  render(<LeadTable leads={mockLeads} />);

  const nameHeader = screen.getByRole('button', { name: /name/i });

  await user.click(nameHeader);

  // Verify sort ascending
  const rows = screen.getAllByRole('row');
  expect(rows[1]).toHaveTextContent('Alice');
  expect(rows[2]).toHaveTextContent('Bob');
});
```

## Notes on Current Testing Gaps

**Areas Without Tests (High Priority):**
- All API routes (`app/api/**/*.ts`) — evaluate candidates, scan Gmail, process leads
- Core business logic (`lib/claude-eval.ts`, `lib/claude-sales-eval.ts`) — AI evaluation
- Client components with complex state (`DailyOps.tsx`, `LeadTable.tsx`, `CandidateTable.tsx`)
- Email sending functions (`lib/email.ts`)
- Data persistence (`lib/profile-store.ts`)

**Critical Paths to Test First:**
1. Candidate/lead evaluation functions (AI integration)
2. API routes (critical user flows)
3. Data fetching and error handling
4. Component interactivity (sorting, filtering, forms)

**Recommended Test Strategy:**
- Start with utility functions and API routes (fastest feedback)
- Add component tests for complex UI logic
- Add integration tests for multi-step workflows
- E2E tests for critical user paths (optional but valuable)

---

*Testing analysis: 2026-03-15*
