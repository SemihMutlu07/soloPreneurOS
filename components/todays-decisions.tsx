"use client";

import { useState } from "react";
import { GitBranch, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { todaysDecisions, type Decision } from "@/lib/mock-data";

export default function TodaysDecisions() {
  const [decisions, setDecisions] = useState<Decision[]>(todaysDecisions);

  function selectOption(decisionId: string, optionIndex: number) {
    setDecisions((prev) =>
      prev.map((d) =>
        d.id === decisionId ? { ...d, selectedOption: optionIndex } : d
      )
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-5 h-5 text-accent-amber" />
        <h2 className="text-lg font-semibold font-mono">Today&apos;s Decisions</h2>
      </div>
      <div className="space-y-4">
        {decisions.map((decision) => (
          <div key={decision.id} className="p-3 rounded-lg bg-bg/50">
            <p className="text-sm font-medium text-text-primary mb-1">
              {decision.question}
            </p>
            <p className="text-xs text-text-muted mb-3">{decision.context}</p>
            <div className="space-y-1.5">
              {decision.options.map((option, i) => {
                const isSelected = decision.selectedOption === i;
                return (
                  <button
                    key={i}
                    onClick={() => selectOption(decision.id, i)}
                    className={cn(
                      "w-full text-left text-sm px-3 py-2 rounded-lg border transition-all",
                      isSelected
                        ? "border-accent-green/40 bg-accent-green/10 text-accent-green"
                        : "border-border hover:border-border-strong text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
