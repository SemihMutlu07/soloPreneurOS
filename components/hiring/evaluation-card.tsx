import type { Evaluation } from "@/lib/hiring-types";
import { RECOMMENDATION_COLORS } from "@/lib/constants";
import { CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";

interface EvaluationCardProps {
  evaluation: Evaluation;
}

export function EvaluationCard({ evaluation }: EvaluationCardProps) {
  const recColor =
    RECOMMENDATION_COLORS[evaluation.recommendation] || "text-text-primary";

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          AI Evaluation
        </h3>
        <span className={`text-lg font-bold ${recColor}`}>
          {evaluation.recommendation}
        </span>
      </div>

      {/* Strong Signals */}
      <div>
        <h4 className="text-xs font-medium text-accent-green flex items-center gap-1.5 mb-2">
          <CheckCircle size={14} />
          Strong Signals
        </h4>
        <ul className="space-y-1">
          {evaluation.strong_signals.map((signal, i) => (
            <li
              key={i}
              className="text-sm text-text-secondary pl-5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-accent-green/40"
            >
              {signal}
            </li>
          ))}
        </ul>
      </div>

      {/* Risk Flags */}
      <div>
        <h4 className="text-xs font-medium text-accent-red flex items-center gap-1.5 mb-2">
          <AlertTriangle size={14} />
          Risk Flags
        </h4>
        <ul className="space-y-1">
          {evaluation.risk_flags.map((flag, i) => (
            <li
              key={i}
              className="text-sm text-text-secondary pl-5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-accent-red/40"
            >
              {flag}
            </li>
          ))}
          {evaluation.risk_flags.length === 0 && (
            <li className="text-sm text-text-muted">No flags identified</li>
          )}
        </ul>
      </div>

      {/* Critical Question */}
      {evaluation.critical_question && (
        <div>
          <h4 className="text-xs font-medium text-accent-amber flex items-center gap-1.5 mb-2">
            <HelpCircle size={14} />
            Critical Question
          </h4>
          <p className="text-sm text-text-secondary italic">
            &quot;{evaluation.critical_question}&quot;
          </p>
        </div>
      )}

      {/* Raw Scores */}
      {Object.keys(evaluation.raw_score).length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-text-secondary mb-2">
            Scores
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(evaluation.raw_score).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between bg-surface-elevated rounded-lg px-3 py-1.5"
              >
                <span className="text-xs text-text-secondary capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-mono text-text-primary">
                  {value}/10
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
