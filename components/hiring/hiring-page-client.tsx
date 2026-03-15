"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CandidateWithEvaluation } from "@/lib/hiring-types";
import { StatsBar } from "./stats-bar";
import { CandidateTable } from "./candidate-table";
import { CandidateDrawer } from "./candidate-drawer";

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

  return (
    <>
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

      <CandidateDrawer
        candidateId={selectedId}
        onClose={handleClose}
      />
    </>
  );
}
