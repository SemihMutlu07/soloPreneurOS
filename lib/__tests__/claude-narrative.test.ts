import { describe, it, expect, vi, beforeEach } from "vitest";
import type { InsightCandidate } from "@/lib/intelligence-types";

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

const mockSnapshot = {
  hotLeadCount: 3,
  runwayDays: 45,
  openRoleCount: 2,
  overdueInvoiceCount: 1,
  daysSinceLastInvoice: 10,
} as any; // CrossModuleSnapshot will have more fields but only scalars are used

const mockFiredInsights: InsightCandidate[] = [
  {
    rule_id: "R1",
    severity: "critical",
    module_tags: ["sales", "finance"],
    evidence: "Runway 45 days and 3 hot leads in pipeline.",
  },
];

describe("claude-narrative", () => {
  let Anthropic: ReturnType<typeof vi.fn>;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const sdk = await import("@anthropic-ai/sdk");
    Anthropic = sdk.default as unknown as ReturnType<typeof vi.fn>;
    mockCreate = vi.fn();
    Anthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }));
  });

  describe("generateNarrative", () => {
    it("Test 1 (LLM-01): returns a non-empty string when Anthropic SDK returns a text response and firedInsights.length > 0", async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "Sentence one. Sentence two." }],
      });

      const { generateNarrative } = await import("@/lib/claude-narrative");
      const result = await generateNarrative(mockSnapshot, mockFiredInsights);

      expect(result).toBe("Sentence one. Sentence two.");
      expect(result.length).toBeGreaterThan(0);
    });

    it("Test 2 (LLM-01): returns empty string (no throw) when Anthropic SDK throws an error", async () => {
      mockCreate.mockRejectedValue(new Error("API error"));

      const { generateNarrative } = await import("@/lib/claude-narrative");
      const result = await generateNarrative(mockSnapshot, mockFiredInsights);

      expect(result).toBe("");
    });

    it("Test 3 (LLM-01): returns empty string when firedInsights is empty — guard condition", async () => {
      const { generateNarrative } = await import("@/lib/claude-narrative");
      const result = await generateNarrative(mockSnapshot, []);

      expect(result).toBe("");
      // mock should not have been called since guard short-circuits
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("buildMetricsText", () => {
    it("Test 4 (LLM-02): output does not contain '[object Object]' or array brackets", async () => {
      const { buildMetricsText } = await import("@/lib/claude-narrative");
      const result = buildMetricsText(mockSnapshot, mockFiredInsights);

      expect(result).not.toContain("[object Object]");
      expect(result).not.toMatch(/^\[.*\]$/m);
    });

    it("Test 5 (LLM-02): output contains runwayDays value from the snapshot", async () => {
      const { buildMetricsText } = await import("@/lib/claude-narrative");
      const result = buildMetricsText(mockSnapshot, mockFiredInsights);

      expect(result).toContain("45");
    });
  });

  describe("narrativeInsightId", () => {
    it("Test 6: returns the same value for the same calendarDate string (determinism)", async () => {
      const { narrativeInsightId } = await import("@/lib/claude-narrative");
      const id1 = narrativeInsightId("2026-03-15");
      const id2 = narrativeInsightId("2026-03-15");

      expect(id1).toStrictEqual(id2);
      expect(id1.length).toBe(64); // SHA256 hex is 64 chars
    });
  });
});
