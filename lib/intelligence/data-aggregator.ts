import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CrossModuleSnapshot,
  SalesSnapshot,
  HireSnapshot,
  FinanceSnapshot,
} from "./types";
import type { CandidateWithEvaluation, Role } from "@/lib/hiring-types";

// Active lead statuses — positive-include list (avoids tricky .not().in() quoting issues)
const ACTIVE_LEAD_STATUSES = [
  "new",
  "qualified",
  "contacted",
  "demo",
  "proposal",
  "negotiation",
  "nurture",
] as const;

async function fetchSalesModule(supabase: SupabaseClient): Promise<SalesSnapshot> {
  const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("*")
    .in("status", ACTIVE_LEAD_STATUSES);
  if (leadsError) throw leadsError;

  const { data: activities, error: activitiesError } = await supabase
    .from("lead_activities")
    .select("*")
    .gte("created_at", cutoff30d);
  if (activitiesError) throw activitiesError;

  return { leads: leads ?? [], recent_activity: activities ?? [] };
}

async function fetchHiringModule(supabase: SupabaseClient): Promise<HireSnapshot> {
  const { data: candidates, error: candidatesError } = await supabase
    .from("candidates")
    .select("*")
    .in("status", ["pending", "analyzed"]);
  if (candidatesError) throw candidatesError;

  const candidateIds = (candidates ?? []).map((c) => c.id);

  // Guard: skip evaluations query if no candidates (empty .in() behaves unpredictably)
  const { data: evaluations, error: evalError } =
    candidateIds.length > 0
      ? await supabase
          .from("evaluations")
          .select("*")
          .in("candidate_id", candidateIds)
      : { data: [], error: null };
  if (evalError) throw evalError;

  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("*")
    .eq("active", true);
  if (rolesError) throw rolesError;

  const candidatesWithEval: CandidateWithEvaluation[] = (candidates ?? []).map((c) => ({
    ...c,
    evaluation: (evaluations ?? []).find((e) => e.candidate_id === c.id) ?? null,
  }));

  return { candidates: candidatesWithEval, roles: (roles ?? []) as Role[] };
}

async function fetchFinanceModule(supabase: SupabaseClient): Promise<FinanceSnapshot> {
  const cutoff90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [invoicesResult, expensesResult] = await Promise.all([
    supabase.from("invoices").select("*").gte("created_at", cutoff90d),
    // Use `date` column for expenses — represents when expense occurred, not row creation
    supabase.from("expenses").select("*").gte("date", cutoff90d),
  ]);
  if (invoicesResult.error) throw invoicesResult.error;
  if (expensesResult.error) throw expensesResult.error;

  // Runway is non-fatal — failure returns runway: null, does NOT cause finance module to fail
  let runway = null;
  try {
    const { data } = await supabase
      .from("runway_data")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1);
    runway = data?.[0] ?? null;
  } catch {
    // Non-fatal: runway unavailable. Rules that need it check for null.
  }

  return {
    invoices: invoicesResult.data ?? [],
    expenses: expensesResult.data ?? [],
    runway,
  };
}

/**
 * Aggregates Sales, Hiring, and Finance data from Supabase into a single
 * CrossModuleSnapshot for the rule engine and LLM orchestrator.
 *
 * Contract:
 * - All three module fetches run in parallel via Promise.allSettled
 * - Any single module failure sets that module to null + appends to errors[]
 * - This function NEVER throws — it always returns a CrossModuleSnapshot
 * - Zero-record modules return empty arrays, not null
 */
export async function buildCrossModuleSnapshot(): Promise<CrossModuleSnapshot> {
  const supabase = createAdminClient();
  const errors: string[] = [];
  const generated_at = new Date().toISOString();

  const [salesResult, hireResult, financeResult] = await Promise.allSettled([
    fetchSalesModule(supabase),
    fetchHiringModule(supabase),
    fetchFinanceModule(supabase),
  ]);

  const sales = salesResult.status === "fulfilled" ? salesResult.value : null;
  if (salesResult.status === "rejected") {
    errors.push(`sales: ${(salesResult.reason as Error)?.message ?? "unknown error"}`);
  }

  const hire = hireResult.status === "fulfilled" ? hireResult.value : null;
  if (hireResult.status === "rejected") {
    errors.push(`hire: ${(hireResult.reason as Error)?.message ?? "unknown error"}`);
  }

  const finance = financeResult.status === "fulfilled" ? financeResult.value : null;
  if (financeResult.status === "rejected") {
    errors.push(
      `finance: ${(financeResult.reason as Error)?.message ?? "unknown error"}`,
    );
  }

  return { generated_at, sales, hire, finance, errors };
}
