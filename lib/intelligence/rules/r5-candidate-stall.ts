import type { CrossModuleSnapshot, RuleInsight } from "@/lib/intelligence/types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * R5 — Candidate stall detector.
 *
 * Fires when BOTH conditions are true:
 * 1. At least one active hiring role exists (role.active === true)
 * 2. At least one candidate with status "pending" or "analyzed" has applied_at
 *    more than 7 days ago (strictly > 7 days)
 *
 * When candidates stall in the pipeline while roles are still open, hiring
 * momentum is at risk. The solopreneur may have forgotten to review applications.
 *
 * Severity: warning — process gap, not a cash-flow emergency.
 */
export function checkR5CandidateStall(
  snapshot: CrossModuleSnapshot
): RuleInsight | null {
  if (!snapshot.hire) return null;

  const activeRoles = snapshot.hire.roles.filter((role) => role.active);

  if (activeRoles.length === 0) return null;

  const now = Date.now();

  const stalledCandidates = snapshot.hire.candidates.filter(
    (c) =>
      (c.status === "pending" || c.status === "analyzed") &&
      now - new Date(c.applied_at).getTime() > SEVEN_DAYS_MS
  );

  if (stalledCandidates.length === 0) return null;

  const n = stalledCandidates.length;
  const m = activeRoles.length;
  const candidateLabel = n === 1 ? "candidate" : "candidates";
  const roleLabel = m === 1 ? "open role" : "open roles";

  return {
    rule_id: "R5",
    severity: "warning",
    evidence: `${n} ${candidateLabel} pending for 7+ days with ${m} ${roleLabel}`,
    module_tags: ["hire"],
    generated_at: new Date().toISOString(),
  };
}
