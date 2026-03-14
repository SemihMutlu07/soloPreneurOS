"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Loader2, Clock, Target, Zap, AlertTriangle, Globe, UserCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BRIEF_STORAGE_KEY = "morning-brief-cache";
const DECISIONS_STORAGE_KEY = "decisions-history";
const IMPACT_STORAGE_KEY = "decisions-impact";
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

interface CachedBrief {
  text: string;
  timestamp: number;
}

interface PreviousDecision {
  question: string;
  choice: string;
  timestamp: string;
}

interface ReviewedDecision {
  title: string;
  chosenOption: string;
  impactNote: string;
}

const sectionIcons: Record<string, typeof Target> = {
  "Top Priority": Target,
  "Quick Wins": Zap,
  "Watch Out": AlertTriangle,
  "Market Pulse": Globe,
  "Lead Action": UserCheck,
  "Yesterday's Decisions → Today's Actions": ArrowRight,
};

const sectionAccents: Record<string, string> = {
  "Top Priority": "border-l-accent-red",
  "Quick Wins": "border-l-accent-teal",
  "Watch Out": "border-l-accent-amber",
  "Market Pulse": "border-l-accent-blue",
  "Lead Action": "border-l-[#a78bfa]",
  "Yesterday's Decisions → Today's Actions": "border-l-accent-teal",
};

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function loadCachedBrief(): CachedBrief | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BRIEF_STORAGE_KEY);
    if (!raw) return null;
    const cached: CachedBrief = JSON.parse(raw);
    if (Date.now() - cached.timestamp > TWELVE_HOURS) return null;
    return cached;
  } catch {
    return null;
  }
}

function loadPreviousDecisions(): PreviousDecision[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DECISIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadReviewedDecisions(): ReviewedDecision[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(IMPACT_STORAGE_KEY);
    if (!raw) return [];
    const impacts = JSON.parse(raw);
    return impacts
      .filter((i: { impactNote: string | null }) => i.impactNote)
      .map((i: { title: string; chosenOption: string; impactNote: string }) => ({
        title: i.title,
        chosenOption: i.chosenOption,
        impactNote: i.impactNote,
      }));
  } catch {
    return [];
  }
}

function parseSections(text: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const lines = text.split("\n");
  let currentTitle = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)/);
    if (headingMatch) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentLines.join("\n").trim() });
      }
      currentTitle = headingMatch[1].trim();
      currentLines = [];
    } else if (currentTitle) {
      currentLines.push(line);
    } else {
      if (line.trim()) {
        currentLines.push(line);
      }
    }
  }

  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentLines.join("\n").trim() });
  }

  if (!sections.length && currentLines.length) {
    sections.push({ title: "", content: currentLines.join("\n").trim() });
  }

  return sections;
}

export default function MorningBrief() {
  const [brief, setBrief] = useState<string | null>(null);
  const [briefTimestamp, setBriefTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCached, setHasCached] = useState(false);

  const [autoTriggered, setAutoTriggered] = useState(false);

  useEffect(() => {
    const cached = loadCachedBrief();
    if (cached) {
      setBrief(cached.text);
      setBriefTimestamp(cached.timestamp);
      setHasCached(true);
    } else {
      setAutoTriggered(true);
    }
  }, []);

  const generateBrief = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const previousDecisions = loadPreviousDecisions();
      const reviewedDecisions = loadReviewedDecisions();
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previousDecisions, reviewedDecisions }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate brief");
      }
      const data = await res.json();
      const now = Date.now();
      setBrief(data.brief);
      setBriefTimestamp(now);
      setHasCached(true);
      localStorage.setItem(
        BRIEF_STORAGE_KEY,
        JSON.stringify({ text: data.brief, timestamp: now })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-generate on first visit when no cached brief exists
  useEffect(() => {
    if (autoTriggered && !brief && !loading) {
      generateBrief();
    }
  }, [autoTriggered, brief, loading, generateBrief]);

  const sections = brief ? parseSections(brief) : [];

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-accent-teal" />
          <h2 className="text-base font-semibold font-mono text-gray-100">Morning Brief</h2>
          <span className="text-xs text-text-muted font-mono ml-1">/ ajan modu</span>
        </div>
        <div className="flex items-center gap-4">
          {briefTimestamp && (
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-mono">
                Generated at {formatTimestamp(briefTimestamp)}
              </span>
            </div>
          )}
          <button
            onClick={generateBrief}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed animate-halo border border-accent-teal/10"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 animate-gentle-spin" />
                {hasCached ? "Regenerate" : "Generate Brief"}
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/10">
          {error}
        </div>
      )}

      {loading && sections.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "p-5 rounded-xl bg-surface-elevated/40 border-l-2 border-text-muted/30 animate-pulse",
                i === 1 && "md:col-span-2"
              )}
            >
              <div className="h-4 bg-surface-hover rounded w-1/3 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-surface-hover rounded w-full" />
                <div className="h-3 bg-surface-hover rounded w-5/6" />
                <div className="h-3 bg-surface-hover rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : sections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section, i) => {
            const IconComponent = sectionIcons[section.title];
            const accent = sectionAccents[section.title] || "border-l-text-muted";
            const isFullWidth = section.title === "Top Priority" || section.title.includes("Yesterday");
            return (
              <div
                key={i}
                className={cn(
                  "p-5 rounded-xl bg-surface-elevated/40 border-l-2 transition-colors",
                  accent,
                  isFullWidth && "md:col-span-2"
                )}
              >
                {section.title && (
                  <div className="flex items-center gap-2.5 mb-3">
                    {IconComponent && <IconComponent className="w-4 h-4 text-text-secondary" />}
                    <h3 className="text-sm font-semibold font-mono text-gray-100">
                      {section.title}
                    </h3>
                  </div>
                )}
                <div className="space-y-1.5">
                  {section.content.split("\n").map((line, j) => {
                    if (!line.trim()) return null;
                    if (line.startsWith("- ") || line.startsWith("* "))
                      return (
                        <p key={j} className="text-text-secondary text-sm pl-4 py-0.5 leading-relaxed">
                          <span className="text-accent-teal mr-2 font-mono">-</span>
                          {line.replace(/^[-*]\s*/, "").replace(/\*\*/g, "")}
                        </p>
                      );
                    if (line.startsWith("**") || line.match(/^\*\*.+\*\*/))
                      return (
                        <p key={j} className="text-gray-100 text-sm font-medium leading-relaxed">
                          {line.replace(/\*\*/g, "")}
                        </p>
                      );
                    return (
                      <p key={j} className="text-text-secondary text-sm leading-relaxed">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : !loading && !error ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-text-secondary text-sm">
            Click &quot;Generate Brief&quot; to get your AI-powered morning briefing. Requires an Anthropic API key.
          </p>
        </div>
      ) : null}
    </div>
  );
}
