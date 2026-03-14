"use client";

import { useState, useEffect, useCallback } from "react";
import { Brain, Target, Zap, AlertTriangle, Globe, UserCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAgentResult, setAgentResult, isStale } from "@/lib/agent-store";
import AgentCardWrapper from "./agent-card-wrapper";

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

export default function ChiefOfStaff() {
  const [brief, setBrief] = useState<string | null>(null);
  const [briefTimestamp, setBriefTimestamp] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [autoTriggered, setAutoTriggered] = useState(false);

  useEffect(() => {
    const cached = loadCachedBrief();
    if (cached) {
      setBrief(cached.text);
      setBriefTimestamp(cached.timestamp);
      setStatus("success");
    } else {
      setAutoTriggered(true);
    }
  }, []);

  const generateBrief = useCallback(async () => {
    setStatus("running");
    setError(null);
    try {
      const previousDecisions = loadPreviousDecisions();
      const reviewedDecisions = loadReviewedDecisions();

      // Read Market Scout results from agent store
      const marketScoutResult = getAgentResult("market-scout");
      const signals = marketScoutResult?.data?.signals || [];

      // Read daily-ops tasks from localStorage
      let tasks: { id: string; text: string; priority: string; completed: boolean }[] = [];
      try {
        const raw = localStorage.getItem("daily-ops-tasks");
        if (raw) tasks = JSON.parse(raw);
      } catch {
        // ignore
      }

      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousDecisions,
          reviewedDecisions,
          agentContext: { signals, tasks },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate brief");
      }
      const data = await res.json();
      const now = Date.now();
      setBrief(data.brief);
      setBriefTimestamp(now);
      localStorage.setItem(
        BRIEF_STORAGE_KEY,
        JSON.stringify({ text: data.brief, timestamp: now })
      );
      setAgentResult("chief-of-staff", { brief: data.brief }, "success", "Brief generated");
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }, []);

  // Auto-generate on first visit when no cached brief exists
  useEffect(() => {
    if (autoTriggered && !brief && status !== "running") {
      generateBrief();
    }
  }, [autoTriggered, brief, status, generateBrief]);

  const sections = brief ? parseSections(brief) : [];

  // Count context sources for "Synthesized from" line
  const marketScoutResult = typeof window !== "undefined" ? getAgentResult("market-scout") : null;
  const signalCount = marketScoutResult?.data?.signals?.length || 0;
  let taskCount = 0;
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("daily-ops-tasks") : null;
    if (raw) taskCount = JSON.parse(raw).length;
  } catch {
    // ignore
  }

  return (
    <AgentCardWrapper
      agentId="chief-of-staff"
      agentName="Chief of Staff"
      icon={<Brain className="w-5 h-5 text-accent-teal" />}
      status={status}
      lastRun={briefTimestamp ? new Date(briefTimestamp).toISOString() : undefined}
      onRun={generateBrief}
    >
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/10 mb-4">
          {error}
        </div>
      )}

      {(signalCount > 0 || taskCount > 0) && brief && (
        <p className="text-xs text-text-muted mb-4 font-mono">
          Synthesized from: {signalCount > 0 && `${signalCount} Market Scout signals`}
          {signalCount > 0 && taskCount > 0 && " + "}
          {taskCount > 0 && `${taskCount} tasks`}
        </p>
      )}

      {briefTimestamp && brief && (
        <p className="text-xs text-text-secondary mb-4 font-mono">
          Generated at {formatTimestamp(briefTimestamp)}
        </p>
      )}

      {status === "running" && sections.length === 0 ? (
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
      ) : status !== "running" && !error ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-text-secondary text-sm">
            Click Run to get your AI-powered morning briefing. Requires an Anthropic API key.
          </p>
        </div>
      ) : null}
    </AgentCardWrapper>
  );
}
