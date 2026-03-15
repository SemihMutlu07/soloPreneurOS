import type { CrossModuleSnapshot, RuleInsight } from "@/lib/intelligence/types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * R3 — Deals closing and candidates advancing simultaneously.
 *
 * Fires when BOTH conditions are true within the last 7 days:
 * 1. At least one lead moved to "won" status (checked via lead.updated_at)
 * 2. At least one candidate has status "reviewed" (checked via candidate.applied_at)
 *
 * NOTE: applied_at is used as a proxy for "candidate advancing recently" —
 * the Candidate type has no reviewed_at or updated_at field.
 * v1 limitation: R3 may fire for old applications that were reviewed late
 * rather than truly recent candidate advancement.
 *
 * Severity: info — simultaneous capacity pressure heads-up, not an emergency.
 */
export function checkR3DealsCandidates(
  snapshot: CrossModuleSnapshot
): RuleInsight | null {
  if (!snapshot.sales || !snapshot.hire) return null;

  const now = Date.now();
  const cutoff = now - SEVEN_DAYS_MS;

  const hasRecentWonLead = snapshot.sales.leads.some(
    (lead) =>
      lead.status === "won" && new Date(lead.updated_at).getTime() > cutoff
  );

  if (!hasRecentWonLead) return null;

  const hasRecentReviewedCandidate = snapshot.hire.candidates.some(
    (candidate) =>
      // applied_at used as proxy for "candidate advancing recently" — Candidate type has no
      // reviewed_at or updated_at field. v1 limitation: R3 may fire for old applications
      // that were reviewed late rather than truly recent candidate advancement.
      candidate.status === "reviewed" &&
      new Date(candidate.applied_at).getTime() > cutoff
  );

  if (!hasRecentReviewedCandidate) return null;

  return {
    rule_id: "R3",
    severity: "info",
    evidence:
      "Deal closing and candidate advancing simultaneously — consider capacity timing",
    module_tags: ["sales", "hire"],
    generated_at: new Date().toISOString(),
  };
}
