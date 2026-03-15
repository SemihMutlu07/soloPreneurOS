import type { CrossModuleSnapshot, RuleInsight } from "@/lib/intelligence/types";

/**
 * Large invoice threshold in TL. Overdue invoices below this amount are excluded
 * to avoid noise from minor billing issues. Threshold chosen to focus on
 * significant cash-flow impacts only.
 */
const LARGE_INVOICE_THRESHOLD = 10000;

/**
 * R6 — Invoice/payroll collision detector.
 *
 * Fires when BOTH conditions are true:
 * 1. At least one overdue invoice (status "gecmis") with gross_amount > 10000 TL exists
 * 2. At least one pending invoice (status "beklemede") exists as a proxy for
 *    upcoming financial obligations (payroll, supplier payments, etc.)
 *
 * A large uncollected invoice combined with upcoming payment obligations signals
 * a cash-flow squeeze that requires immediate attention.
 *
 * NOTE: "beklemede" (pending) invoices are used as a proxy for upcoming payroll
 * and operational costs. No explicit payroll field exists in the Finance module.
 *
 * Severity: critical — cash-flow emergency with both income gap and cost pressure.
 */
export function checkR6InvoicePayroll(
  snapshot: CrossModuleSnapshot
): RuleInsight | null {
  if (!snapshot.finance) return null;

  const largeOverdueInvoices = snapshot.finance.invoices.filter(
    (i) => i.status === "gecmis" && i.gross_amount > LARGE_INVOICE_THRESHOLD
  );

  if (largeOverdueInvoices.length === 0) return null;

  const hasPendingInvoice = snapshot.finance.invoices.some(
    (i) => i.status === "beklemede"
  );

  if (!hasPendingInvoice) return null;

  // Use the largest overdue invoice amount for the evidence string
  const maxOverdueAmount = Math.max(
    ...largeOverdueInvoices.map((i) => i.gross_amount)
  );

  return {
    rule_id: "R6",
    severity: "critical",
    evidence: `Large overdue invoice (${maxOverdueAmount} TL) with upcoming payment obligations`,
    module_tags: ["finance"],
    generated_at: new Date().toISOString(),
  };
}
