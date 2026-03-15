"use client";

import { useState, useRef } from "react";
import { ArrowUp, X, Loader2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const PLACEHOLDERS: Record<string, string> = {
  dashboard: "Ask anything about your business...",
  hiring: "Ask about candidates or update status...",
  sales: "Ask about leads or update stages...",
  finance: "Ask about invoices or record expenses...",
};

interface AiAssistantBarProps {
  context: "dashboard" | "hiring" | "sales" | "finance";
}

export default function AiAssistantBar({ context }: AiAssistantBarProps) {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [toolUsed, setToolUsed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = message.trim();
    if (!q || loading) return;

    setLoading(true);
    setAnswer(null);
    setToolUsed(null);
    setShowPanel(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, context }),
      });
      const data = await res.json();
      setAnswer(data.answer);
      if (data.toolUsed) {
        setToolUsed(data.toolUsed);
      }
    } catch {
      setAnswer("Couldn't process that — try again.");
    } finally {
      setLoading(false);
      setMessage("");
    }
  }

  function handleClose() {
    setShowPanel(false);
    setAnswer(null);
    setToolUsed(null);
    inputRef.current?.focus();
  }

  function formatToolName(tool: string): string {
    return tool
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Response panel */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          showPanel && (answer || loading)
            ? "max-h-80 opacity-100"
            : "max-h-0 opacity-0"
        )}
      >
        <div className="mx-auto max-w-2xl px-5 pb-3">
          <div className="rounded-2xl bg-surface border border-border-strong p-5 shadow-xl shadow-black/20 backdrop-blur-sm max-h-72 overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="flex items-center gap-2.5 text-text-secondary text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-accent-primary" />
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                ) : answer ? (
                  <div>
                    <div className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                      {answer}
                    </div>
                    {toolUsed && (
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-primary/10 px-2.5 py-1 text-[11px] font-medium text-accent-primary border border-accent-primary/15">
                        <Bot className="w-3 h-3" />
                        {formatToolName(toolUsed)}
                      </span>
                    )}
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
      <div className="bg-bg border-t border-border py-3">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-2xl px-5 flex items-center gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={PLACEHOLDERS[context] ?? PLACEHOLDERS.dashboard}
            disabled={loading}
            className="flex-1 bg-surface text-text-primary text-sm rounded-xl px-4 py-2.5 placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary/20 disabled:opacity-50 border border-border-strong"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="shrink-0 p-2.5 rounded-xl bg-accent-primary/8 text-accent-primary hover:bg-accent-primary/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-accent-primary/8"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
