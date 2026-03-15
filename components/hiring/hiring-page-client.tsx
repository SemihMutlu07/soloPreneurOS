"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CandidateWithEvaluation } from "@/lib/hiring-types";
import { StatsBar } from "./stats-bar";
import { CandidateTable } from "./candidate-table";
import { CandidateDrawer } from "./candidate-drawer";
import { ActionLogPanel } from "@/components/shared/action-log-panel";

interface HiringPageClientProps {
  candidates: CandidateWithEvaluation[];
}

type Tab = "bekleyenler" | "kararlananlar";

export function HiringPageClient({ candidates }: HiringPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("bekleyenler");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

  function handleClose() {
    setSelectedId(null);
    router.refresh();
  }

  const pending = candidates.filter((c) => c.status !== "reviewed");
  const decided = candidates.filter((c) => c.status === "reviewed");

  const actionLogEntries = candidates
    .filter((c) => c.status === "reviewed" || c.status === "analyzed")
    .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
    .slice(0, 15)
    .map((c) => ({
      id: c.id,
      label: c.name,
      detail: c.status === "reviewed" ? `Decision: ${c.decision_result || "reviewed"}` : "Analyzed",
      timestamp: c.applied_at,
      type: "hiring",
    }));

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
      <StatsBar candidates={candidates} />

      <div className="flex gap-1 p-1 bg-surface-elevated rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("bekleyenler")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "bekleyenler"
              ? "bg-surface text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Bekleyenler
          {pending.length > 0 && (
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === "bekleyenler"
                ? "bg-accent-amber/20 text-accent-amber"
                : "bg-surface text-text-muted"
            }`}>
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("kararlananlar")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "kararlananlar"
              ? "bg-surface text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Kararlananlar
          {decided.length > 0 && (
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === "kararlananlar"
                ? "bg-surface-elevated text-text-secondary"
                : "bg-surface text-text-muted"
            }`}>
              {decided.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "bekleyenler" && (
        <CandidateTable
          candidates={pending}
          onSelectCandidate={(id) => setSelectedId(id)}
        />
      )}

      {activeTab === "kararlananlar" && (
        <CandidateTable
          candidates={decided}
          onSelectCandidate={(id) => setSelectedId(id)}
          decided
        />
      )}

      </div>
      <ActionLogPanel title="Candidate Activity" actions={actionLogEntries} />
      <CandidateDrawer
        candidateId={selectedId}
        onClose={handleClose}
      />
    </div>
  );
}
