/**
 * Type-level tests for intelligence-types.ts
 * These are compile-time assertions — if the types are correct, tsc passes.
 * If the types are wrong or missing, tsc fails.
 */
import type {
  InsightSeverity,
  InsightCandidate,
  CrossModuleInsight,
  PersistResult,
} from "@/lib/intelligence-types";

// InsightSeverity must be the union "critical" | "warning" | "info"
const _s1: InsightSeverity = "critical";
const _s2: InsightSeverity = "warning";
const _s3: InsightSeverity = "info";

// InsightCandidate shape
const _candidate: InsightCandidate = {
  rule_id: "R1",
  severity: "critical",
  module_tags: ["sales", "finance"],
  evidence: "2 hot leads with no reply in 48h and runway at 45 days.",
};

// CrossModuleInsight extends InsightCandidate and adds id, generated_at, dismissed_at, created_at
const _insight: CrossModuleInsight = {
  rule_id: "R1",
  severity: "warning",
  module_tags: ["sales"],
  evidence: "Sample evidence.",
  id: "abc123",
  generated_at: "2026-03-15T00:00:00Z",
  dismissed_at: null,
  created_at: "2026-03-15T00:00:00Z",
};

// dismissed_at can also be a string
const _insightDismissed: CrossModuleInsight = {
  ..._insight,
  dismissed_at: "2026-03-15T10:00:00Z",
};

// PersistResult shape
const _result: PersistResult = {
  upserted: 0,
  errors: [],
};

// Ensure CrossModuleInsight is assignable to InsightCandidate (extends check)
const _asCandidate: InsightCandidate = _insight;

export {};
