import { createAdminClient } from "@/lib/supabase/admin";
import { buildCrossModuleSnapshot } from "@/lib/intelligence/data-aggregator";
import { runRuleEngine } from "@/lib/intelligence/rule-engine";
import { persistInsights } from "@/lib/persist-insights";
import {
  generateNarrative,
  upsertNarrativeInsight,
} from "@/lib/claude-narrative";
import type { NarrativeMetrics } from "@/lib/claude-narrative";
import { isHotLead } from "@/lib/intelligence/types";

export interface PipelineResult {
  insights_generated: number;
  insights_upserted: number;
  narrative_generated: boolean;
  errors: string[];
}

export async function runIntelligencePipeline(): Promise<PipelineResult> {
  const result: PipelineResult = {
    insights_generated: 0,
    insights_upserted: 0,
    narrative_generated: false,
    errors: [],
  };

  // Step 1: aggregate
  const snapshot = await buildCrossModuleSnapshot();
  if (snapshot.errors.length > 0) {
    result.errors.push(...snapshot.errors);
  }

  // Step 2: rules
  const candidates = await runRuleEngine(snapshot);
  result.insights_generated = candidates.length;

  // Step 3: persist
  const persistResult = await persistInsights(candidates);
  result.insights_upserted = persistResult.upserted;
  result.errors.push(...persistResult.errors);

  // Step 4: LLM narrative — only invoke when at least one rule fired
  const calendarDate = new Date().toISOString().slice(0, 10);
  if (candidates.length > 0) {
    try {
      // Compute scalar NarrativeMetrics from CrossModuleSnapshot
      const metrics: NarrativeMetrics = {
        hotLeadCount: snapshot.sales
          ? snapshot.sales.leads.filter(isHotLead).length
          : 0,
        runwayDays: snapshot.finance?.runway
          ? Math.round(snapshot.finance.runway.runway_months * 30)
          : 0,
        openRoleCount: snapshot.hire ? snapshot.hire.roles.length : 0,
        overdueInvoiceCount: snapshot.finance
          ? snapshot.finance.invoices.filter((inv) => inv.status === "gecmis")
              .length
          : 0,
        daysSinceLastInvoice: (() => {
          if (!snapshot.finance || snapshot.finance.invoices.length === 0) {
            return 0;
          }
          const mostRecentMs = snapshot.finance.invoices.reduce(
            (latest, inv) =>
              Math.max(latest, new Date(inv.created_at).getTime()),
            0,
          );
          return Math.floor((Date.now() - mostRecentMs) / (24 * 60 * 60 * 1000));
        })(),
      };

      const narrative = await generateNarrative(metrics, candidates);
      if (narrative) {
        const supabase = createAdminClient();
        await upsertNarrativeInsight(supabase, narrative, calendarDate);
        result.narrative_generated = true;
      }
    } catch (err) {
      // Silent — rule insights are already persisted; LLM failure must not propagate
      const message = err instanceof Error ? err.message : "Unknown error";
      result.errors.push(`Narrative generation skipped: ${message}`);
    }
  }

  return result;
}
