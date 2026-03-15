/**
 * Type-level and behavioral tests for persist-insights.ts
 * These are compile-time assertions — tsc must pass when implementation is correct.
 *
 * Note: Runtime behavior of persistInsights (Supabase upsert) is verified manually
 * against the DB. Here we verify: types, exports, and buildInsightId determinism.
 */
import { buildInsightId, persistInsights } from "@/lib/persist-insights";
import type { InsightCandidate, PersistResult } from "@/lib/intelligence-types";

// buildInsightId must be exported and accept two strings
const id1: string = buildInsightId("R1", "2026-03-15");
const id2: string = buildInsightId("R1", "2026-03-15");

// Determinism: same inputs must produce the same output
// This is validated at runtime but expressed here for documentation
if (id1 !== id2) {
  throw new Error("buildInsightId is not deterministic");
}

// buildInsightId should return a 64-char hex string (SHA256)
if (id1.length !== 64) {
  throw new Error(`Expected 64 char hex, got ${id1.length}`);
}

// Different inputs produce different IDs
const id3: string = buildInsightId("R2", "2026-03-15");
if (id1 === id3) {
  throw new Error("buildInsightId collision between R1 and R2");
}

// persistInsights must be exported and accept InsightCandidate[]
// Return type must be Promise<PersistResult>
const _candidates: InsightCandidate[] = [
  {
    rule_id: "R1",
    severity: "critical",
    module_tags: ["sales", "finance"],
    evidence: "2 hot leads stalled and runway < 60 days.",
  },
];

// Type-check: persistInsights must accept array and return Promise<PersistResult>
const _resultPromise: Promise<PersistResult> = persistInsights(_candidates);

// Also accepts empty array
const _emptyPromise: Promise<PersistResult> = persistInsights([]);

export {};
