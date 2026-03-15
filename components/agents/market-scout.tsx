"use client";

import { useState, useEffect, useCallback } from "react";
import { Radar, TrendingUp, ArrowUpRight, MessageCircle, Flame, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAgentResult, setAgentResult, isStale } from "@/lib/agent-store";
import AgentCardWrapper from "./agent-card-wrapper";

interface Signal {
  id: string;
  source: "product-hunt" | "reddit" | "hackernews";
  title: string;
  summary: string;
  score: number;
  timestamp: string;
  url?: string;
  live: boolean;
}

const sourceConfig: Record<
  Signal["source"],
  { icon: typeof Radar; color: string; label: string }
> = {
  "product-hunt": { icon: ArrowUpRight, color: "text-accent-primary", label: "Product Hunt" },
  reddit: { icon: MessageCircle, color: "text-accent-primary", label: "Reddit" },
  hackernews: { icon: Flame, color: "text-accent-amber", label: "Hacker News" },
};

function formatUtc(utc: number): string {
  const hours = Math.round((Date.now() / 1000 - utc) / 3600);
  if (hours < 1) return "just now";
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

function normalizeSignals(phRes: any, redditRes: any, hnRes: any): Signal[] {
  const normalized: Signal[] = [];

  const phLive = phRes.source === "live";
  for (const p of phRes.posts || []) {
    normalized.push({
      id: `ph-${p.name || p.id}`,
      source: "product-hunt",
      title: p.name || p.title,
      summary: p.tagline || p.summary || "",
      score: p.votesCount ?? p.score ?? 0,
      timestamp: phLive ? "Today" : p.timestamp || "Today",
      url: p.url,
      live: phLive,
    });
  }

  const redditLive = redditRes.source === "live";
  for (const p of redditRes.posts || []) {
    normalized.push({
      id: `reddit-${p.permalink || p.id}`,
      source: "reddit",
      title: redditLive ? `r/${p.subreddit}: ${p.title}` : p.title,
      summary: redditLive ? `${p.num_comments} comments` : p.summary || "",
      score: p.score ?? 0,
      timestamp: redditLive ? formatUtc(p.created_utc) : p.timestamp || "",
      url: redditLive ? `https://reddit.com${p.permalink}` : undefined,
      live: redditLive,
    });
  }

  const hnLive = hnRes.source === "live";
  for (const s of hnRes.stories || []) {
    normalized.push({
      id: `hn-${s.id || s.title}`,
      source: "hackernews",
      title: s.title,
      summary: hnLive ? `${s.descendants ?? 0} comments · by ${s.by}` : s.summary || "",
      score: s.score ?? 0,
      timestamp: hnLive ? "Today" : s.timestamp || "",
      url: s.url,
      live: hnLive,
    });
  }

  return normalized;
}

export default function MarketScout() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRun, setLastRun] = useState<string | undefined>();
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setStatus("running");
    try {
      const [phRes, redditRes, hnRes] = await Promise.all([
        fetch("/api/signals/producthunt").then((r) => r.json()),
        fetch("/api/signals/reddit").then((r) => r.json()),
        fetch("/api/signals/hackernews").then((r) => r.json()),
      ]);

      const normalized = normalizeSignals(phRes, redditRes, hnRes);
      const highPriority = normalized.filter((s) => s.score > 100).length;

      setSignals(normalized);
      setAgentResult(
        "market-scout",
        { signals: normalized, raw: { phRes, redditRes, hnRes } },
        "success",
        `Found ${normalized.length} signals, ${highPriority} high-priority`
      );
      setStatus("success");
      setLastRun(new Date().toISOString());
    } catch {
      setSignals([]);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = getAgentResult("market-scout");
    if (cached && !isStale("market-scout", 360)) {
      setSignals(cached.data.signals || []);
      setLastRun(cached.timestamp);
      setStatus("success");
      setLoading(false);
    } else {
      fetchSignals();
    }
  }, [fetchSignals]);

  const highPriorityCount = signals.filter((s) => s.score > 100).length;

  return (
    <AgentCardWrapper
      agentId="market-scout"
      agentName="Market Scout"
      icon={<Radar className="w-5 h-5 text-accent-primary" />}
      status={status}
      lastRun={lastRun}
      onRun={fetchSignals}
    >
      {signals.length > 0 && !loading && (
        <p className="text-[11px] text-text-muted mb-3">
          {signals.length} signals, {highPriorityCount} high-priority
        </p>
      )}

      {loading && signals.length === 0 ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-surface-elevated/30 animate-pulse">
              <div className="h-2.5 bg-surface-hover rounded w-1/4 mb-2.5" />
              <div className="h-3 bg-surface-hover rounded w-3/4 mb-1.5" />
              <div className="h-2.5 bg-surface-hover rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : signals.length === 0 ? (
        <p className="text-sm text-text-muted py-4">
          No signals available. Click Run to refresh.
        </p>
      ) : (
        <div className="space-y-2 card-scroll">
          {signals.map((signal, idx) => {
            const config = sourceConfig[signal.source];
            const Icon = config.icon;
            const isHighlighted = idx === 0;
            const Wrapper = signal.url ? "a" : "div";
            const linkProps = signal.url
              ? { href: signal.url, target: "_blank" as const, rel: "noopener noreferrer" }
              : {};
            return (
              <Wrapper
                key={signal.id}
                {...linkProps}
                className={cn(
                  "block p-3 rounded-xl transition-colors",
                  isHighlighted
                    ? "bg-surface-elevated/50"
                    : "bg-surface-elevated/20 hover:bg-surface-hover",
                  signal.url && "cursor-pointer"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("w-3.5 h-3.5", config.color)} />
                  <span className={cn("text-[11px] font-medium", config.color)}>
                    {config.label}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[10px]",
                      signal.live ? "text-accent-green" : "text-text-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        signal.live ? "bg-accent-green" : "bg-text-muted"
                      )}
                    />
                    {signal.live ? "Live" : "Cached"}
                  </span>
                  <span className="text-[11px] text-text-muted ml-auto flex items-center gap-1">
                    {signal.timestamp}
                    {signal.url && <ExternalLink className="w-3 h-3" />}
                  </span>
                </div>
                <p className="text-[13px] font-medium text-text-primary leading-snug">
                  {signal.title}
                </p>
                <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                  {signal.summary}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <TrendingUp className="w-3 h-3 text-text-muted" />
                  <span className="text-[11px] font-semibold font-mono text-text-primary">
                    {signal.score}
                  </span>
                  <span className="text-[11px] text-text-muted">score</span>
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </AgentCardWrapper>
  );
}
