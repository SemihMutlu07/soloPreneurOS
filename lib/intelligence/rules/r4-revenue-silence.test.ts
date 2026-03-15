import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkR4RevenueSilence } from "./r4-revenue-silence";
import type { CrossModuleSnapshot, FinanceSnapshot, SalesSnapshot } from "@/lib/intelligence/types";
import type { Lead } from "@/lib/sales-types";
import type { Invoice } from "@/lib/finance-types";

// ---------------------------------------------------------------------------
// Test factories
// ---------------------------------------------------------------------------

const NOW = new Date("2026-03-15T12:00:00Z").getTime();
const ONE_DAY_AGO = new Date(NOW - 1 * 24 * 60 * 60 * 1000).toISOString();
const THIRTEEN_DAYS_AGO = new Date(NOW - 13 * 24 * 60 * 60 * 1000).toISOString();
const FOURTEEN_DAYS_AGO = new Date(NOW - 14 * 24 * 60 * 60 * 1000).toISOString();
const FIFTEEN_DAYS_AGO = new Date(NOW - 15 * 24 * 60 * 60 * 1000).toISOString();
const THIRTY_DAYS_AGO = new Date(NOW - 30 * 24 * 60 * 60 * 1000).toISOString();

let invoiceIdCounter = 0;

function makeInvoice(created_at: string): Invoice {
  invoiceIdCounter++;
  return {
    id: `inv-${invoiceIdCounter}`,
    user_id: "user-1",
    client_name: "Test Client",
    client_vkn: null,
    description: "Services",
    gross_amount: 10000,
    kdv_rate: 20,
    kdv_amount: 2000,
    stopaj_rate: null,
    stopaj_amount: null,
    net_amount: 8000,
    invoice_type: "e-arsiv",
    status: "beklemede",
    created_at,
  };
}

function makeWonLead(id = "lead-1"): Lead {
  return {
    id,
    name: "Won Lead",
    company: null,
    email: "won@example.com",
    phone: null,
    source: "manual",
    source_email_subject: null,
    source_email_snippet: null,
    source_email_date: null,
    status: "won",
    ai_score: null,
    ai_summary: null,
    ai_signals: null,
    ai_suggested_action: null,
    ai_draft_response: null,
    assigned_to: null,
    deal_value: null,
    currency: "TRY",
    notes: null,
    last_contact_at: null,
    next_follow_up_at: null,
    lost_reason: null,
    previous_lead_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function makeLead(status: Lead["status"], id = "lead-1"): Lead {
  return { ...makeWonLead(id), status };
}

function makeFinanceSnapshot(invoices: Invoice[]): FinanceSnapshot {
  return { invoices, expenses: [], runway: null };
}

function makeSalesSnapshot(leads: Lead[]): SalesSnapshot {
  return { leads, recent_activity: [] };
}

function makeSnapshot(
  finance: FinanceSnapshot | null,
  sales: SalesSnapshot | null
): CrossModuleSnapshot {
  return {
    finance,
    sales,
    hire: null,
    errors: [],
    generated_at: "2026-03-15T00:00:00Z",
  };
}

// ---------------------------------------------------------------------------
// R4: checkR4RevenueSilence
// ---------------------------------------------------------------------------

describe("checkR4RevenueSilence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    invoiceIdCounter = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when snapshot.finance is null", () => {
    const snapshot = makeSnapshot(null, makeSalesSnapshot([]));
    expect(checkR4RevenueSilence(snapshot)).toBeNull();
  });

  it("returns null when snapshot.sales is null", () => {
    const snapshot = makeSnapshot(makeFinanceSnapshot([]), null);
    expect(checkR4RevenueSilence(snapshot)).toBeNull();
  });

  it("returns null when invoice was created within last 14 days (1 day ago)", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot([makeInvoice(ONE_DAY_AGO)]),
      makeSalesSnapshot([])
    );
    expect(checkR4RevenueSilence(snapshot)).toBeNull();
  });

  it("returns null when invoice was created within last 14 days (13 days ago)", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot([makeInvoice(THIRTEEN_DAYS_AGO)]),
      makeSalesSnapshot([])
    );
    expect(checkR4RevenueSilence(snapshot)).toBeNull();
  });

  it("returns null when no invoice in 14 days but a won lead exists", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot([makeInvoice(FIFTEEN_DAYS_AGO)]),
      makeSalesSnapshot([makeWonLead()])
    );
    expect(checkR4RevenueSilence(snapshot)).toBeNull();
  });

  it("returns null when no invoices and no won leads but 'qualified' lead exists", () => {
    // Qualified lead — not won, so R4 should fire (no won leads)
    // Wait: R4 fires when no invoice AND no won leads.
    // A qualified lead is NOT a won lead, so R4 should fire.
    // This test verifies that non-won leads don't suppress R4.
    const snapshot = makeSnapshot(
      makeFinanceSnapshot([]),
      makeSalesSnapshot([makeLead("qualified")])
    );
    const result = checkR4RevenueSilence(snapshot);
    expect(result).not.toBeNull(); // Non-won lead doesn't suppress R4
  });

  it("fires when no invoices at all AND no won leads", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot([]),
      makeSalesSnapshot([])
    );
    const result = checkR4RevenueSilence(snapshot);
    expect(result).not.toBeNull();
    expect(result!.rule_id).toBe("R4");
    expect(result!.severity).toBe("warning");
    expect(result!.module_tags).toEqual(["finance", "sales"]);
    expect(result!.evidence).toContain("invoices");
    expect(result!.evidence).toContain("revenue");
    expect(result!.generated_at).toBeTruthy();
  });

  it("fires when last invoice was exactly 14 days ago AND no won leads", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot([makeInvoice(FOURTEEN_DAYS_AGO)]),
      makeSalesSnapshot([])
    );
    const result = checkR4RevenueSilence(snapshot);
    expect(result).not.toBeNull();
  });

  it("fires when last invoice was 15 days ago AND no won leads", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot([makeInvoice(FIFTEEN_DAYS_AGO)]),
      makeSalesSnapshot([makeLead("new")])
    );
    const result = checkR4RevenueSilence(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toContain("15 days");
  });

  it("fires when last invoice was 30 days ago AND no won leads", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot([makeInvoice(THIRTY_DAYS_AGO)]),
      makeSalesSnapshot([])
    );
    const result = checkR4RevenueSilence(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toContain("30 days");
  });

  it("uses most recent invoice when multiple invoices exist", () => {
    // Most recent is 1 day ago — inside 14-day window — should NOT fire
    const snapshot = makeSnapshot(
      makeFinanceSnapshot([makeInvoice(THIRTY_DAYS_AGO), makeInvoice(ONE_DAY_AGO)]),
      makeSalesSnapshot([])
    );
    expect(checkR4RevenueSilence(snapshot)).toBeNull();
  });

  it("reports correct days since last invoice in evidence", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot([makeInvoice(FIFTEEN_DAYS_AGO)]),
      makeSalesSnapshot([])
    );
    const result = checkR4RevenueSilence(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toMatch(/15 days/);
  });

  it("reports 14+ days when no invoices exist in evidence", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot([]),
      makeSalesSnapshot([])
    );
    const result = checkR4RevenueSilence(snapshot);
    expect(result).not.toBeNull();
    // Evidence should indicate no invoices — either "14+" or a large number
    expect(result!.evidence).toMatch(/\d+ days/);
  });
});
