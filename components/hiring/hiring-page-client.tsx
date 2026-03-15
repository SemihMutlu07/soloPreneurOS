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

export function HiringPageClient({ candidates }: HiringPageClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

  function handleClose() {
    setSelectedId(null);
    router.refresh();
  }

  return (
    <>
      <StatsBar candidates={candidates} />
      <CandidateTable
        candidates={candidates}
        onSelectCandidate={(id) => setSelectedId(id)}
      />
      <CandidateDrawer
        candidateId={selectedId}
        onClose={handleClose}
      />
    </>
  );
}
