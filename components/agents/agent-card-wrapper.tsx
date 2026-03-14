"use client";

import { cn } from "@/lib/utils";
import { Play, Loader2 } from "lucide-react";

interface AgentCardWrapperProps {
  agentId: string;
  agentName: string;
  icon: React.ReactNode;
  status: "idle" | "running" | "success" | "error" | "coming-soon";
  lastRun?: string;
  onRun?: () => void;
  comingSoon?: boolean;
  children: React.ReactNode;
}

function formatLastRun(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timestamp;
  }
}

const statusConfig = {
  idle: { label: "Ready", dotClass: "bg-text-muted" },
  running: { label: "Running...", dotClass: "bg-accent-teal animate-soft-pulse" },
  success: { label: "Ready", dotClass: "bg-accent-green" },
  error: { label: "Error", dotClass: "bg-accent-red" },
  "coming-soon": { label: "Coming Soon", dotClass: "bg-text-muted" },
};

export default function AgentCardWrapper({
  agentId,
  agentName,
  icon,
  status,
  lastRun,
  onRun,
  comingSoon,
  children,
}: AgentCardWrapperProps) {
  const { label, dotClass } = statusConfig[status];

  return (
    <div
      className={cn("card", comingSoon && "opacity-50")}
      data-agent-id={agentId}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {icon}
          <h2 className="text-sm font-semibold text-text-primary">
            {agentName}
          </h2>
          <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
            {status === "running" ? (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                {label}
              </span>
            ) : (
              label
            )}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastRun && (
            <span className="text-[11px] text-text-muted font-mono">
              {formatLastRun(lastRun)}
            </span>
          )}
          {onRun && !comingSoon && (
            <button
              onClick={onRun}
              disabled={status === "running"}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-accent-teal/8 text-accent-teal hover:bg-accent-teal/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "running" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              Run
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
