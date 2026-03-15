"use client";

import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { leads, type LeadStage } from "@/lib/mock-data";

const stageConfig: Record<LeadStage, { label: string; color: string; border: string }> = {
  new: { label: "New", color: "text-accent-blue", border: "border-accent-blue/20" },
  contacted: { label: "Contacted", color: "text-accent-amber", border: "border-accent-amber/20" },
  demo: { label: "Demo", color: "text-accent-orange", border: "border-accent-orange/20" },
  won: { label: "Won", color: "text-accent-green", border: "border-accent-green/20" },
  lost: { label: "Lost", color: "text-text-muted", border: "border-text-muted/20" },
};

const stages: LeadStage[] = ["new", "contacted", "demo", "won", "lost"];

export default function LeadPipeline() {
  const totalValue = leads
    .filter((l) => l.stage !== "lost")
    .reduce((sum, l) => sum + l.value, 0);

  return (
    <div className="card">
      <div className="flex items-center gap-2.5 mb-1">
        <DollarSign className="w-5 h-5 text-accent-orange" />
        <h2 className="text-sm font-semibold text-text-primary">Lead Pipeline</h2>
        <span className="text-[11px] text-text-muted ml-auto">
          <span className="font-mono">${totalValue.toLocaleString()}</span> pipeline
        </span>
      </div>

      <div className="space-y-4 mt-4 card-scroll">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage);
          if (stageLeads.length === 0) return null;
          const config = stageConfig[stage];
          return (
            <div key={stage}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("text-[10px] font-medium uppercase tracking-wider", config.color)}>
                  {config.label}
                </span>
                <span className="text-[10px] text-text-muted">({stageLeads.length})</span>
              </div>
              <div className="space-y-1.5">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl bg-surface-elevated/30 border-l-2",
                      config.border
                    )}
                  >
                    <div>
                      <p className="text-[13px] text-text-primary font-medium">{lead.name}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">{lead.school}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-mono text-text-primary">
                        ${lead.value.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-text-muted mt-0.5">{lead.lastContact}</p>
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
