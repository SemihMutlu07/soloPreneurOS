/**
 * claude-narrative.ts
 *
 * Narrative synthesis module for the LLM orchestrator.
 * Wraps the Anthropic SDK to produce a 2-sentence CEO-briefing narrative
 * from summarized module metrics, then upserts it into cross_module_insights.
 *
 * Isolates all LLM concerns from the cron handler:
 * - Prompt construction
 * - API call with failure isolation (never throws)
 * - Content-addressed ID logic
 * - Upsert to cross_module_insights
 */

import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { InsightCandidate } from "@/lib/intelligence-types";

// ---------------------------------------------------------------------------
// System prompt — embedded in module
// ---------------------------------------------------------------------------

const NARRATIVE_SYSTEM_PROMPT = `You are a trusted advisor giving a solo founder their daily business briefing.
Respond with exactly 2 sentences and nothing else. No preamble, no labels, no markdown.
Sentence 1: synthesize the key cross-module signals from the metrics provided.
Sentence 2: end with one specific actionable recommendation.`;

// ---------------------------------------------------------------------------
// NarrativeMetrics — scalar counts extracted from CrossModuleSnapshot
// by the caller (cron handler or computed inline).
// Using a local interface so buildMetricsText never receives raw arrays.
// ---------------------------------------------------------------------------

export interface NarrativeMetrics {
  hotLeadCount: number;
  runwayDays: number;
  openRoleCount: number;
  overdueInvoiceCount: number;
  daysSinceLastInvoice: number;
}

// ---------------------------------------------------------------------------
// buildMetricsText
// Formats scalar metrics and fired insight evidence into a plain-text prompt.
// NEVER includes raw arrays — only scalar counts and string evidence lines.
// ---------------------------------------------------------------------------

export function buildMetricsText(
  snapshot: NarrativeMetrics,
  firedInsights: InsightCandidate[],
): string {
  const lines = [
    "Business metrics snapshot:",
    `- Hot leads in pipeline: ${snapshot.hotLeadCount}`,
    `- Runway: ${snapshot.runwayDays} days`,
    `- Open roles: ${snapshot.openRoleCount}`,
    `- Overdue invoices: ${snapshot.overdueInvoiceCount}`,
    `- Days since last invoice sent: ${snapshot.daysSinceLastInvoice}`,
    "",
    "Rule patterns that fired today:",
    ...firedInsights.map((i) => `- [${i.severity.toUpperCase()}] ${i.evidence}`),
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// narrativeInsightId
// SHA256("LLM-{calendarDate}") — deterministic content-addressed key.
// Same calendar date always returns the same hex string.
// ---------------------------------------------------------------------------

export function narrativeInsightId(calendarDate: string): string {
  return createHash("sha256").update(`LLM-${calendarDate}`).digest("hex");
}

// ---------------------------------------------------------------------------
// generateNarrative
// Calls Claude to produce a 2-sentence founder briefing.
// NEVER throws — returns "" on any error so rule insights survive API failure.
// Only invoked when at least one rule insight fired (firedInsights.length > 0).
// ---------------------------------------------------------------------------

export async function generateNarrative(
  snapshot: NarrativeMetrics,
  firedInsights: InsightCandidate[],
): Promise<string> {
  if (firedInsights.length === 0) return "";
  try {
    const anthropic = new Anthropic();
    const metricsText = buildMetricsText(snapshot, firedInsights);
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: NARRATIVE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: metricsText }],
    });
    return response.content[0].type === "text"
      ? response.content[0].text.trim()
      : "";
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// upsertNarrativeInsight
// Upserts the narrative as a cross_module_insights row with rule_id="LLM".
// Accepts the Supabase client as a parameter (injected by cron — easier to test).
// dismissed_at is intentionally omitted from the payload to preserve dismissed state.
// ---------------------------------------------------------------------------

export async function upsertNarrativeInsight(
  supabase: SupabaseClient,
  narrativeText: string,
  calendarDate: string,
): Promise<void> {
  const id = narrativeInsightId(calendarDate);
  await supabase.from("cross_module_insights").upsert(
    {
      id,
      rule_id: "LLM",
      severity: "info",
      module_tags: ["sales", "finance", "hire"],
      evidence: narrativeText,
      generated_at: new Date().toISOString(),
      // dismissed_at intentionally omitted — preserves dismissed state
    },
    { onConflict: "id", ignoreDuplicates: false },
  );
}
