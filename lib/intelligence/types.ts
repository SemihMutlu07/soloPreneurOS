import type { Lead, LeadActivity } from "@/lib/sales-types";
import type { CandidateWithEvaluation } from "@/lib/hiring-types";
import type { Invoice, Expense, RunwayData } from "@/lib/finance-types";

/** Pipeline stages that indicate an actively pursued lead */
export const HOT_STAGES = [
  "qualified",
  "contacted",
  "demo",
  "proposal",
  "negotiation",
] as const;

export type HotStage = (typeof HOT_STAGES)[number];

/** Returns true if the lead is in an actively pursued pipeline stage */
export function isHotLead(lead: Lead): boolean {
  return (HOT_STAGES as readonly string[]).includes(lead.status);
}

export interface SalesSnapshot {
  leads: Lead[];
  activities: LeadActivity[];
}

export interface HiringSnapshot {
  candidates: CandidateWithEvaluation[];
}

export interface FinanceSnapshot {
  invoices: Invoice[];
  expenses: Expense[];
  runway: RunwayData | null;
}

export interface CrossModuleSnapshot {
  /** ISO string set when the aggregator runs */
  timestamp: string;
  /** null = Supabase query failed for this module */
  sales: SalesSnapshot | null;
  /** null = Supabase query failed for this module */
  hiring: HiringSnapshot | null;
  /** null = Supabase query failed for this module */
  finance: FinanceSnapshot | null;
  /** One entry per failed module, e.g. "finance: query failed — timeout" */
  errors: string[];
}
