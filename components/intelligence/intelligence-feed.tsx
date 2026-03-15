"use client";

import { useCallback, useEffect, useState } from "react";
import { Brain, X } from "lucide-react";
import AgentCardWrapper from "@/components/agents/agent-card-wrapper";
import { InsightCard } from "./insight-card";
import { CrossModuleInsight } from "@/lib/intelligence-types";

function formatFreshnessLabel(generatedAt: string): string {
  const diffMs = Date.now() - new Date(generatedAt).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export default function IntelligenceFeed() {
  const [insights, setInsights] = useState<CrossModuleInsight[]>([]);
  const [status, setStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | undefined>(undefined);

  const fetchInsights = useCallback(async () => {
    const res = await fetch("/api/intelligence/insights");
    if (!res.ok) throw new Error("Failed to fetch insights");
    const data: CrossModuleInsight[] = await res.json();
    setInsights(data);
  }, []);

  useEffect(() => {
    fetchInsights().catch((err) =>
      setError(
        err instanceof Error ? err.message : "Failed to load insights"
      )
    );
  }, [fetchInsights]);

  const handleRefresh = useCallback(async () => {
    setStatus("running");
    setError(null);
    try {
      await fetch("/api/intelligence/trigger", { method: "POST" });
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await fetchInsights();
      setLastRun(new Date().toISOString());
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
      setStatus("error");
    }
  }, [fetchInsights]);

  const handleDismiss = useCallback(async (id: string) => {
    const res = await fetch("/api/intelligence/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.status === 204) {
      setInsights((prev) => prev.filter((ins) => ins.id !== id));
    }
  }, []);

  const narrativeInsight =
    insights.find((ins) => ins.rule_id === "LLM") ?? null;
  const ruleInsights = insights.filter((ins) => ins.rule_id !== "LLM");

  return (
    <AgentCardWrapper
      agentId="intelligence-feed"
      agentName="Cross-Module Intelligence"
      icon={<Brain className="w-5 h-5 text-accent-orange" />}
      status={status}
      lastRun={lastRun}
      onRun={handleRefresh}
    >
      {error && (
        <div className="p-3 rounded-xl bg-accent-red/5 text-accent-red text-sm border border-accent-red/10 mb-4">
          {error}
        </div>
      )}

      {status === "running" ? (
        /* Skeleton: 3 skeleton cards in a flex row */
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 h-32 rounded-xl bg-surface-elevated/30 animate-pulse"
            >
              <div className="p-4 space-y-3">
                <div className="h-3 bg-surface-hover rounded w-1/3" />
                <div className="h-3 bg-surface-hover rounded w-full" />
                <div className="h-3 bg-surface-hover rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : insights.length === 0 ? (
        /* Empty state */
        <p className="text-sm text-text-muted py-4 text-center">
          No cross-module patterns detected
        </p>
      ) : (
        <div className="space-y-4">
          {/* Narrative card — visually elevated */}
          {narrativeInsight && (
            <div className="rounded-xl border border-accent-orange/20 bg-accent-orange/5 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-accent-orange flex-shrink-0" />
                  <span className="text-xs font-medium text-accent-orange uppercase tracking-wider">
                    AI Summary
                  </span>
                </div>
                <button
                  onClick={() => handleDismiss(narrativeInsight.id)}
                  className="text-text-muted hover:text-text-primary"
                  aria-label="Dismiss AI summary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-text-primary">
                {narrativeInsight.evidence}
              </p>
              <p className="text-xs text-text-muted mt-2">
                {formatFreshnessLabel(narrativeInsight.generated_at)}
              </p>
            </div>
          )}

          {/* Rule insight cards — horizontal scroll row */}
          {ruleInsights.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {ruleInsights.map((ins) => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </AgentCardWrapper>
  );
}
