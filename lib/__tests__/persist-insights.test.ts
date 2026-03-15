/**
 * Tests for persist-insights.ts
 * - buildInsightId: determinism, length, collision avoidance (pure function, no mocks)
 * - persistInsights: Supabase call is mocked to avoid env dependency
 */
import { describe, test, expect, vi } from "vitest";

// Mock Supabase admin client before importing the module under test
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}));

import { buildInsightId, persistInsights } from "@/lib/persist-insights";
import type { InsightCandidate, PersistResult } from "@/lib/intelligence-types";

describe("buildInsightId", () => {
  test("is deterministic — same inputs produce same output", () => {
    const id1 = buildInsightId("R1", "2026-03-15");
    const id2 = buildInsightId("R1", "2026-03-15");
    expect(id1).toBe(id2);
  });

  test("returns a 64-char hex string (SHA256)", () => {
    const id = buildInsightId("R1", "2026-03-15");
    expect(id).toHaveLength(64);
    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });

  test("different inputs produce different IDs", () => {
    const id1 = buildInsightId("R1", "2026-03-15");
    const id2 = buildInsightId("R2", "2026-03-15");
    expect(id1).not.toBe(id2);
  });
});

describe("persistInsights", () => {
  test("returns zero upserted for empty array", async () => {
    const result = await persistInsights([]);
    expect(result).toEqual({ upserted: 0, errors: [] });
  });

  test("accepts InsightCandidate[] and returns PersistResult", async () => {
    const candidates: InsightCandidate[] = [
      {
        rule_id: "R1",
        severity: "critical",
        module_tags: ["sales", "finance"],
        evidence: "2 hot leads stalled and runway < 60 days.",
      },
    ];
    const result: PersistResult = await persistInsights(candidates);
    expect(result.upserted).toBe(1);
    expect(result.errors).toEqual([]);
  });
});
