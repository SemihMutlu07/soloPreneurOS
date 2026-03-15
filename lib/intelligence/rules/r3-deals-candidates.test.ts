import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkR3DealsCandidates } from "./r3-deals-candidates";
import type { CrossModuleSnapshot, SalesSnapshot, HireSnapshot } from "@/lib/intelligence/types";
import type { Lead } from "@/lib/sales-types";
import type { CandidateWithEvaluation } from "@/lib/hiring-types";

// ---------------------------------------------------------------------------
// Test factories
// ---------------------------------------------------------------------------

const NOW = new Date("2026-03-15T12:00:00Z").getTime();
const SIX_DAYS_AGO = new Date(NOW - 6 * 24 * 60 * 60 * 1000).toISOString();
const SEVEN_DAYS_AGO_MINUS_1MS = new Date(NOW - 7 * 24 * 60 * 60 * 1000 + 1).toISOString();
const SEVEN_DAYS_AGO_EXACT = new Date(NOW - 7 * 24 * 60 * 60 * 1000).toISOString();
const EIGHT_DAYS_AGO = new Date(NOW - 8 * 24 * 60 * 60 * 1000).toISOString();
const ONE_DAY_AGO = new Date(NOW - 1 * 24 * 60 * 60 * 1000).toISOString();

function makeWonLead(updated_at: string, id = "lead-1"): Lead {
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
    updated_at,
  };
}

function makeReviewedCandidate(applied_at: string, id = "cand-1"): CandidateWithEvaluation {
  return {
    id,
    name: "Reviewed Candidate",
    email: "cand@example.com",
    role: "Engineer",
    applied_at,
    pdf_url: "http://example.com/cv.pdf",
    status: "reviewed",
    previous_application_id: null,
    gmail_message_id: null,
    created_at: "2026-01-01T00:00:00Z",
    evaluation: null,
  };
}

function makeSalesSnapshot(leads: Lead[]): SalesSnapshot {
  return { leads, recent_activity: [] };
}

function makeHireSnapshot(candidates: CandidateWithEvaluation[]): HireSnapshot {
  return { candidates, roles: [] };
}

function makeSnapshot(
  sales: SalesSnapshot | null,
  hire: HireSnapshot | null
): CrossModuleSnapshot {
  return {
    finance: null,
    sales,
    hire,
    errors: [],
    generated_at: "2026-03-15T00:00:00Z",
  };
}

// ---------------------------------------------------------------------------
// R3: checkR3DealsCandidates
// ---------------------------------------------------------------------------

describe("checkR3DealsCandidates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when snapshot.sales is null", () => {
    const snapshot = makeSnapshot(null, makeHireSnapshot([makeReviewedCandidate(ONE_DAY_AGO)]));
    expect(checkR3DealsCandidates(snapshot)).toBeNull();
  });

  it("returns null when snapshot.hire is null", () => {
    const snapshot = makeSnapshot(makeSalesSnapshot([makeWonLead(ONE_DAY_AGO)]), null);
    expect(checkR3DealsCandidates(snapshot)).toBeNull();
  });

  it("returns null when no won leads in last 7 days (even if reviewed candidate exists)", () => {
    const snapshot = makeSnapshot(
      makeSalesSnapshot([makeWonLead(EIGHT_DAYS_AGO)]),
      makeHireSnapshot([makeReviewedCandidate(ONE_DAY_AGO)])
    );
    expect(checkR3DealsCandidates(snapshot)).toBeNull();
  });

  it("returns null when no reviewed candidates in last 7 days (even if won lead exists)", () => {
    const snapshot = makeSnapshot(
      makeSalesSnapshot([makeWonLead(ONE_DAY_AGO)]),
      makeHireSnapshot([makeReviewedCandidate(EIGHT_DAYS_AGO)])
    );
    expect(checkR3DealsCandidates(snapshot)).toBeNull();
  });

  it("returns null when won lead exists recently but no candidates have 'reviewed' status", () => {
    const pending: CandidateWithEvaluation = {
      ...makeReviewedCandidate(ONE_DAY_AGO),
      status: "pending",
    };
    const snapshot = makeSnapshot(
      makeSalesSnapshot([makeWonLead(ONE_DAY_AGO)]),
      makeHireSnapshot([pending])
    );
    expect(checkR3DealsCandidates(snapshot)).toBeNull();
  });

  it("returns null when leads are empty and candidates are empty", () => {
    const snapshot = makeSnapshot(makeSalesSnapshot([]), makeHireSnapshot([]));
    expect(checkR3DealsCandidates(snapshot)).toBeNull();
  });

  it("fires when both a won lead AND reviewed candidate exist within last 7 days", () => {
    const snapshot = makeSnapshot(
      makeSalesSnapshot([makeWonLead(ONE_DAY_AGO)]),
      makeHireSnapshot([makeReviewedCandidate(ONE_DAY_AGO)])
    );
    const result = checkR3DealsCandidates(snapshot);
    expect(result).not.toBeNull();
    expect(result!.rule_id).toBe("R3");
    expect(result!.severity).toBe("info");
    expect(result!.module_tags).toEqual(["sales", "hire"]);
    expect(result!.evidence).toContain("capacity");
    expect(result!.generated_at).toBeTruthy();
  });

  it("fires when won lead updated within last 7 days (just inside boundary)", () => {
    const snapshot = makeSnapshot(
      makeSalesSnapshot([makeWonLead(SEVEN_DAYS_AGO_MINUS_1MS)]),
      makeHireSnapshot([makeReviewedCandidate(ONE_DAY_AGO)])
    );
    expect(checkR3DealsCandidates(snapshot)).not.toBeNull();
  });

  it("returns null when won lead is exactly 7 days ago (at boundary = outside window)", () => {
    const snapshot = makeSnapshot(
      makeSalesSnapshot([makeWonLead(SEVEN_DAYS_AGO_EXACT)]),
      makeHireSnapshot([makeReviewedCandidate(ONE_DAY_AGO)])
    );
    expect(checkR3DealsCandidates(snapshot)).toBeNull();
  });

  it("fires when candidate applied_at is within last 7 days (proxy for reviewed recently)", () => {
    const snapshot = makeSnapshot(
      makeSalesSnapshot([makeWonLead(ONE_DAY_AGO)]),
      makeHireSnapshot([makeReviewedCandidate(SIX_DAYS_AGO)])
    );
    expect(checkR3DealsCandidates(snapshot)).not.toBeNull();
  });

  it("does not fire when lead status is not 'won' (e.g. 'qualified')", () => {
    const qualifiedLead: Lead = { ...makeWonLead(ONE_DAY_AGO), status: "qualified" };
    const snapshot = makeSnapshot(
      makeSalesSnapshot([qualifiedLead]),
      makeHireSnapshot([makeReviewedCandidate(ONE_DAY_AGO)])
    );
    expect(checkR3DealsCandidates(snapshot)).toBeNull();
  });
});
