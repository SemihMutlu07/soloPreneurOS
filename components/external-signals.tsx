"use client";

import { useState, useEffect } from "react";
import { Radar, ArrowUpRight, TrendingUp, MessageCircle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

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
  "product-hunt": { icon: ArrowUpRight, color: "text-orange-400", label: "Product Hunt" },
  reddit: { icon: MessageCircle, color: "text-orange-500", label: "Reddit" },
  hackernews: { icon: Flame, color: "text-orange-500", label: "Hacker News" },
};

function timeAgo(date: Date): string {
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
}

export default function ExternalSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    async function fetchSignals() {
      try {
        const [phRes, redditRes, hnRes] = await Promise.all([
          fetch("/api/signals/producthunt").then((r) => r.json()),
          fetch("/api/signals/reddit").then((r) => r.json()),
          fetch("/api/signals/hackernews").then((r) => r.json()),
        ]);

        const normalized: Signal[] = [];

        // Product Hunt
        const phLive = phRes.source === "live";
        for (const p of phRes.posts) {
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

        // Reddit
        const redditLive = redditRes.source === "live";
        for (const p of redditRes.posts) {
          normalized.push({
            id: `reddit-${p.permalink || p.id}`,
            source: "reddit",
            title: redditLive ? `r/${p.subreddit}: ${p.title}` : p.title,
            summary: redditLive
              ? `${p.num_comments} comments`
              : p.summary || "",
            score: p.score ?? 0,
            timestamp: redditLive
              ? formatUtc(p.created_utc)
              : p.timestamp || "",
            url: redditLive
              ? `https://reddit.com${p.permalink}`
              : undefined,
            live: redditLive,
          });
        }

        // Hacker News
        const hnLive = hnRes.source === "live";
        for (const s of hnRes.stories) {
          normalized.push({
            id: `hn-${s.id || s.title}`,
            source: "hackernews",
            title: s.title,
            summary: hnLive
              ? `${s.descendants ?? 0} comments · by ${s.by}`
              : s.summary || "",
            score: s.score ?? 0,
            timestamp: hnLive ? "Today" : s.timestamp || "",
            url: s.url,
            live: hnLive,
          });
        }

        setSignals(normalized);
        setFetchedAt(new Date());
      } catch {
        setSignals([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSignals();
  }, []);

  // Update "X min ago" every 30s
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Suppress unused variable warning — `now` drives re-renders for timeAgo
  void now;

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Radar className="w-5 h-5 text-accent-teal" />
          <h2 className="text-lg font-semibold font-mono">External Signals</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-bg/50 animate-pulse">
              <div className="h-3 bg-surface-elevated rounded w-1/4 mb-2" />
              <div className="h-4 bg-surface-elevated rounded w-3/4 mb-1" />
              <div className="h-3 bg-surface-elevated rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Radar className="w-5 h-5 text-accent-teal" />
        <h2 className="text-lg font-semibold font-mono">External Signals</h2>
      </div>
      <div className="space-y-2">
        {signals.map((signal, idx) => {
          const config = sourceConfig[signal.source];
          const Icon = config.icon;
          const isHighlighted = idx === 0;
          return (
            <div
              key={signal.id}
              className={cn(
                "p-3 rounded-xl transition-colors",
                isHighlighted
                  ? "bg-surface-elevated"
                  : "bg-bg/50 hover:bg-surface-hover"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn("w-4 h-4", config.color)} />
                <span className={cn("text-xs font-medium", config.color)}>
                  {config.label}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px]",
                    signal.live ? "text-green-400" : "text-text-muted"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      signal.live ? "bg-green-400" : "bg-text-muted"
                    )}
                  />
                  {signal.live ? "Live" : "Cached"}
                </span>
                <span className="text-xs text-text-muted ml-auto">
                  {signal.timestamp}
                </span>
              </div>
              <p className="text-sm font-medium text-text-primary">
                {signal.title}
              </p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {signal.summary}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-text-muted" />
                <span className="text-xs font-semibold font-mono text-text-primary">
                  {signal.score}
                </span>
                <span className="text-xs text-text-muted">score</span>
              </div>
            </div>
          );
        })}
      </div>
      {fetchedAt && (
        <p className="text-xs text-text-muted mt-3 text-right">
          Updated {timeAgo(fetchedAt)}
        </p>
      )}
    </div>
  );
}

function formatUtc(utc: number): string {
  const hours = Math.round((Date.now() / 1000 - utc) / 3600);
  if (hours < 1) return "just now";
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}
