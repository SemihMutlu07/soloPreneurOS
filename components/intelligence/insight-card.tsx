"use client";

import { X } from "lucide-react";
import { CrossModuleInsight } from "@/lib/intelligence-types";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  insight: CrossModuleInsight;
  onDismiss: (id: string) => void;
}

function formatFreshness(generatedAt: string): string {
  const diffMs = Date.now() - new Date(generatedAt).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

const severityClasses: Record<CrossModuleInsight["severity"], string> = {
  critical: "bg-accent-red/10 text-accent-red border border-accent-red/20",
  warning: "bg-accent-amber/10 text-accent-amber border border-accent-amber/20",
  info: "bg-accent-blue/10 text-accent-blue border border-accent-blue/20",
};

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const severityLabel =
    insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1);

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4 flex-shrink-0 w-64 relative">
      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(insight.id)}
        className="absolute top-3 right-3 text-text-muted hover:text-text-primary"
        aria-label="Dismiss insight"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Severity badge */}
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
          severityClasses[insight.severity]
        )}
      >
        {severityLabel}
      </span>

      {/* Freshness */}
      <p className="text-xs text-text-muted mt-1">
        generated {formatFreshness(insight.generated_at)}
      </p>

      {/* Evidence */}
      <p className="text-sm text-text-secondary mt-2 line-clamp-3">
        {insight.evidence}
      </p>
    </div>
  );
}
