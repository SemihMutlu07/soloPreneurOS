"use client";

import { useState } from "react";
import type { CandidateWithEvaluation } from "@/lib/hiring-types";
import { StatsBar } from "./stats-bar";
import { CandidateTable } from "./candidate-table";
import { CandidateDrawer } from "./candidate-drawer";

interface HiringPageClientProps {
  candidates: CandidateWithEvaluation[];
}

export function HiringPageClient({ candidates }: HiringPageClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <StatsBar candidates={candidates} />
      <CandidateTable
        candidates={candidates}
        onSelectCandidate={(id) => setSelectedId(id)}
      />
      <CandidateDrawer
        candidateId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
