import type { CrossModuleSnapshot, RuleInsight } from "@/lib/intelligence/types";

/**
 * R2 — Hiring + Runway collision detector.
 *
 * Fires when cash runway falls below 90 days AND at least one Role is
 * actively hiring (role.active === true). Open hiring roles represent
 * upcoming salary commitments that will accelerate cash burn.
 *
 * Severity: warning — runway concern with hiring commitment, not yet critical.
 * The 90-day threshold is higher than R1 (60 days) because salary costs are
 * forward-committed and need more lead time to address.
 */
export function checkR2HireRunway(
  snapshot: CrossModuleSnapshot
): RuleInsight | null {
  if (!snapshot.finance || !snapshot.hire) return null;
  if (!snapshot.finance.runway) return null;

  const runwayDays = Math.floor(snapshot.finance.runway.runway_months * 30);

  if (runwayDays >= 90) return null;

  const activeRoles = snapshot.hire.roles.filter((role) => role.active);

  if (activeRoles.length === 0) return null;

  const n = activeRoles.length;
  const roleLabel = n === 1 ? "open role" : "open roles";

  return {
    rule_id: "R2",
    severity: "warning",
    evidence: `${n} ${roleLabel} hiring, runway at ${runwayDays} days`,
    module_tags: ["hire", "finance"],
    generated_at: new Date().toISOString(),
  };
}
