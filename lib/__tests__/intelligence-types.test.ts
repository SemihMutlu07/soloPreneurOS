/**
 * Type-level tests for intelligence-types.ts
 * Compile-time assertions wrapped in vitest so the runner recognizes them.
 */
import { describe, test, expect } from "vitest";
import type {
  InsightSeverity,
  InsightCandidate,
  CrossModuleInsight,
  PersistResult,
} from "@/lib/intelligence-types";

describe("intelligence-types", () => {
  test("InsightSeverity accepts critical, warning, info", () => {
    const s1: InsightSeverity = "critical";
    const s2: InsightSeverity = "warning";
    const s3: InsightSeverity = "info";
    expect([s1, s2, s3]).toEqual(["critical", "warning", "info"]);
  });

  test("InsightCandidate shape is valid", () => {
    const candidate: InsightCandidate = {
      rule_id: "R1",
      severity: "critical",
      module_tags: ["sales", "finance"],
      evidence: "2 hot leads with no reply in 48h and runway at 45 days.",
    };
    expect(candidate.rule_id).toBe("R1");
    expect(candidate.module_tags).toHaveLength(2);
  });

  test("CrossModuleInsight extends InsightCandidate", () => {
    const insight: CrossModuleInsight = {
      rule_id: "R1",
      severity: "warning",
      module_tags: ["sales"],
      evidence: "Sample evidence.",
      id: "abc123",
      generated_at: "2026-03-15T00:00:00Z",
      dismissed_at: null,
      created_at: "2026-03-15T00:00:00Z",
    };
    // CrossModuleInsight is assignable to InsightCandidate
    const asCandidate: InsightCandidate = insight;
    expect(asCandidate.rule_id).toBe("R1");
  });

  test("CrossModuleInsight dismissed_at can be string or null", () => {
    const active: CrossModuleInsight = {
      rule_id: "R1",
      severity: "info",
      module_tags: ["hiring"],
      evidence: "e",
      id: "a",
      generated_at: "2026-03-15T00:00:00Z",
      dismissed_at: null,
      created_at: "2026-03-15T00:00:00Z",
    };
    const dismissed: CrossModuleInsight = {
      ...active,
      dismissed_at: "2026-03-15T10:00:00Z",
    };
    expect(active.dismissed_at).toBeNull();
    expect(dismissed.dismissed_at).toBe("2026-03-15T10:00:00Z");
  });

  test("PersistResult shape is valid", () => {
    const result: PersistResult = { upserted: 0, errors: [] };
    expect(result.upserted).toBe(0);
    expect(result.errors).toEqual([]);
  });
});
