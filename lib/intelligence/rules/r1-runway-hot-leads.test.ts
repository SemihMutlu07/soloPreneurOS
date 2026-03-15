import { describe, it, expect } from "vitest";
import { checkR1RunwayHotLeads } from "./r1-runway-hot-leads";
import type { CrossModuleSnapshot, FinanceSnapshot, SalesSnapshot } from "@/lib/intelligence/types";
import type { Lead } from "@/lib/sales-types";
import type { RunwayData } from "@/lib/finance-types";

// ---------------------------------------------------------------------------
// Test factories
// ---------------------------------------------------------------------------

function makeRunway(runway_months: number): RunwayData {
  return { cash_tl: 100000, cash_usd: 0, monthly_burn: 10000, runway_months };
}

function makeLead(status: Lead["status"], id = "lead-1"): Lead {
  return {
    id,
    name: "Test Lead",
    company: null,
    email: "test@example.com",
    phone: null,
    source: "manual",
    source_email_subject: null,
    source_email_snippet: null,
    source_email_date: null,
    status,
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

function makeSalesSnapshot(leads: Lead[]): SalesSnapshot {
  return { leads, recent_activity: [] };
}

function makeFinanceSnapshot(runway: RunwayData | null): FinanceSnapshot {
  return { invoices: [], expenses: [], runway };
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
// R1: checkR1RunwayHotLeads
// ---------------------------------------------------------------------------

describe("checkR1RunwayHotLeads", () => {
  it("returns null when snapshot.finance is null", () => {
    const snapshot = makeSnapshot(null, makeSalesSnapshot([makeLead("qualified")]));
    expect(checkR1RunwayHotLeads(snapshot)).toBeNull();
  });

  it("returns null when snapshot.sales is null", () => {
    const snapshot = makeSnapshot(makeFinanceSnapshot(makeRunway(1)), null);
    expect(checkR1RunwayHotLeads(snapshot)).toBeNull();
  });

  it("returns null when finance.runway is null", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(null),
      makeSalesSnapshot([makeLead("qualified")])
    );
    expect(checkR1RunwayHotLeads(snapshot)).toBeNull();
  });

  it("returns null when runway >= 60 days (2 months) even with hot leads", () => {
    // 2 months * 30 = 60 days — exactly at threshold, should be null (>= 60)
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(2)),
      makeSalesSnapshot([makeLead("qualified")])
    );
    expect(checkR1RunwayHotLeads(snapshot)).toBeNull();
  });

  it("returns null when runway > 60 days (3 months) with hot leads", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(3)),
      makeSalesSnapshot([makeLead("negotiation")])
    );
    expect(checkR1RunwayHotLeads(snapshot)).toBeNull();
  });

  it("returns null when runway < 60 days but no hot leads", () => {
    // 1 month = 30 days < 60, but only 'new' and 'won' leads — not hot
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(1)),
      makeSalesSnapshot([makeLead("new"), makeLead("won", "lead-2")])
    );
    expect(checkR1RunwayHotLeads(snapshot)).toBeNull();
  });

  it("returns null when runway < 60 days but leads array is empty", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(1)),
      makeSalesSnapshot([])
    );
    expect(checkR1RunwayHotLeads(snapshot)).toBeNull();
  });

  it("fires when runway < 60 days (1 month = 30 days) AND 1 hot lead exists", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(1)),
      makeSalesSnapshot([makeLead("qualified")])
    );
    const result = checkR1RunwayHotLeads(snapshot);
    expect(result).not.toBeNull();
    expect(result!.rule_id).toBe("R1");
    expect(result!.severity).toBe("critical");
    expect(result!.module_tags).toEqual(["sales", "finance"]);
    expect(result!.evidence).toContain("1 hot lead");
    expect(result!.evidence).toContain("30 days");
    expect(result!.generated_at).toBeTruthy();
  });

  it("fires when runway < 60 days AND multiple hot leads exist", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(1)),
      makeSalesSnapshot([
        makeLead("demo", "lead-1"),
        makeLead("proposal", "lead-2"),
        makeLead("negotiation", "lead-3"),
      ])
    );
    const result = checkR1RunwayHotLeads(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toContain("3 hot lead");
  });

  it("fires for all hot stages: qualified, contacted, demo, proposal, negotiation", () => {
    const hotStages: Lead["status"][] = ["qualified", "contacted", "demo", "proposal", "negotiation"];
    for (const stage of hotStages) {
      const snapshot = makeSnapshot(
        makeFinanceSnapshot(makeRunway(1)),
        makeSalesSnapshot([makeLead(stage)])
      );
      const result = checkR1RunwayHotLeads(snapshot);
      expect(result, `Expected R1 to fire for stage: ${stage}`).not.toBeNull();
    }
  });

  it("does not fire for non-hot stages: new, won, lost, nurture", () => {
    const coldStages: Lead["status"][] = ["new", "won", "lost", "nurture"];
    for (const stage of coldStages) {
      const snapshot = makeSnapshot(
        makeFinanceSnapshot(makeRunway(1)),
        makeSalesSnapshot([makeLead(stage)])
      );
      const result = checkR1RunwayHotLeads(snapshot);
      expect(result, `Expected R1 NOT to fire for stage: ${stage}`).toBeNull();
    }
  });

  it("counts only hot leads (excludes cold leads) in evidence string", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(1)),
      makeSalesSnapshot([
        makeLead("qualified", "hot-1"),
        makeLead("new", "cold-1"),
        makeLead("won", "cold-2"),
      ])
    );
    const result = checkR1RunwayHotLeads(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toContain("1 hot lead");
  });

  it("includes correct runway days in evidence (fractional months rounded down)", () => {
    // 1.5 months * 30 = 45 days
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(1.5)),
      makeSalesSnapshot([makeLead("qualified")])
    );
    const result = checkR1RunwayHotLeads(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toContain("45 days");
  });
});
