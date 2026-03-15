"use client";

import { useState } from "react";
import { UserCheck, UserX, Pause, Check } from "lucide-react";
import { RECOMMENDATION_LABELS } from "@/lib/constants";

interface HumanDecisionProps {
  candidateId: string;
  candidateName: string;
  currentStatus: string;
  onDecisionMade?: () => void;
}

type Decision = "GÖRÜŞ" | "GEÇME" | "BEKLET";

const DECISIONS: { key: Decision; icon: typeof UserCheck; color: string; bg: string; activeBg: string }[] = [
  { key: "GÖRÜŞ", icon: UserCheck, color: "text-accent-green", bg: "bg-accent-green/15 border border-accent-green/40 hover:bg-accent-green/25 hover:border-accent-green/60", activeBg: "bg-accent-green text-bg border border-accent-green" },
  { key: "GEÇME", icon: UserX, color: "text-accent-red", bg: "bg-accent-red/15 border border-accent-red/40 hover:bg-accent-red/25 hover:border-accent-red/60", activeBg: "bg-accent-red text-bg border border-accent-red" },
  { key: "BEKLET", icon: Pause, color: "text-accent-amber", bg: "bg-accent-amber/15 border border-accent-amber/40 hover:bg-accent-amber/25 hover:border-accent-amber/60", activeBg: "bg-accent-amber text-bg border border-accent-amber" },
];

export function HumanDecision({ candidateId, candidateName, currentStatus, onDecisionMade }: HumanDecisionProps) {
  const [selected, setSelected] = useState<Decision | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!selected) return;
    setLoading(true);
    setError(null);

    try {
      const patchRes = await fetch(`/api/hiring/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reviewed" }),
      });

      if (!patchRes.ok) {
        const data = await patchRes.json();
        throw new Error(data.error || "Failed to update status");
      }

      setDone(true);
      onDecisionMade?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (currentStatus === "reviewed") {
    return (
      <div className="flex items-center gap-2 text-text-muted text-sm h-11">
        <Check size={14} />
        Decision recorded
      </div>
    );
  }

  if (done) {
    const label = RECOMMENDATION_LABELS[selected!] || selected;
    const color = DECISIONS.find((d) => d.key === selected)?.color;
    return (
      <div className="h-11 flex flex-col justify-center">
        <div className={`flex items-center gap-2 text-sm ${color}`}>
          <Check size={14} />
          {selected === "GÖRÜŞ"
            ? "Candidate moved to interview stage. Email will be sent via your connected inbox."
            : `${label} — done`}
        </div>
      </div>
    );
  }

  return (
    <div className="h-11 flex items-center">
      {!confirming ? (
        <div className="flex gap-3">
          {DECISIONS.map((d) => {
            const Icon = d.icon;
            const label = RECOMMENDATION_LABELS[d.key] || d.key;
            return (
              <button
                key={d.key}
                onClick={() => { setSelected(d.key); setConfirming(true); setError(null); }}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${d.bg} ${d.color}`}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${DECISIONS.find((d) => d.key === selected)?.activeBg}`}
          >
            {loading ? "Processing..." : "Confirm?"}
          </button>
          {!loading && (
            <button
              onClick={() => { setConfirming(false); setSelected(null); }}
              className="text-xs text-text-muted hover:text-text-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      )}
      {error && <p className="text-xs text-accent-red ml-3">{error}</p>}
    </div>
  );
}
