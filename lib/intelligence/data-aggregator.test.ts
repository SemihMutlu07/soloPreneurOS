import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CrossModuleSnapshot } from "./types";

// ---------------------------------------------------------------------------
// Mock the Supabase admin client
// ---------------------------------------------------------------------------

// Base fluent builder — individual tests override .limit() resolved value or
// inject errors by replacing the mock before importing buildCrossModuleSnapshot.
const mockBuilder = {
  select: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
};

// Default: .from(anything) returns the fluent builder with data: [], error: null
const mockFrom = vi.fn().mockReturnValue(mockBuilder);

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

// Import AFTER mocking so the module picks up the mock
const { buildCrossModuleSnapshot } = await import("./data-aggregator");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset all mock call counts and restore default resolved values. */
function resetMocks() {
  mockFrom.mockClear();
  mockBuilder.select.mockClear().mockReturnThis();
  mockBuilder.in.mockClear().mockReturnThis();
  mockBuilder.eq.mockClear().mockReturnThis();
  mockBuilder.gte.mockClear().mockReturnThis();
  mockBuilder.order.mockClear().mockReturnThis();
  // Default terminal value: empty array, no error (covers both .limit() and .gte())
  mockBuilder.limit.mockClear().mockResolvedValue({ data: [], error: null });
  mockBuilder.gte.mockReturnThis(); // keep chainable; actual resolution via .limit or direct await

  // For queries that don't end with .limit() but are awaited directly (gte chains),
  // make the builder thenable so `await supabase.from(...).select(...).gte(...)` resolves.
  (mockBuilder.gte as ReturnType<typeof vi.fn>).mockImplementation(() => {
    const thenableBuilder = {
      ...mockBuilder,
      then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
    };
    return thenableBuilder;
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildCrossModuleSnapshot", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("returns an object with sales, hire, finance, errors, and generated_at keys", async () => {
    const snapshot: CrossModuleSnapshot = await buildCrossModuleSnapshot();

    expect(snapshot).toHaveProperty("sales");
    expect(snapshot).toHaveProperty("hire");
    expect(snapshot).toHaveProperty("finance");
    expect(snapshot).toHaveProperty("errors");
    expect(snapshot).toHaveProperty("generated_at");
    expect(snapshot.errors).toEqual([]);
  });

  it("sets finance: null and pushes to errors[] when finance query throws", async () => {
    // Intercept the invoices query — make it return an error object
    const originalFrom = mockFrom.getMockImplementation();
    mockFrom.mockImplementation((table: string) => {
      if (table === "invoices") {
        return {
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({
            data: null,
            error: new Error("DB timeout"),
          }),
        };
      }
      return mockBuilder;
    });

    const snapshot = await buildCrossModuleSnapshot();

    expect(snapshot.finance).toBeNull();
    expect(snapshot.errors.some((e: string) => e.startsWith("finance:"))).toBe(true);

    // Restore
    if (originalFrom) {
      mockFrom.mockImplementation(originalFrom);
    } else {
      mockFrom.mockReturnValue(mockBuilder);
    }
  });

  it("sets sales: null and pushes to errors[] when sales query throws", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "leads") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: null,
            error: new Error("connection refused"),
          }),
        };
      }
      return mockBuilder;
    });

    const snapshot = await buildCrossModuleSnapshot();

    expect(snapshot.sales).toBeNull();
    expect(snapshot.errors.some((e: string) => e.startsWith("sales:"))).toBe(true);

    mockFrom.mockReturnValue(mockBuilder);
  });

  it("returns empty arrays (not null) when a module returns zero records", async () => {
    // Default mock already returns { data: [], error: null } — zero records
    const snapshot = await buildCrossModuleSnapshot();

    expect(snapshot.sales).not.toBeNull();
    expect(snapshot.sales?.leads).toEqual([]);
    expect(snapshot.sales?.recent_activity).toEqual([]);
    expect(snapshot.hire).not.toBeNull();
    expect(snapshot.hire?.candidates).toEqual([]);
    expect(snapshot.finance).not.toBeNull();
    expect(snapshot.finance?.invoices).toEqual([]);
    expect(snapshot.errors.length).toBe(0);
  });

  it("returns a valid snapshot when all three modules succeed", async () => {
    const mockLead = { id: "lead-1", status: "qualified", name: "Acme Corp" };
    const mockCandidate = { id: "cand-1", status: "pending", name: "Jane Doe" };

    mockFrom.mockImplementation((table: string) => {
      switch (table) {
        case "leads":
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [mockLead], error: null }),
          };
        case "lead_activities":
          return {
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        case "candidates":
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [mockCandidate], error: null }),
          };
        case "evaluations":
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        case "roles":
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        case "invoices":
          return {
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        case "expenses":
          return {
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        case "runway_data":
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        default:
          return mockBuilder;
      }
    });

    const snapshot = await buildCrossModuleSnapshot();

    expect(snapshot.sales?.leads.length).toBe(1);
    expect(snapshot.hire?.candidates.length).toBe(1);
    expect(snapshot.hire?.candidates[0]).toMatchObject({
      ...mockCandidate,
      evaluation: null,
    });
    expect(snapshot.errors).toEqual([]);

    mockFrom.mockReturnValue(mockBuilder);
  });

  it("generated_at is an ISO string", async () => {
    const snapshot = await buildCrossModuleSnapshot();

    expect(typeof snapshot.generated_at).toBe("string");
    expect(new Date(snapshot.generated_at).toISOString()).toBe(snapshot.generated_at);
  });
});
