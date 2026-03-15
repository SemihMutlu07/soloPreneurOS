"use client";

import { useState } from "react";
import { Send, Calendar, Clock, XCircle, Check } from "lucide-react";

interface LeadActionsProps {
  leadId: string;
  currentStage: string;
  onStatusChange?: (leadId: string, newStage: string) => void;
}

const ACTIONS = [
  {
    key: "send_reply",
    label: "Send Reply",
    icon: Send,
    stage: "contacted",
    color: "text-accent-green",
    bg: "bg-accent-green/15 border border-accent-green/40 hover:bg-accent-green/25 hover:border-accent-green/60",
    activeBg: "bg-accent-green text-bg border border-accent-green",
  },
  {
    key: "schedule_demo",
    label: "Schedule Demo",
    icon: Calendar,
    stage: "demo",
    color: "text-blue-400",
    bg: "bg-blue-900/15 border border-blue-400/40 hover:bg-blue-900/25 hover:border-blue-400/60",
    activeBg: "bg-blue-500 text-bg border border-blue-500",
  },
  {
    key: "nurture",
    label: "Move to Nurture",
    icon: Clock,
    stage: "nurture",
    color: "text-accent-amber",
    bg: "bg-accent-amber/15 border border-accent-amber/40 hover:bg-accent-amber/25 hover:border-accent-amber/60",
    activeBg: "bg-accent-amber text-bg border border-accent-amber",
  },
  {
    key: "disqualify",
    label: "Disqualify",
    icon: XCircle,
    stage: "lost",
    color: "text-accent-red",
    bg: "bg-accent-red/15 border border-accent-red/40 hover:bg-accent-red/25 hover:border-accent-red/60",
    activeBg: "bg-accent-red text-bg border border-accent-red",
  },
] as const;

export function LeadActions({ leadId, currentStage, onStatusChange }: LeadActionsProps) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function handleConfirm(actionKey: string, stage: string) {
    onStatusChange?.(leadId, stage);
    setDone(actionKey);
    setConfirming(null);
  }

  if (done) {
    const action = ACTIONS.find((a) => a.key === done);
    return (
      <div className={`h-11 flex items-center gap-2 text-sm ${action?.color ?? "text-text-muted"}`}>
        <Check size={14} />
        {action?.label} — done
      </div>
    );
  }

  if (currentStage === "won" || currentStage === "lost") {
    return (
      <div className="flex items-center gap-2 text-text-muted text-sm h-11">
        <Check size={14} />
        Lead {currentStage === "won" ? "won" : "closed"}
      </div>
    );
  }

  return (
    <div className="h-11 flex items-center">
      {!confirming ? (
        <div className="flex items-center gap-3 flex-wrap">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => setConfirming(action.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${action.bg} ${action.color}`}
              >
                <Icon size={15} />
                {action.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const action = ACTIONS.find((a) => a.key === confirming);
              if (action) handleConfirm(action.key, action.stage);
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${ACTIONS.find((a) => a.key === confirming)?.activeBg}`}
          >
            Confirm?
          </button>
          <button
            onClick={() => setConfirming(null)}
            className="text-xs text-text-muted hover:text-text-secondary"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
