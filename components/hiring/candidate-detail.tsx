import type { CandidateWithEvaluation } from "@/lib/hiring-types";
import { EvaluationCard } from "./evaluation-card";
import { HumanDecision } from "./human-decision";
import { DuplicateBadge } from "./duplicate-badge";
import { ArrowLeft, FileText, Mail, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";

interface CandidateDetailProps {
  candidate: CandidateWithEvaluation;
}

export function CandidateDetail({ candidate }: CandidateDetailProps) {
  const showDecision = candidate.evaluation !== null;

  return (
    <div className="space-y-6">
      <Link
        href="/hiring"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Back to candidates
      </Link>

      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              {candidate.name}
              {candidate.previous_application_id && <DuplicateBadge />}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
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
          <span className="px-3 py-1 bg-surface-elevated rounded-lg text-xs text-text-secondary">
            {candidate.status}
          </span>
        </div>
      </div>

      {candidate.evaluation && (
        <EvaluationCard evaluation={candidate.evaluation} />
      )}

      {!candidate.evaluation && (
        <div className="card flex flex-col items-center gap-4 py-12">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-accent-orange/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-orange animate-gentle-spin" />
          </div>
          <div className="text-center">
            <p className="text-text-secondary text-sm font-medium">Evaluation pending</p>
            <p className="text-text-muted text-xs mt-1">Will be processed in the next cron cycle</p>
          </div>
        </div>
      )}

      {showDecision && (
        <div className="card">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Your Decision
          </h3>
          <p className="text-xs text-text-muted mb-4">
            Interview moves the candidate forward. Pass and Hold update the status only.
          </p>
          <HumanDecision
            candidateId={candidate.id}
            candidateName={candidate.name}
            currentStatus={candidate.status}
            decisionResult={candidate.decision_result}
          />
        </div>
      )}
    </div>
  );
}
