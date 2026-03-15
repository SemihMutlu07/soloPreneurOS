"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserX, Pause, Check } from "lucide-react";

interface HumanDecisionProps {
  candidateId: string;
  candidateName: string;
  currentStatus: string;
}

type Decision = "GÖRÜŞ" | "GEÇME" | "BEKLET";

const DECISIONS: { key: Decision; label: string; icon: typeof UserCheck; color: string; bg: string; activeBg: string }[] = [
  { key: "GÖRÜŞ", label: "GÖRÜŞ AL", icon: UserCheck, color: "text-accent-green", bg: "bg-accent-green/15 border border-accent-green/40 hover:bg-accent-green/25 hover:border-accent-green/60", activeBg: "bg-accent-green text-bg border border-accent-green" },
  { key: "GEÇME", label: "GEÇME", icon: UserX, color: "text-accent-red", bg: "bg-accent-red/15 border border-accent-red/40 hover:bg-accent-red/25 hover:border-accent-red/60", activeBg: "bg-accent-red text-bg border border-accent-red" },
  { key: "BEKLET", label: "BEKLET", icon: Pause, color: "text-accent-amber", bg: "bg-accent-amber/15 border border-accent-amber/40 hover:bg-accent-amber/25 hover:border-accent-amber/60", activeBg: "bg-accent-amber text-bg border border-accent-amber" },
];

export function HumanDecision({ candidateId, candidateName, currentStatus }: HumanDecisionProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Decision | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(decision: Decision) {
    if (!confirming || selected !== decision) {
      setSelected(decision);
      setConfirming(true);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update status to reviewed
      const patchRes = await fetch(`/api/hiring/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reviewed" }),
      });

      if (!patchRes.ok) {
        const data = await patchRes.json();
        throw new Error(data.error || "Failed to update status");
      }

      // If GÖRÜŞ, also send interview email
      if (decision === "GÖRÜŞ") {
        const interviewRes = await fetch(
          `/api/hiring/candidates/${candidateId}/interview`,
          { method: "POST" },
        );

        if (!interviewRes.ok) {
          const data = await interviewRes.json();
          throw new Error(data.error || "Status updated but failed to send interview email");
        }
      }

      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (currentStatus === "reviewed") {
    return (
      <div className="flex items-center gap-2 text-text-muted text-sm">
        <Check size={14} />
        Decision recorded
      </div>
    );
  }

  if (done) {
    return (
      <div className={`flex items-center gap-2 text-sm ${DECISIONS.find((d) => d.key === selected)?.color}`}>
        <Check size={14} />
        {selected === "GÖRÜŞ"
          ? `GÖRÜŞ AL — interview email sent to ${candidateName}`
          : `${selected} — status updated`}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 flex-wrap">
        {DECISIONS.map((d) => {
          const Icon = d.icon;
          const isSelected = confirming && selected === d.key;
          return (
            <button
              key={d.key}
              onClick={() => handleClick(d.key)}
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                isSelected ? d.activeBg : `${d.bg} ${d.color}`
              }`}
            >
              <Icon size={15} />
              {loading && isSelected
                ? "Processing..."
                : isSelected
                  ? `Confirm ${d.label}?`
                  : d.label}
            </button>
          );
        })}
      </div>
      {confirming && !loading && (
        <button
          onClick={() => { setConfirming(false); setSelected(null); }}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          Cancel
        </button>
      )}
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </div>
  );
}
