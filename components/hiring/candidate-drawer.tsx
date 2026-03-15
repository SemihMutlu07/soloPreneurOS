"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Mail, FileText, Calendar } from "lucide-react";
import type { CandidateWithEvaluation } from "@/lib/hiring-types";
import { EvaluationCard } from "./evaluation-card";
import { HumanDecision } from "./human-decision";
import { DuplicateBadge } from "./duplicate-badge";

interface CandidateModalProps {
  candidateId: string | null;
  onClose: () => void;
}

export function CandidateDrawer({ candidateId, onClose }: CandidateModalProps) {
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

  // Block body scroll when open
  useEffect(() => {
    if (candidateId) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [candidateId]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 150);
  }, [onClose]);

  // Escape key closes modal
  useEffect(() => {
    if (!candidateId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [candidateId, handleClose]);

  if (!candidateId) return null;

  const showDecision = candidate?.evaluation !== null && candidate?.evaluation !== undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Centered modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`bg-bg border border-border rounded-2xl flex flex-col
            w-[80vw] max-h-[85vh]
            max-md:w-[95vw] max-md:max-h-[90vh]
            shadow-2xl
            ${closing ? "animate-modal-out" : "animate-modal-in"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            {candidate ? (
              <div className="flex items-center gap-3 min-w-0">
                <h2 className="text-lg font-semibold text-text-primary truncate">
                  {candidate.name}
                </h2>
                {candidate.previous_application_id && <DuplicateBadge />}
                <span className="text-sm text-text-secondary hidden sm:inline">{candidate.role}</span>
                <span className="text-xs text-text-muted font-mono hidden sm:inline">
                  {new Date(candidate.applied_at).toLocaleDateString()}
                </span>
                <span className="px-2 py-0.5 bg-surface-elevated rounded text-xs text-text-secondary">
                  {candidate.status}
                </span>
              </div>
            ) : (
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Candidate Detail
              </h2>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors shrink-0 ml-3"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-accent-orange" />
              </div>
            )}

            {!loading && candidate && (
              <>
                {/* Contact info (shown on mobile since header hides some) */}
                <div className="sm:hidden space-y-1">
                  <div className="flex items-center gap-3 text-sm text-text-secondary flex-wrap">
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
                </div>

                {/* Desktop contact row */}
                <div className="hidden sm:flex items-center gap-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} />
                    {candidate.email}
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
              </>
            )}

            {!loading && !candidate && (
              <div className="text-center py-16 text-text-muted">
                Candidate not found
              </div>
            )}
          </div>

          {/* Fixed bottom decision bar */}
          {!loading && candidate && showDecision && (
            <div className="shrink-0 border-t border-border px-6 py-4">
              <HumanDecision
                candidateId={candidate.id}
                candidateName={candidate.name}
                currentStatus={candidate.status}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
