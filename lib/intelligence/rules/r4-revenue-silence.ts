import type { CrossModuleSnapshot, RuleInsight } from "@/lib/intelligence/types";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * R4 — Revenue silence detector.
 *
 * Fires when BOTH conditions are true:
 * 1. No invoice was created in the last 14 days
 * 2. No lead has status "won" (at any time)
 *
 * A recent invoice or a won deal suppresses this rule — either signal
 * indicates active revenue flow. When both are absent, revenue pipeline
 * may be stalling and the solopreneur needs a heads-up.
 *
 * Days since last invoice:
 * - Computed from the most recent invoice's created_at
 * - If no invoices exist, reported as 14+ days (silent for longer than threshold)
 *
 * Severity: warning — concerning but not yet critical.
 */
export function checkR4RevenueSilence(
  snapshot: CrossModuleSnapshot
): RuleInsight | null {
  if (!snapshot.finance || !snapshot.sales) return null;

  const now = Date.now();
  const cutoff = now - FOURTEEN_DAYS_MS;

  const hasRecentInvoice = snapshot.finance.invoices.some(
    (invoice) => new Date(invoice.created_at).getTime() > cutoff
  );

  if (hasRecentInvoice) return null;

  const hasWonLead = snapshot.sales.leads.some((lead) => lead.status === "won");

  if (hasWonLead) return null;

  // Compute days since last invoice for evidence string
  let daysSinceLastInvoice: number;

  if (snapshot.finance.invoices.length === 0) {
    daysSinceLastInvoice = 14; // Use threshold as minimum — actual silence may be longer
  } else {
    // Find most recent invoice by created_at
    const mostRecentMs = snapshot.finance.invoices.reduce(
      (latest, invoice) => Math.max(latest, new Date(invoice.created_at).getTime()),
      0
    );
    daysSinceLastInvoice = Math.floor((now - mostRecentMs) / (24 * 60 * 60 * 1000));
  }

  return {
    rule_id: "R4",
    severity: "warning",
    evidence: `No invoices sent in ${daysSinceLastInvoice} days and no deals won — revenue pipeline may be stalling`,
    module_tags: ["finance", "sales"],
    generated_at: new Date().toISOString(),
  };
}
