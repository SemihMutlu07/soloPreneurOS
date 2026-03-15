import type { CrossModuleSnapshot } from "./types";

/**
 * Aggregates data from all three modules (Sales, Hiring, Finance) into a
 * unified CrossModuleSnapshot for the rule engine.
 *
 * NOTE: This is a stub implementation. Full implementation is in Phase 2.
 * The stub returns empty/null module data with no errors so the cron pipeline
 * can run end-to-end without failures.
 */
export async function buildCrossModuleSnapshot(): Promise<CrossModuleSnapshot> {
  return {
    timestamp: new Date().toISOString(),
    sales: { leads: [], activities: [] },
    hiring: { candidates: [] },
    finance: { invoices: [], expenses: [], runway: null },
    errors: [],
  };
}
