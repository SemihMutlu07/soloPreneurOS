import { buildCrossModuleSnapshot } from "@/lib/intelligence/data-aggregator";
import { runRuleEngine } from "@/lib/intelligence/rule-engine";
import { persistInsights } from "@/lib/persist-insights";

export interface PipelineResult {
  insights_generated: number;
  insights_upserted: number;
  errors: string[];
}

export async function runIntelligencePipeline(): Promise<PipelineResult> {
  const result: PipelineResult = {
    insights_generated: 0,
    insights_upserted: 0,
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

  return result;
}
