"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import type { CandidateWithEvaluation } from "@/lib/hiring-types";
import { EvaluationCard } from "./evaluation-card";
import { HumanDecision } from "./human-decision";
import { DuplicateBadge } from "./duplicate-badge";
import { FileText, Mail, Calendar } from "lucide-react";

interface CandidateDrawerProps {
  candidateId: string | null;
  onClose: () => void;
}

export function CandidateDrawer({ candidateId, onClose }: CandidateDrawerProps) {
  const [candidate, setCandidate] = useState<CandidateWithEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!candidateId) {
      setCandidate(null);
      return;
    }

    setLoading(true);
    fetch(`/api/hiring/candidates/${candidateId}`)
      .then((r) => r.json())
      .then((data) => setCandidate(data))
      .catch(() => setCandidate(null))
      .finally(() => setLoading(false));
  }, [candidateId]);

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  }

  if (!candidateId) return null;

  const showDecision = candidate?.evaluation !== null && candidate?.evaluation !== undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Desktop: right drawer / Mobile: bottom sheet */}
      <div
        className={`fixed z-50 bg-bg border-border overflow-y-auto
          max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:h-[85vh] max-md:rounded-t-2xl max-md:border-t
          md:top-0 md:right-0 md:h-full md:w-[520px] md:border-l
          ${closing
            ? "max-md:animate-slide-out-bottom md:animate-slide-out-right"
            : "max-md:animate-slide-in-bottom md:animate-slide-in-right"
          }`}
      >
        {/* Drag handle (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-surface-elevated" />
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-bg border-b border-border">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Candidate Detail
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-accent-orange" />
            </div>
          )}

          {!loading && candidate && (
            <>
              {/* Candidate info */}
              <div>
                <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                  {candidate.name}
                  {candidate.previous_application_id && <DuplicateBadge />}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} />
                    {candidate.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} />
                    {candidate.role}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {new Date(candidate.applied_at).toLocaleDateString()}
                  </span>
                </div>
                <span className="inline-block mt-2 px-3 py-1 bg-surface-elevated rounded-lg text-xs text-text-secondary">
                  {candidate.status}
                </span>
              </div>

              {/* Evaluation */}
              {candidate.evaluation && (
                <EvaluationCard evaluation={candidate.evaluation} />
              )}

              {!candidate.evaluation && (
                <div className="card text-center py-8">
                  <p className="text-text-muted text-sm">
                    Evaluation pending — will be processed in the next cron cycle.
                  </p>
                </div>
              )}

              {/* Human Decision */}
              {showDecision && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                    Your Decision
                  </h3>
                  <p className="text-xs text-text-muted mb-4">
                    GÖRÜŞ AL sends an interview email automatically. GEÇME and BEKLET update the status only.
                  </p>
                  <HumanDecision
                    candidateId={candidate.id}
                    candidateName={candidate.name}
                    currentStatus={candidate.status}
                  />
                </div>
              )}
            </>
          )}

          {!loading && !candidate && (
            <div className="text-center py-16 text-text-muted">
              Candidate not found
            </div>
          )}
        </div>
      </div>
    </>
  );
}
