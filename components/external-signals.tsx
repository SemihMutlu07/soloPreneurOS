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
  reddit: { icon: MessageCircle, color: "text-orange-400", label: "Reddit" },
  hackernews: { icon: Flame, color: "text-amber-400", label: "Hacker News" },
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

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  void now;

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2.5 mb-5">
          <Radar className="w-5 h-5 text-accent-teal" />
          <h2 className="text-base font-semibold font-mono text-gray-100">External Signals</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-surface-elevated/50 animate-pulse">
              <div className="h-3 bg-surface-hover rounded w-1/4 mb-3" />
              <div className="h-4 bg-surface-hover rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface-hover rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2.5 mb-5">
        <Radar className="w-5 h-5 text-accent-teal" />
        <h2 className="text-base font-semibold font-mono text-gray-100">External Signals</h2>
      </div>
      {signals.length === 0 ? (
        <p className="text-sm text-text-secondary py-4">
          No signals available right now. Check back shortly.
        </p>
      ) : (
      <div className="space-y-2.5">
        {signals.map((signal, idx) => {
          const config = sourceConfig[signal.source];
          const Icon = config.icon;
          const isHighlighted = idx === 0;
          return (
            <div
              key={signal.id}
              className={cn(
                "p-3.5 rounded-xl transition-colors",
                isHighlighted
                  ? "bg-surface-elevated/60"
                  : "bg-surface-elevated/30 hover:bg-surface-hover"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={cn("w-4 h-4", config.color)} />
                <span className={cn("text-xs font-medium", config.color)}>
                  {config.label}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px]",
                    signal.live ? "text-emerald-400" : "text-text-secondary"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      signal.live ? "bg-emerald-400" : "bg-text-muted"
                    )}
                  />
                  {signal.live ? "Live" : "Cached"}
                </span>
                <span className="text-xs text-text-secondary ml-auto">
                  {signal.timestamp}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-100 leading-relaxed">
                {signal.title}
              </p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {signal.summary}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="w-3 h-3 text-text-muted" />
                <span className="text-xs font-semibold font-mono text-gray-100">
                  {signal.score}
                </span>
                <span className="text-xs text-text-secondary">score</span>
              </div>
            </div>
          );
        })}
      </div>
      )}
      {fetchedAt && (
        <p className="text-xs text-text-secondary mt-4 text-right">
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
