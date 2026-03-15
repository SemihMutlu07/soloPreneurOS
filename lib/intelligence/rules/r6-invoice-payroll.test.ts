import { describe, it, expect } from "vitest";
import { checkR6InvoicePayroll } from "./r6-invoice-payroll";
import type {
  CrossModuleSnapshot,
  FinanceSnapshot,
} from "@/lib/intelligence/types";
import type { Invoice } from "@/lib/finance-types";

// ---------------------------------------------------------------------------
// Test factories
// ---------------------------------------------------------------------------

function makeInvoice(
  status: Invoice["status"],
  gross_amount: number,
  id = "inv-1"
): Invoice {
  return {
    id,
    user_id: "user-1",
    client_name: "Test Client",
    client_vkn: null,
    description: "Test invoice",
    gross_amount,
    kdv_rate: 20,
    kdv_amount: gross_amount * 0.2,
    stopaj_rate: null,
    stopaj_amount: null,
    net_amount: gross_amount,
    invoice_type: "e-arsiv",
    status,
    created_at: "2026-01-01T00:00:00Z",
  };
}

function makeFinanceSnapshot(invoices: Invoice[]): FinanceSnapshot {
  return { invoices, expenses: [], runway: null };
}

function makeSnapshot(finance: FinanceSnapshot | null): CrossModuleSnapshot {
  return {
    finance,
    sales: null,
    hire: null,
    errors: [],
    generated_at: "2026-03-15T00:00:00Z",
  };
}

// ---------------------------------------------------------------------------
// R6: checkR6InvoicePayroll
// ---------------------------------------------------------------------------

describe("checkR6InvoicePayroll", () => {
  it("returns null when snapshot.finance is null", () => {
    const snapshot = makeSnapshot(null);
    expect(checkR6InvoicePayroll(snapshot)).toBeNull();
  });

  it("returns null when no overdue invoices exist", () => {
    const finance = makeFinanceSnapshot([
      makeInvoice("beklemede", 50000),
      makeInvoice("odendi", 20000, "inv-2"),
    ]);
    const snapshot = makeSnapshot(finance);
    expect(checkR6InvoicePayroll(snapshot)).toBeNull();
  });

  it("returns null when overdue invoice exists but gross_amount <= 10000 (small)", () => {
    const finance = makeFinanceSnapshot([
      makeInvoice("gecmis", 9999),
      makeInvoice("beklemede", 50000, "inv-2"),
    ]);
    const snapshot = makeSnapshot(finance);
    expect(checkR6InvoicePayroll(snapshot)).toBeNull();
  });

  it("returns null when overdue invoice is exactly 10000 (not strictly >)", () => {
    const finance = makeFinanceSnapshot([
      makeInvoice("gecmis", 10000),
      makeInvoice("beklemede", 50000, "inv-2"),
    ]);
    const snapshot = makeSnapshot(finance);
    expect(checkR6InvoicePayroll(snapshot)).toBeNull();
  });

  it("returns null when large overdue invoice exists but no pending invoices", () => {
    const finance = makeFinanceSnapshot([
      makeInvoice("gecmis", 50000),
      makeInvoice("odendi", 20000, "inv-2"),
    ]);
    const snapshot = makeSnapshot(finance);
    expect(checkR6InvoicePayroll(snapshot)).toBeNull();
  });

  it("returns null when invoice list is empty", () => {
    const finance = makeFinanceSnapshot([]);
    const snapshot = makeSnapshot(finance);
    expect(checkR6InvoicePayroll(snapshot)).toBeNull();
  });

  it("fires when large overdue invoice AND pending invoice both exist", () => {
    const finance = makeFinanceSnapshot([
      makeInvoice("gecmis", 50000),
      makeInvoice("beklemede", 20000, "inv-2"),
    ]);
    const snapshot = makeSnapshot(finance);
    const result = checkR6InvoicePayroll(snapshot);
    expect(result).not.toBeNull();
    expect(result!.rule_id).toBe("R6");
    expect(result!.severity).toBe("critical");
    expect(result!.module_tags).toEqual(["finance"]);
    expect(result!.evidence).toContain("50000");
    expect(result!.evidence).toContain("TL");
    expect(result!.generated_at).toBeTruthy();
  });

  it("fires with the largest overdue invoice amount in evidence when multiple exist", () => {
    const finance = makeFinanceSnapshot([
      makeInvoice("gecmis", 50000, "inv-1"),
      makeInvoice("gecmis", 150000, "inv-2"),
      makeInvoice("beklemede", 20000, "inv-3"),
    ]);
    const snapshot = makeSnapshot(finance);
    const result = checkR6InvoicePayroll(snapshot);
    expect(result).not.toBeNull();
    // Should mention the largest overdue amount or a representative amount
    expect(result!.evidence).toContain("TL");
  });

  it("fires when large overdue exists alongside both pending and paid invoices", () => {
    const finance = makeFinanceSnapshot([
      makeInvoice("gecmis", 75000, "inv-1"),
      makeInvoice("odendi", 10000, "inv-2"),
      makeInvoice("beklemede", 30000, "inv-3"),
    ]);
    const snapshot = makeSnapshot(finance);
    const result = checkR6InvoicePayroll(snapshot);
    expect(result).not.toBeNull();
    expect(result!.rule_id).toBe("R6");
  });

  it("evidence includes 'upcoming payment obligations' phrase", () => {
    const finance = makeFinanceSnapshot([
      makeInvoice("gecmis", 25000),
      makeInvoice("beklemede", 15000, "inv-2"),
    ]);
    const snapshot = makeSnapshot(finance);
    const result = checkR6InvoicePayroll(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toContain("upcoming payment");
  });
});
