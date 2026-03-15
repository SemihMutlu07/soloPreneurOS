import { NextResponse } from "next/server";
import { buildCrossModuleSnapshot } from "@/lib/intelligence/data-aggregator";
import { runRuleEngine } from "@/lib/intelligence/rule-engine";
import { persistInsights } from "@/lib/persist-insights";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = {
    insights_generated: 0,
    insights_upserted: 0,
    errors: [] as string[],
  };

  try {
    // Step 1: Aggregate cross-module snapshot
    const snapshot = await buildCrossModuleSnapshot();
    if (snapshot.errors.length > 0) {
      result.errors.push(...snapshot.errors);
    }

    // Step 2: Run rule engine against snapshot
    const candidates = await runRuleEngine(snapshot);
    result.insights_generated = candidates.length;

    // Step 3: Persist candidates to cross_module_insights table
    const persistResult = await persistInsights(candidates);
    result.insights_upserted = persistResult.upserted;
    if (persistResult.errors.length > 0) {
      result.errors.push(...persistResult.errors);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, ...result }, { status: 500 });
  }

  return NextResponse.json(result);
}
