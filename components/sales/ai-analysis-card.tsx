import { CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { LEAD_SCORE_THRESHOLDS, SUGGESTED_ACTIONS } from "@/lib/constants";
import type { SalesLead } from "@/lib/sales-types";

interface AiAnalysisCardProps {
  lead: SalesLead;
}

function getScoreInfo(score: number) {
  if (score >= LEAD_SCORE_THRESHOLDS.hot)
    return { label: "Hot Lead", color: "text-green-400", bg: "bg-green-400", track: "bg-green-900/30" };
  if (score >= LEAD_SCORE_THRESHOLDS.warm)
    return { label: "Warm Lead", color: "text-amber-400", bg: "bg-amber-400", track: "bg-amber-900/30" };
  return { label: "Cold Lead", color: "text-red-400", bg: "bg-red-400", track: "bg-red-900/30" };
}

export function AiAnalysisCard({ lead }: AiAnalysisCardProps) {
  const { label, color, bg, track } = getScoreInfo(lead.ai_score);

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
          AI Analysis
        </h3>
        <span className={`text-lg font-bold ${color}`}>{label}</span>
      </div>

      {/* Score bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">AI Score</span>
          <span className={`font-mono font-semibold ${color}`}>{lead.ai_score}/100</span>
        </div>
        <div className={`h-2 rounded-full ${track}`}>
          <div
            className={`h-2 rounded-full ${bg} transition-all`}
            style={{ width: `${lead.ai_score}%` }}
          />
        </div>
      </div>

      {/* AI Summary — fallback to notes */}
      {(lead.ai_summary || lead.notes) && (
        <p className="text-sm text-text-secondary leading-relaxed">
          {lead.ai_summary || lead.notes}
        </p>
      )}

      {/* Positive signals */}
      {lead.ai_signals.positive.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-accent-green flex items-center gap-1.5 mb-2">
            <CheckCircle size={14} />
            Positive Signals
          </h4>
          <ul className="space-y-1">
            {lead.ai_signals.positive.map((signal, i) => (
              <li
                key={i}
                className="text-sm text-text-secondary pl-5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-accent-green/40"
              >
                {signal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Negative signals */}
      {lead.ai_signals.negative.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-accent-red flex items-center gap-1.5 mb-2">
            <AlertTriangle size={14} />
            Risk Flags
          </h4>
          <ul className="space-y-1">
            {lead.ai_signals.negative.map((flag, i) => (
              <li
                key={i}
                className="text-sm text-text-secondary pl-5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-accent-red/40"
              >
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Open questions — only if present */}
      {(lead.ai_signals.questions?.length ?? 0) > 0 && (
        <div>
          <h4 className="text-xs font-medium text-accent-orange flex items-center gap-1.5 mb-2">
            <HelpCircle size={14} />
            Open Questions
          </h4>
          <ul className="space-y-1">
            {lead.ai_signals.questions!.map((q, i) => (
              <li
                key={i}
                className="text-sm text-text-secondary pl-5 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-accent-orange/40"
              >
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested action */}
      {lead.ai_suggested_action && (
        <div>
          <h4 className="text-xs font-medium text-text-secondary mb-2">Suggested Action</h4>
          <span className="inline-block px-3 py-1 rounded-lg bg-surface-elevated text-sm text-text-primary font-medium">
            {SUGGESTED_ACTIONS[lead.ai_suggested_action] ?? lead.ai_suggested_action}
          </span>
        </div>
      )}

      {/* AI draft response */}
      {lead.ai_draft_response && (
        <details className="group">
          <summary className="text-xs font-medium text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
            AI Draft Response
          </summary>
          <div className="mt-2 p-3 rounded-lg bg-surface-elevated text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {lead.ai_draft_response}
          </div>
        </details>
      )}
    </div>
  );
}
