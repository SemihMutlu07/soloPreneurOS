import { describe, it, expect } from "vitest";
import { checkR2HireRunway } from "./r2-hire-runway";
import type { CrossModuleSnapshot, FinanceSnapshot, HireSnapshot } from "@/lib/intelligence/types";
import type { Role } from "@/lib/hiring-types";
import type { RunwayData } from "@/lib/finance-types";

// ---------------------------------------------------------------------------
// Test factories
// ---------------------------------------------------------------------------

function makeRunway(runway_months: number): RunwayData {
  return { cash_tl: 100000, cash_usd: 0, monthly_burn: 10000, runway_months };
}

function makeRole(active: boolean, id = "role-1"): Role {
  return {
    id,
    title: "Senior Engineer",
    rubric: "Technical skills",
    task: "Build features",
    active,
    created_at: "2026-01-01T00:00:00Z",
  };
}

function makeHireSnapshot(roles: Role[]): HireSnapshot {
  return { candidates: [], roles };
}

function makeFinanceSnapshot(runway: RunwayData | null): FinanceSnapshot {
  return { invoices: [], expenses: [], runway };
}

function makeSnapshot(
  finance: FinanceSnapshot | null,
  hire: HireSnapshot | null
): CrossModuleSnapshot {
  return {
    finance,
    sales: null,
    hire,
    errors: [],
    generated_at: "2026-03-15T00:00:00Z",
  };
}

// ---------------------------------------------------------------------------
// R2: checkR2HireRunway
// ---------------------------------------------------------------------------

describe("checkR2HireRunway", () => {
  it("returns null when snapshot.finance is null", () => {
    const snapshot = makeSnapshot(null, makeHireSnapshot([makeRole(true)]));
    expect(checkR2HireRunway(snapshot)).toBeNull();
  });

  it("returns null when snapshot.hire is null", () => {
    const snapshot = makeSnapshot(makeFinanceSnapshot(makeRunway(1)), null);
    expect(checkR2HireRunway(snapshot)).toBeNull();
  });

  it("returns null when finance.runway is null", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(null),
      makeHireSnapshot([makeRole(true)])
    );
    expect(checkR2HireRunway(snapshot)).toBeNull();
  });

  it("returns null when runway >= 90 days (3 months) even with active roles", () => {
    // 3 months * 30 = 90 days — exactly at threshold, should be null (>= 90)
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(3)),
      makeHireSnapshot([makeRole(true)])
    );
    expect(checkR2HireRunway(snapshot)).toBeNull();
  });

  it("returns null when runway > 90 days (4 months) with active roles", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(4)),
      makeHireSnapshot([makeRole(true)])
    );
    expect(checkR2HireRunway(snapshot)).toBeNull();
  });

  it("returns null when runway < 90 days but no active roles", () => {
    // 2 months = 60 days < 90, but all roles are inactive
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(2)),
      makeHireSnapshot([makeRole(false), makeRole(false, "role-2")])
    );
    expect(checkR2HireRunway(snapshot)).toBeNull();
  });

  it("returns null when runway < 90 days but roles array is empty", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(2)),
      makeHireSnapshot([])
    );
    expect(checkR2HireRunway(snapshot)).toBeNull();
  });

  it("fires when runway < 90 days (2 months = 60 days) AND 1 active role", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(2)),
      makeHireSnapshot([makeRole(true)])
    );
    const result = checkR2HireRunway(snapshot);
    expect(result).not.toBeNull();
    expect(result!.rule_id).toBe("R2");
    expect(result!.severity).toBe("warning");
    expect(result!.module_tags).toEqual(["hire", "finance"]);
    expect(result!.evidence).toContain("1 open role");
    expect(result!.evidence).toContain("60 days");
    expect(result!.generated_at).toBeTruthy();
  });

  it("fires when runway < 90 days AND multiple active roles exist", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(2)),
      makeHireSnapshot([makeRole(true, "r1"), makeRole(true, "r2"), makeRole(true, "r3")])
    );
    const result = checkR2HireRunway(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toContain("3 open role");
  });

  it("counts only active roles in evidence (excludes inactive roles)", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(2)),
      makeHireSnapshot([
        makeRole(true, "active-1"),
        makeRole(false, "inactive-1"),
        makeRole(false, "inactive-2"),
      ])
    );
    const result = checkR2HireRunway(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toContain("1 open role");
  });

  it("fires when runway is just under 90 days (2.9 months = 87 days)", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(2.9)),
      makeHireSnapshot([makeRole(true)])
    );
    const result = checkR2HireRunway(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toContain("87 days");
  });

  it("includes correct runway days in evidence", () => {
    const snapshot = makeSnapshot(
      makeFinanceSnapshot(makeRunway(1)),
      makeHireSnapshot([makeRole(true)])
    );
    const result = checkR2HireRunway(snapshot);
    expect(result).not.toBeNull();
    expect(result!.evidence).toContain("30 days");
  });
});
