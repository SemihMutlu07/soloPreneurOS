import type { CrossModuleSnapshot, RuleInsight } from "@/lib/intelligence/types";
import { isHotLead } from "@/lib/intelligence/types";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * R7 — Hot leads no-reply detector.
 *
 * Fires when BOTH conditions are true:
 * 1. 2 or more hot leads exist in the sales pipeline
 * 2. At least one hot lead has last_contact_at null OR last_contact_at older
 *    than 48 hours ago (strictly > 48 hours)
 *
 * Hot leads require active follow-up. When multiple leads are in flight and
 * some have gone silent, response rate and deal velocity are at risk.
 *
 * Severity: warning — sales momentum concern, not yet a cash-flow emergency.
 */
export function checkR7HotLeadsNoReply(
  snapshot: CrossModuleSnapshot
): RuleInsight | null {
  if (!snapshot.sales) return null;

  const hotLeads = snapshot.sales.leads.filter(isHotLead);

  if (hotLeads.length < 2) return null;

  const now = Date.now();

  const noReplyLeads = hotLeads.filter(
    (lead) =>
      lead.last_contact_at === null ||
      now - new Date(lead.last_contact_at).getTime() > FORTY_EIGHT_HOURS_MS
  );

  if (noReplyLeads.length === 0) return null;

  const n = noReplyLeads.length;
  const total = hotLeads.length;
  const leadLabel = n === 1 ? "hot lead" : "hot leads";

  return {
    rule_id: "R7",
    severity: "warning",
    evidence: `${n} ${leadLabel} with no reply in 48+ hours out of ${total} active leads`,
    module_tags: ["sales"],
    generated_at: new Date().toISOString(),
  };
}
