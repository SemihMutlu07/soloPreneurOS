"use client";

import { useState, useEffect } from "react";
import { GitBranch, Check, Sparkles, MessageSquare, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { todaysDecisions, type Decision } from "@/lib/mock-data";

const DECISIONS_STORAGE_KEY = "decisions-history";
const IMPACT_STORAGE_KEY = "decisions-impact";
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

interface DecisionImpact {
  decisionId: string;
  title: string;
  chosenOption: string;
  timestamp: number;
  impactNote: string | null;
}

const agentSuggestions: Record<string, string> = {
  "dec-1": "Yes, buyume carpanini tetikler.",
  "dec-2": "AI chatbot, olceklenebilir ve maliyet-etkin.",
  "dec-3": "Real-time collaboration, en yuksek oy ve retansiyon etkisi.",
};

function loadImpacts(): DecisionImpact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(IMPACT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveImpacts(impacts: DecisionImpact[]) {
  localStorage.setItem(IMPACT_STORAGE_KEY, JSON.stringify(impacts));
}

function saveToDecisionsHistory(question: string, choice: string) {
  try {
    const raw = localStorage.getItem(DECISIONS_STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];
    history.push({
      question,
      choice,
      timestamp: new Date().toLocaleString(),
    });
    localStorage.setItem(DECISIONS_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

type CardState = "undecided" | "decided" | "reviewing" | "reviewed";

function getCardState(decision: Decision, impact: DecisionImpact | undefined): CardState {
  if (!impact) return decision.selectedOption !== undefined ? "decided" : "undecided";
  if (impact.impactNote) return "reviewed";
  if (Date.now() - impact.timestamp > TWENTY_FOUR_HOURS) return "reviewing";
  return "decided";
}

export default function TodaysDecisions() {
  const [decisions, setDecisions] = useState<Decision[]>(todaysDecisions);
  const [impacts, setImpacts] = useState<DecisionImpact[]>([]);
  const [reviewInputs, setReviewInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    setImpacts(loadImpacts());
  }, []);

  function selectOption(decisionId: string, optionIndex: number) {
    const decision = decisions.find((d) => d.id === decisionId);
    if (!decision || decision.selectedOption !== undefined) return;

    setDecisions((prev) =>
      prev.map((d) =>
        d.id === decisionId ? { ...d, selectedOption: optionIndex } : d
      )
    );

    const chosenOption = decision.options[optionIndex];
    saveToDecisionsHistory(decision.question, chosenOption);

    const newImpact: DecisionImpact = {
      decisionId,
      title: decision.question,
      chosenOption,
      timestamp: Date.now(),
      impactNote: null,
    };
    const updated = [...impacts.filter((i) => i.decisionId !== decisionId), newImpact];
    setImpacts(updated);
    saveImpacts(updated);
  }

  function submitReview(decisionId: string) {
    const note = reviewInputs[decisionId]?.trim();
    if (!note) return;

    const updated = impacts.map((i) =>
      i.decisionId === decisionId ? { ...i, impactNote: note } : i
    );
    setImpacts(updated);
    saveImpacts(updated);
    setReviewInputs((prev) => {
      const next = { ...prev };
      delete next[decisionId];
      return next;
    });
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2.5 mb-5">
        <GitBranch className="w-5 h-5 text-accent-amber" />
        <h2 className="text-base font-semibold font-mono text-gray-100">Today&apos;s Decisions</h2>
      </div>
      <div className="space-y-4">
        {decisions.map((decision) => {
          const impact = impacts.find((i) => i.decisionId === decision.id);
          const state = getCardState(decision, impact);

          return (
            <div key={decision.id} className="p-4 rounded-xl bg-surface-elevated/50">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold text-gray-100 flex-1 min-w-0">
                  {decision.question}
                </p>
                {state === "decided" && (
                  <span className="text-[10px] font-medium text-accent-teal bg-accent-teal/10 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 mt-0.5">
                    <Check className="w-3 h-3" /> Decided
                  </span>
                )}
                {state === "reviewed" && (
                  <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Reviewed
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mb-3.5 leading-relaxed">{decision.context}</p>

              {agentSuggestions[decision.id] && state === "undecided" && (
                <div className="flex items-center gap-2 mb-3.5 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                  <p className="text-[11px] text-emerald-400 italic leading-relaxed">
                    Ajanin Onerisi: {agentSuggestions[decision.id]}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {decision.options.map((option, i) => {
                  const isSelected = decision.selectedOption === i;
                  return (
                    <button
                      key={i}
                      onClick={() => selectOption(decision.id, i)}
                      disabled={decision.selectedOption !== undefined}
                      className={cn(
                        "w-full text-left text-sm px-3.5 py-2.5 rounded-xl transition-all leading-relaxed",
                        isSelected
                          ? "bg-accent-teal/10 text-accent-teal border border-accent-teal/20"
                          : decision.selectedOption !== undefined
                          ? "bg-surface-hover/30 text-text-muted cursor-default border border-transparent"
                          : "bg-surface-hover/50 text-text-secondary hover:text-gray-100 hover:bg-surface-hover border border-transparent"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Follow-up review prompt */}
              {state === "reviewing" && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2.5">
                    <MessageSquare className="w-3.5 h-3.5 text-accent-amber" />
                    <span className="text-xs font-medium text-accent-amber">
                      How did this turn out?
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reviewInputs[decision.id] || ""}
                      onChange={(e) =>
                        setReviewInputs((prev) => ({
                          ...prev,
                          [decision.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitReview(decision.id);
                      }}
                      placeholder="Quick note on the outcome..."
                      className="flex-1 bg-surface-hover/50 text-gray-100 text-xs rounded-lg px-3 py-2 placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-amber/30 border border-border"
                    />
                    <button
                      onClick={() => submitReview(decision.id)}
                      disabled={!reviewInputs[decision.id]?.trim()}
                      className="text-xs px-3.5 py-2 rounded-lg bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/20 transition-colors disabled:opacity-30 font-medium"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* Show reviewed note */}
              {state === "reviewed" && impact?.impactNote && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-text-secondary italic leading-relaxed">
                      &quot;{impact.impactNote}&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
