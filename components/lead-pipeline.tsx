"use client";

import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { leads, type LeadStage } from "@/lib/mock-data";

const stageConfig: Record<LeadStage, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-accent-blue", bg: "border-accent-blue/30" },
  contacted: { label: "Contacted", color: "text-accent-amber", bg: "border-accent-amber/30" },
  demo: { label: "Demo", color: "text-purple-400", bg: "border-purple-400/30" },
  won: { label: "Won", color: "text-accent-green", bg: "border-accent-green/30" },
  lost: { label: "Lost", color: "text-text-muted", bg: "border-text-muted/30" },
};

const stages: LeadStage[] = ["new", "contacted", "demo", "won", "lost"];

export default function LeadPipeline() {
  const totalValue = leads
    .filter((l) => l.stage !== "lost")
    .reduce((sum, l) => sum + l.value, 0);

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="w-5 h-5 text-accent-green" />
        <h2 className="text-lg font-semibold font-mono">Lead Pipeline</h2>
        <span className="text-xs text-text-muted ml-auto">
          ${totalValue.toLocaleString()} pipeline
        </span>
      </div>

      <div className="space-y-4 mt-4">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage);
          if (stageLeads.length === 0) return null;
          const config = stageConfig[stage];
          return (
            <div key={stage}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("text-xs font-medium uppercase tracking-wider", config.color)}>
                  {config.label}
                </span>
                <span className="text-xs text-text-muted">({stageLeads.length})</span>
              </div>
              <div className="space-y-1.5">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg bg-bg/50 border-l-2",
                      config.bg
                    )}
                  >
                    <div>
                      <p className="text-sm text-text-primary">{lead.name}</p>
                      <p className="text-xs text-text-muted">{lead.school}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-text-primary">
                        ${lead.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-text-muted">{lead.lastContact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
