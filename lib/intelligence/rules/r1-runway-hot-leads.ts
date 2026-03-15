import type { CrossModuleSnapshot, RuleInsight } from "@/lib/intelligence/types";
import { isHotLead } from "@/lib/intelligence/types";

/**
 * R1 — Runway + Hot Leads collision detector.
 *
 * Fires when cash runway falls below 60 days AND at least one hot lead
 * exists in the sales pipeline. A "hot lead" is in one of the active
 * pipeline stages (qualified, contacted, demo, proposal, negotiation).
 *
 * Severity: critical — runway emergency combined with active pipeline signals
 * cash-flow risk that requires immediate attention.
 */
export function checkR1RunwayHotLeads(
  snapshot: CrossModuleSnapshot
): RuleInsight | null {
  if (!snapshot.finance || !snapshot.sales) return null;
  if (!snapshot.finance.runway) return null;

  const runwayDays = Math.floor(snapshot.finance.runway.runway_months * 30);

  if (runwayDays >= 60) return null;

  const hotLeads = snapshot.sales.leads.filter(isHotLead);

  if (hotLeads.length === 0) return null;

  const n = hotLeads.length;
  const leadLabel = n === 1 ? "hot lead" : "hot leads";

  return {
    rule_id: "R1",
    severity: "critical",
    evidence: `${n} ${leadLabel} in pipeline, runway at ${runwayDays} days`,
    module_tags: ["sales", "finance"],
    generated_at: new Date().toISOString(),
  };
}
