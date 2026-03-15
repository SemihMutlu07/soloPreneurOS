import type { CrossModuleSnapshot } from "./types";
import type { InsightCandidate } from "@/lib/intelligence-types";

/**
 * Runs all cross-module pattern rules against the given snapshot and returns
 * an array of InsightCandidate objects for any rules that fire.
 *
 * NOTE: This is a stub implementation. Full implementation (R1-R7) is in Phase 3.
 * The stub always returns an empty array so the cron pipeline runs without
 * producing spurious insights before the real rules are wired.
 */
export async function runRuleEngine(
  _snapshot: CrossModuleSnapshot,
): Promise<InsightCandidate[]> {
  return [];
}
