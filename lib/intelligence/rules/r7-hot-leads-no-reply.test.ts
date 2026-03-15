import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkR7HotLeadsNoReply } from "./r7-hot-leads-no-reply";
import type {
  CrossModuleSnapshot,
  SalesSnapshot,
} from "@/lib/intelligence/types";
import type { Lead } from "@/lib/sales-types";

// ---------------------------------------------------------------------------
// Test factories
// ---------------------------------------------------------------------------

const NOW = new Date("2026-03-15T00:00:00Z").getTime();

function makeLead(
  status: Lead["status"],
  last_contact_at: string | null,
  id = "lead-1"
): Lead {
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
    last_contact_at,
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

function makeSnapshot(sales: SalesSnapshot | null): CrossModuleSnapshot {
  return {
    sales,
    hire: null,
    finance: null,
    errors: [],
    generated_at: "2026-03-15T00:00:00Z",
  };
}

// Time helpers
const STALE_CONTACT = new Date(NOW - 49 * 60 * 60 * 1000).toISOString(); // 49 hrs ago (> 48h)
const FRESH_CONTACT = new Date(NOW - 24 * 60 * 60 * 1000).toISOString(); // 24 hrs ago (< 48h)
const EXACT_48H_CONTACT = new Date(NOW - 48 * 60 * 60 * 1000).toISOString(); // exactly 48h (not stale)

// ---------------------------------------------------------------------------
// R7: checkR7HotLeadsNoReply
// ---------------------------------------------------------------------------

describe("checkR7HotLeadsNoReply", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when snapshot.sales is null", () => {
    const snapshot = makeSnapshot(null);
    expect(checkR7HotLeadsNoReply(snapshot)).toBeNull();
  });

  it("returns null when fewer than 2 hot leads exist (0 hot leads)", () => {
    const sales = makeSalesSnapshot([
      makeLead("new", null, "l1"),
      makeLead("won", null, "l2"),
    ]);
    const snapshot = makeSnapshot(sales);
    expect(checkR7HotLeadsNoReply(snapshot)).toBeNull();
  });

  it("returns null when exactly 1 hot lead exists (threshold is 2+)", () => {
    const sales = makeSalesSnapshot([
      makeLead("qualified", null, "l1"),
      makeLead("new", null, "l2"),
    ]);
    const snapshot = makeSnapshot(sales);
    expect(checkR7HotLeadsNoReply(snapshot)).toBeNull();
  });

  it("returns null when 2+ hot leads exist but all contacted within 48 hours", () => {
    const sales = makeSalesSnapshot([
      makeLead("qualified", FRESH_CONTACT, "l1"),
      makeLead("demo", FRESH_CONTACT, "l2"),
    ]);
    const snapshot = makeSnapshot(sales);
    expect(checkR7HotLeadsNoReply(snapshot)).toBeNull();
  });

  it("returns null when hot lead contacted exactly 48 hours ago (not stale — must be strictly >)", () => {
    const sales = makeSalesSnapshot([
      makeLead("qualified", EXACT_48H_CONTACT, "l1"),
      makeLead("demo", FRESH_CONTACT, "l2"),
    ]);
    const snapshot = makeSnapshot(sales);
    expect(checkR7HotLeadsNoReply(snapshot)).toBeNull();
  });

  it("returns null when leads array is empty", () => {
    const sales = makeSalesSnapshot([]);
    const snapshot = makeSnapshot(sales);
    expect(checkR7HotLeadsNoReply(snapshot)).toBeNull();
  });

  it("fires when 2+ hot leads AND 1 has last_contact_at null", () => {
    const sales = makeSalesSnapshot([
      makeLead("qualified", null, "l1"),
      makeLead("demo", FRESH_CONTACT, "l2"),
    ]);
    const snapshot = makeSnapshot(sales);
    const result = checkR7HotLeadsNoReply(snapshot);
    expect(result).not.toBeNull();
    expect(result!.rule_id).toBe("R7");
    expect(result!.severity).toBe("warning");
    expect(result!.module_tags).toEqual(["sales"]);
    expect(result!.evidence).toContain("1 hot lead");
    expect(result!.evidence).toContain("48");
    expect(result!.generated_at).toBeTruthy();
  });

  it("fires when 2+ hot leads AND 1 has last_contact_at > 48 hours ago", () => {
    const sales = makeSalesSnapshot([
      makeLead("qualified", STALE_CONTACT, "l1"),
      makeLead("demo", FRESH_CONTACT, "l2"),
    ]);
    const snapshot = makeSnapshot(sales);
    const result = checkR7HotLeadsNoReply(snapshot);
    expect(result).not.toBeNull();
    expect(result!.rule_id).toBe("R7");
    expect(result!.severity).toBe("warning");
  });

  it("fires when all hot leads have no contact (last_contact_at null)", () => {
    const sales = makeSalesSnapshot([
      makeLead("qualified", null, "l1"),
      makeLead("demo", null, "l2"),
      makeLead("proposal", null, "l3"),
    ]);
    const snapshot = makeSnapshot(sales);
    const result = checkR7HotLeadsNoReply(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toContain("3 hot lead");
  });

  it("evidence includes total hot leads count and no-reply count", () => {
    const sales = makeSalesSnapshot([
      makeLead("qualified", null, "l1"),
      makeLead("demo", STALE_CONTACT, "l2"),
      makeLead("proposal", FRESH_CONTACT, "l3"),
      makeLead("negotiation", FRESH_CONTACT, "l4"),
    ]);
    const snapshot = makeSnapshot(sales);
    const result = checkR7HotLeadsNoReply(snapshot);
    expect(result).not.toBeNull();
    // 2 no-reply out of 4 hot leads
    expect(result!.evidence).toContain("2 hot lead");
    expect(result!.evidence).toContain("4");
  });

  it("fires for all hot stages: qualified, contacted, demo, proposal, negotiation", () => {
    // Each hot stage — need at least 2 for rule to fire
    const hotStages: Lead["status"][] = [
      "qualified",
      "contacted",
      "demo",
      "proposal",
      "negotiation",
    ];
    for (const stage of hotStages) {
      const sales = makeSalesSnapshot([
        makeLead(stage, null, "l1"),
        makeLead(stage, FRESH_CONTACT, "l2"),
      ]);
      const snapshot = makeSnapshot(sales);
      const result = checkR7HotLeadsNoReply(snapshot);
      expect(result, `Expected R7 to fire for stage: ${stage}`).not.toBeNull();
    }
  });

  it("does not count non-hot leads toward the 2+ minimum", () => {
    // 1 hot + 1 non-hot — not enough
    const sales = makeSalesSnapshot([
      makeLead("qualified", null, "l1"),
      makeLead("won", null, "l2"),
      makeLead("lost", null, "l3"),
    ]);
    const snapshot = makeSnapshot(sales);
    expect(checkR7HotLeadsNoReply(snapshot)).toBeNull();
  });
});
