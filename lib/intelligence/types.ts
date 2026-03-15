import type { Lead, LeadActivity } from "@/lib/sales-types";
import type { CandidateWithEvaluation, Role } from "@/lib/hiring-types";
import type { Invoice, Expense, RunwayData } from "@/lib/finance-types";

// ---------------------------------------------------------------------------
// Hot-lead helper
// ---------------------------------------------------------------------------

/**
 * Pipeline stages that represent active, in-progress leads.
 * Excludes "new" (unqualified) and "won"/"lost"/"nurture" (resolved).
 */
export const HOT_STAGES = [
  "qualified",
  "contacted",
  "demo",
  "proposal",
  "negotiation",
] as const;

export type HotStage = (typeof HOT_STAGES)[number];

/**
 * Returns true when a lead is in an active pipeline stage worth monitoring.
 * Uses Lead.status (canonical Supabase field) — NOT SalesLead.stage.
 */
export function isHotLead(lead: Lead): boolean {
  return (HOT_STAGES as readonly string[]).includes(lead.status);
}

// ---------------------------------------------------------------------------
// Rule output type
// ---------------------------------------------------------------------------

export type RuleSeverity = "critical" | "warning" | "info";

export interface RuleInsight {
  /** Short rule identifier, e.g. "R1", "R2". Required — used for content-addressed dedup in Phase 4. */
  rule_id: string;
  severity: RuleSeverity;
  /** Human-readable explanation, e.g. "3 hot leads stalled, runway at 42 days" */
  evidence: string;
  /** Module names this insight touches, e.g. ["sales", "finance"] */
  module_tags: string[];
  /** ISO timestamp when the insight was generated */
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Snapshot types (CrossModuleSnapshot input)
// ---------------------------------------------------------------------------

export interface SalesSnapshot {
  leads: Lead[];
  recent_activity: LeadActivity[];
}

export interface HireSnapshot {
  candidates: CandidateWithEvaluation[];
  roles: Role[];
}

export interface FinanceSnapshot {
  invoices: Invoice[];
  expenses: Expense[];
  runway: RunwayData | null;
}

/**
 * Aggregated view of all module data passed to each rule function.
 * Any module snapshot may be null when that module's data fetch fails.
 * errors is always a string[] — never null/undefined.
 */
export interface CrossModuleSnapshot {
  /** null = Supabase query failed for this module */
  sales: SalesSnapshot | null;
  /** null = Supabase query failed for this module */
  hire: HireSnapshot | null;
  /** null = Supabase query failed for this module */
  finance: FinanceSnapshot | null;
  /** One entry per failed module, e.g. "finance: query failed — timeout" */
  errors: string[];
  /** ISO string set when the aggregator runs */
  generated_at: string;
}
