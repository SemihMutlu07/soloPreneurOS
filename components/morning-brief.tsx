"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

export default function MorningBrief() {
  const [brief, setBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateBrief() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brief", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate brief");
      }
      const data = await res.json();
      setBrief(data.brief);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card col-span-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-teal" />
          <h2 className="text-lg font-semibold font-mono">Morning Brief</h2>
          <span className="text-xs text-text-muted font-mono ml-2">/ ajan modu</span>
        </div>
        <button
          onClick={generateBrief}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-accent-teal/15 text-accent-teal hover:bg-accent-teal/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed animate-halo"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 animate-gentle-spin" />
              Generate Brief
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-accent-red/8 text-accent-red text-sm">
          {error}
        </div>
      )}

      {brief ? (
        <div className="prose prose-invert prose-sm max-w-none">
          {brief.split("\n").map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            if (line.startsWith("##"))
              return (
                <h3 key={i} className="text-base font-semibold font-mono text-text-primary mt-4 mb-2">
                  {line.replace(/^#+\s*/, "")}
                </h3>
              );
            if (line.startsWith("- ") || line.startsWith("* "))
              return (
                <p key={i} className="text-text-secondary text-sm pl-4 py-0.5">
                  <span className="text-accent-teal mr-2">-</span>
                  {line.replace(/^[-*]\s*/, "")}
                </p>
              );
            if (line.startsWith("**"))
              return (
                <p key={i} className="text-text-primary text-sm font-medium mt-3">
                  {line.replace(/\*\*/g, "")}
                </p>
              );
            return (
              <p key={i} className="text-text-secondary text-sm leading-relaxed">
                {line}
              </p>
            );
          })}
        </div>
      ) : !loading && !error ? (
        <p className="text-text-muted text-sm italic">
          Click &quot;Generate Brief&quot; to get your AI-powered morning briefing. Requires an Anthropic API key.
        </p>
      ) : null}
    </div>
  );
}
