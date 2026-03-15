import type { CrossModuleSnapshot, RuleInsight } from "@/lib/intelligence/types";

// ---------------------------------------------------------------------------
// Re-export all individual rule functions
// ---------------------------------------------------------------------------

export { checkR1RunwayHotLeads } from "./r1-runway-hot-leads";
export { checkR2HireRunway } from "./r2-hire-runway";
export { checkR3DealsCandidates } from "./r3-deals-candidates";
export { checkR4RevenueSilence } from "./r4-revenue-silence";
export { checkR5CandidateStall } from "./r5-candidate-stall";
export { checkR6InvoicePayroll } from "./r6-invoice-payroll";
export { checkR7HotLeadsNoReply } from "./r7-hot-leads-no-reply";

// ---------------------------------------------------------------------------
// Rule registry — ordered list of all rule functions
// ---------------------------------------------------------------------------

import { checkR1RunwayHotLeads } from "./r1-runway-hot-leads";
import { checkR2HireRunway } from "./r2-hire-runway";
import { checkR3DealsCandidates } from "./r3-deals-candidates";
import { checkR4RevenueSilence } from "./r4-revenue-silence";
import { checkR5CandidateStall } from "./r5-candidate-stall";
import { checkR6InvoicePayroll } from "./r6-invoice-payroll";
import { checkR7HotLeadsNoReply } from "./r7-hot-leads-no-reply";

const ALL_RULES = [
  checkR1RunwayHotLeads,
  checkR2HireRunway,
  checkR3DealsCandidates,
  checkR4RevenueSilence,
  checkR5CandidateStall,
  checkR6InvoicePayroll,
  checkR7HotLeadsNoReply,
] as const;

// ---------------------------------------------------------------------------
// runAllRules — single entry point for Phase 4 cron pipeline
// ---------------------------------------------------------------------------

/**
 * Runs all 7 rule functions against the provided CrossModuleSnapshot.
 *
 * - Calls each rule in sequence
 * - Individual rule errors are caught and logged to console.error but do NOT
 *   propagate — the remaining rules continue running
 * - null results (rule didn't fire) are filtered out
 * - Returns RuleInsight[] — may be empty when no rules fire
 *
 * Never throws. Safe to call from any context.
 */
export function runAllRules(snapshot: CrossModuleSnapshot): RuleInsight[] {
  const results: RuleInsight[] = [];

  for (const rule of ALL_RULES) {
    try {
      const insight = rule(snapshot);
      if (insight !== null) {
        results.push(insight);
      }
    } catch (err) {
      console.error(
        `[runAllRules] Rule ${rule.name} threw an unexpected error:`,
        err
      );
    }
  }

  return results;
}
