import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkR5CandidateStall } from "./r5-candidate-stall";
import type {
  CrossModuleSnapshot,
  HireSnapshot,
} from "@/lib/intelligence/types";
import type { CandidateWithEvaluation, Role } from "@/lib/hiring-types";

// ---------------------------------------------------------------------------
// Test factories
// ---------------------------------------------------------------------------

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const NOW = new Date("2026-03-15T00:00:00Z").getTime();

function makeCandidate(
  status: CandidateWithEvaluation["status"],
  appliedAt: string,
  id = "cand-1"
): CandidateWithEvaluation {
  return {
    id,
    name: "Test Candidate",
    email: "test@example.com",
    role: "Engineer",
    applied_at: appliedAt,
    pdf_url: "https://example.com/cv.pdf",
    status,
    previous_application_id: null,
    gmail_message_id: null,
    created_at: appliedAt,
    evaluation: null,
  };
}

function makeRole(active: boolean, id = "role-1"): Role {
  return {
    id,
    title: "Software Engineer",
    rubric: "test rubric",
    task: "test task",
    active,
    created_at: "2026-01-01T00:00:00Z",
  };
}

function makeHireSnapshot(
  candidates: CandidateWithEvaluation[],
  roles: Role[]
): HireSnapshot {
  return { candidates, roles };
}

function makeSnapshot(hire: HireSnapshot | null): CrossModuleSnapshot {
  return {
    hire,
    sales: null,
    finance: null,
    errors: [],
    generated_at: "2026-03-15T00:00:00Z",
  };
}

// ISO string for a date that is stale (8 days ago)
const STALE_DATE = new Date(NOW - 8 * 24 * 60 * 60 * 1000).toISOString();
// ISO string for a date that is fresh (3 days ago)
const FRESH_DATE = new Date(NOW - 3 * 24 * 60 * 60 * 1000).toISOString();
// ISO string for exactly 7 days ago (not stale — must be strictly > 7 days)
const EXACTLY_SEVEN_DAYS = new Date(NOW - SEVEN_DAYS_MS).toISOString();

// ---------------------------------------------------------------------------
// R5: checkR5CandidateStall
// ---------------------------------------------------------------------------

describe("checkR5CandidateStall", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when snapshot.hire is null", () => {
    const snapshot = makeSnapshot(null);
    expect(checkR5CandidateStall(snapshot)).toBeNull();
  });

  it("returns null when there are no active roles", () => {
    const hire = makeHireSnapshot(
      [makeCandidate("pending", STALE_DATE)],
      [makeRole(false)]
    );
    const snapshot = makeSnapshot(hire);
    expect(checkR5CandidateStall(snapshot)).toBeNull();
  });

  it("returns null when all candidates have status 'reviewed'", () => {
    const hire = makeHireSnapshot(
      [makeCandidate("reviewed", STALE_DATE)],
      [makeRole(true)]
    );
    const snapshot = makeSnapshot(hire);
    expect(checkR5CandidateStall(snapshot)).toBeNull();
  });

  it("returns null when no candidate has applied_at > 7 days ago", () => {
    // Fresh pending candidate — not stalled
    const hire = makeHireSnapshot(
      [makeCandidate("pending", FRESH_DATE)],
      [makeRole(true)]
    );
    const snapshot = makeSnapshot(hire);
    expect(checkR5CandidateStall(snapshot)).toBeNull();
  });

  it("returns null when candidate is exactly 7 days old (not strictly > 7 days)", () => {
    const hire = makeHireSnapshot(
      [makeCandidate("pending", EXACTLY_SEVEN_DAYS)],
      [makeRole(true)]
    );
    const snapshot = makeSnapshot(hire);
    expect(checkR5CandidateStall(snapshot)).toBeNull();
  });

  it("returns null when candidate arrays are empty", () => {
    const hire = makeHireSnapshot([], [makeRole(true)]);
    const snapshot = makeSnapshot(hire);
    expect(checkR5CandidateStall(snapshot)).toBeNull();
  });

  it("fires when 1 'pending' candidate is stalled > 7 days AND active role exists", () => {
    const hire = makeHireSnapshot(
      [makeCandidate("pending", STALE_DATE)],
      [makeRole(true)]
    );
    const snapshot = makeSnapshot(hire);
    const result = checkR5CandidateStall(snapshot);
    expect(result).not.toBeNull();
    expect(result!.rule_id).toBe("R5");
    expect(result!.severity).toBe("warning");
    expect(result!.module_tags).toEqual(["hire"]);
    expect(result!.evidence).toContain("1 candidate");
    expect(result!.evidence).toContain("7+ days");
    expect(result!.evidence).toContain("1 open role");
    expect(result!.generated_at).toBeTruthy();
  });

  it("fires when 1 'analyzed' candidate is stalled > 7 days AND active role exists", () => {
    const hire = makeHireSnapshot(
      [makeCandidate("analyzed", STALE_DATE)],
      [makeRole(true)]
    );
    const snapshot = makeSnapshot(hire);
    const result = checkR5CandidateStall(snapshot);
    expect(result).not.toBeNull();
    expect(result!.rule_id).toBe("R5");
    expect(result!.evidence).toContain("1 candidate");
  });

  it("counts multiple stalled candidates correctly", () => {
    const hire = makeHireSnapshot(
      [
        makeCandidate("pending", STALE_DATE, "c1"),
        makeCandidate("analyzed", STALE_DATE, "c2"),
        makeCandidate("pending", STALE_DATE, "c3"),
      ],
      [makeRole(true, "r1"), makeRole(true, "r2")]
    );
    const snapshot = makeSnapshot(hire);
    const result = checkR5CandidateStall(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toContain("3 candidate");
    expect(result!.evidence).toContain("2 open role");
  });

  it("ignores reviewed candidates even if stale — only counts pending/analyzed", () => {
    const hire = makeHireSnapshot(
      [
        makeCandidate("reviewed", STALE_DATE, "c1"),
        makeCandidate("pending", FRESH_DATE, "c2"),
      ],
      [makeRole(true)]
    );
    const snapshot = makeSnapshot(hire);
    expect(checkR5CandidateStall(snapshot)).toBeNull();
  });

  it("fires even when some candidates are fresh — stalled ones trigger the rule", () => {
    const hire = makeHireSnapshot(
      [
        makeCandidate("pending", STALE_DATE, "c1"),
        makeCandidate("pending", FRESH_DATE, "c2"),
      ],
      [makeRole(true)]
    );
    const snapshot = makeSnapshot(hire);
    const result = checkR5CandidateStall(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toContain("1 candidate");
  });
});
