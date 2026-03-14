"use client";

import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { leads, type LeadStage } from "@/lib/mock-data";

const stageConfig: Record<LeadStage, { label: string; color: string; border: string }> = {
  new: { label: "New", color: "text-blue-400", border: "border-blue-400/20" },
  contacted: { label: "Contacted", color: "text-amber-400", border: "border-amber-400/20" },
  demo: { label: "Demo", color: "text-purple-400", border: "border-purple-400/20" },
  won: { label: "Won", color: "text-emerald-400", border: "border-emerald-400/20" },
  lost: { label: "Lost", color: "text-text-secondary", border: "border-text-muted/20" },
};

const stages: LeadStage[] = ["new", "contacted", "demo", "won", "lost"];

export default function LeadPipeline() {
  const totalValue = leads
    .filter((l) => l.stage !== "lost")
    .reduce((sum, l) => sum + l.value, 0);

  return (
    <div className="card">
      <div className="flex items-center gap-2.5 mb-1">
        <DollarSign className="w-5 h-5 text-accent-teal" />
        <h2 className="text-base font-semibold font-mono text-gray-100">Lead Pipeline</h2>
        <span className="text-xs text-text-secondary ml-auto font-normal">
          ${totalValue.toLocaleString()} pipeline
        </span>
      </div>

      <div className="space-y-5 mt-5">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage);
          if (stageLeads.length === 0) return null;
          const config = stageConfig[stage];
          return (
            <div key={stage}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className={cn("text-xs font-medium uppercase tracking-wider", config.color)}>
                  {config.label}
                </span>
                <span className="text-xs text-text-muted">({stageLeads.length})</span>
              </div>
              <div className="space-y-2">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl bg-surface-elevated/40 border-l-2",
                      config.border
                    )}
                  >
                    <div>
                      <p className="text-sm text-gray-100 font-medium">{lead.name}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{lead.school}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-gray-100">
                        ${lead.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">{lead.lastContact}</p>
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
