"use client";

import { Radar, ArrowUpRight, TrendingUp, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { externalSignals, type ExternalSignal } from "@/lib/mock-data";

const sourceConfig: Record<ExternalSignal["source"], { icon: typeof Radar; color: string; label: string }> = {
  "product-hunt": { icon: ArrowUpRight, color: "text-orange-400", label: "Product Hunt" },
  reddit: { icon: MessageCircle, color: "text-orange-500", label: "Reddit" },
  "google-trends": { icon: TrendingUp, color: "text-blue-400", label: "Google Trends" },
  twitter: { icon: MessageCircle, color: "text-sky-400", label: "X / Twitter" },
};

export default function ExternalSignals() {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Radar className="w-5 h-5 text-accent-green" />
        <h2 className="text-lg font-semibold font-mono">External Signals</h2>
      </div>
      <div className="space-y-3">
        {externalSignals.map((signal) => {
          const config = sourceConfig[signal.source];
          const Icon = config.icon;
          return (
            <div key={signal.id} className="p-3 rounded-lg bg-bg/50 hover:bg-surface-hover transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn("w-4 h-4", config.color)} />
                <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
                <span className="text-xs text-text-muted ml-auto">{signal.timestamp}</span>
              </div>
              <p className="text-sm font-medium text-text-primary">{signal.title}</p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">{signal.summary}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-text-muted" />
                <span className="text-xs text-text-muted">Score: {signal.score}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
