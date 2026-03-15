import { describe, it, expect } from "vitest";
import { isHotLead, HOT_STAGES } from "./types";
import type { Lead } from "../sales-types";

// Helper to create a minimal Lead with only the fields isHotLead needs
function makeLead(status: Lead["status"]): Lead {
  return {
    id: "test-id",
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
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  };
}

describe("isHotLead", () => {
  describe("returns true for hot stages", () => {
    it("returns true for status 'qualified'", () => {
      expect(isHotLead(makeLead("qualified"))).toBe(true);
    });

    it("returns true for status 'contacted'", () => {
      expect(isHotLead(makeLead("contacted"))).toBe(true);
    });

    it("returns true for status 'demo'", () => {
      expect(isHotLead(makeLead("demo"))).toBe(true);
    });

    it("returns true for status 'proposal'", () => {
      expect(isHotLead(makeLead("proposal"))).toBe(true);
    });

    it("returns true for status 'negotiation'", () => {
      expect(isHotLead(makeLead("negotiation"))).toBe(true);
    });
  });

  describe("returns false for non-hot stages", () => {
    it("returns false for status 'new' (unqualified)", () => {
      expect(isHotLead(makeLead("new"))).toBe(false);
    });

    it("returns false for status 'won' (resolved)", () => {
      expect(isHotLead(makeLead("won"))).toBe(false);
    });

    it("returns false for status 'lost' (resolved)", () => {
      expect(isHotLead(makeLead("lost"))).toBe(false);
    });

    it("returns false for status 'nurture' (resolved)", () => {
      expect(isHotLead(makeLead("nurture"))).toBe(false);
    });
  });

  describe("HOT_STAGES constant", () => {
    it("includes exactly the 5 hot stages", () => {
      const expected = ["qualified", "contacted", "demo", "proposal", "negotiation"];
      expect(HOT_STAGES).toEqual(expected);
    });

    it("does not include 'new'", () => {
      expect(HOT_STAGES).not.toContain("new");
    });

    it("does not include 'won'", () => {
      expect(HOT_STAGES).not.toContain("won");
    });

    it("does not include 'lost'", () => {
      expect(HOT_STAGES).not.toContain("lost");
    });

    it("does not include 'nurture'", () => {
      expect(HOT_STAGES).not.toContain("nurture");
    });
  });
});
