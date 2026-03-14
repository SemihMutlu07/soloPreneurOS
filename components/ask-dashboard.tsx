"use client";

import { useState, useRef } from "react";
import { ArrowUp, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DECISIONS_STORAGE_KEY = "decisions-history";

function loadPreviousDecisions() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DECISIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export default function AskDashboard() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setAnswer(null);
    setShowPanel(true);

    try {
      const previousDecisions = loadPreviousDecisions();
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, previousDecisions }),
      });
      const data = await res.json();
      setAnswer(data.answer);
    } catch {
      setAnswer("Couldn't process that — try again.");
    } finally {
      setLoading(false);
      setQuestion("");
    }
  }

  function handleClose() {
    setShowPanel(false);
    setAnswer(null);
    inputRef.current?.focus();
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Response panel */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          showPanel && (answer || loading) ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="mx-auto max-w-2xl px-5 pb-3">
          <div className="rounded-2xl bg-surface border border-border-strong p-5 shadow-xl shadow-black/20 backdrop-blur-sm max-h-72 overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="flex items-center gap-2.5 text-text-secondary text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-accent-teal" />
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                ) : answer ? (
                  <div className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {answer}
                  </div>
                ) : null}
              </div>
              {!loading && answer && (
                <button
                  onClick={handleClose}
                  className="shrink-0 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="bg-bg/90 backdrop-blur-md border-t border-border py-3">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl px-5 flex items-center gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about your business..."
            disabled={loading}
            className="flex-1 bg-surface text-text-primary text-sm rounded-xl px-4 py-2.5 placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-teal/20 disabled:opacity-50 border border-border-strong"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="shrink-0 p-2.5 rounded-xl bg-accent-teal/8 text-accent-teal hover:bg-accent-teal/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-accent-teal/8"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
