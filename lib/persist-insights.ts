import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InsightCandidate, PersistResult } from "@/lib/intelligence-types";

/**
 * Build a content-addressed ID for an insight.
 * ID = SHA256(ruleId + "-" + calendarDate)
 * Deterministic: identical inputs always produce identical IDs across runs.
 */
export function buildInsightId(ruleId: string, calendarDate: string): string {
  return createHash("sha256").update(`${ruleId}-${calendarDate}`).digest("hex");
}

/**
 * Upsert an array of InsightCandidate objects to the cross_module_insights table.
 *
 * Key invariants:
 * - dismissed_at is NOT included in the upsert payload, so dismissed rows stay dismissed.
 * - On conflict (same id), generated_at, severity, and evidence are updated.
 * - Per-item errors are accumulated; a single failure does not abort the run.
 */
export async function persistInsights(
  candidates: InsightCandidate[],
): Promise<PersistResult> {
  const result: PersistResult = { upserted: 0, errors: [] };

  if (candidates.length === 0) {
    return result;
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  for (const candidate of candidates) {
    try {
      const id = buildInsightId(candidate.rule_id, today);

      const row = {
        id,
        rule_id: candidate.rule_id,
        severity: candidate.severity,
        module_tags: candidate.module_tags,
        evidence: candidate.evidence,
        generated_at: new Date().toISOString(),
        // dismissed_at intentionally omitted — omitting it from the payload
        // means Supabase upsert will not overwrite the existing value,
        // preserving the dismissed state for already-dismissed rows.
      };

      const { error } = await supabase
        .from("cross_module_insights")
        .upsert(row, { onConflict: "id", ignoreDuplicates: false });

      if (error) {
        result.errors.push(`${candidate.rule_id}: ${error.message}`);
      } else {
        result.upserted++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`${candidate.rule_id}: ${message}`);
    }
  }

  return result;
}
