"use client";

import { useState, useEffect } from "react";
import { Activity, Zap, ChevronRight, Radio, Bot, RotateCcw } from "lucide-react";
import { companyInfo } from "@/lib/mock-data";
import { getProfile, clearProfile } from "@/lib/profile-store";
import { getActiveAgents } from "@/lib/agent-config";
import type { UserProfile } from "@/lib/types";

export default function DashboardHeader() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeAgentCount, setActiveAgentCount] = useState(0);

  useEffect(() => {
    const p = getProfile();
    if (p) {
      setProfile(p);
      const agents = getActiveAgents(p);
      setActiveAgentCount(agents.filter((a) => a.active).length);
    }
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mb-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono text-gray-100">
            soloPreneur<span className="text-accent-teal">OS</span>
          </h1>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-text-muted text-xs">soloPreneurOS</span>
            <ChevronRight className="w-3 h-3 text-text-muted" />
            <span className="text-text-secondary text-xs font-mono">
              {profile ? profile.productName : "/denemeler/ajan-modu"}
            </span>
          </div>
          <p className="text-text-muted text-xs mt-1.5">
            {profile && (
              <span className="text-text-secondary">
                Welcome back, {profile.name}
                <span className="mx-1.5 text-text-muted">&middot;</span>
              </span>
            )}
            {today}
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5 text-sm text-text-secondary">
            <Activity className="w-4 h-4 text-accent-teal" />
            <span>
              <span className="text-gray-100 font-semibold">{companyInfo.students.toLocaleString()}</span>{" "}
              <span className="text-text-secondary">students</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-text-secondary">
            <Zap className="w-4 h-4 text-accent-amber" />
            <span>
              <span className="text-gray-100 font-semibold">${companyInfo.mrr.toLocaleString()}</span>{" "}
              <span className="text-text-secondary">MRR</span>
            </span>
          </div>
          {profile && activeAgentCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Bot className="w-4 h-4 text-accent-blue" />
              <span>
                <span className="text-gray-100 font-semibold">{activeAgentCount}</span>{" "}
                <span className="text-text-secondary">agents</span>
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-soft-pulse" />
            <span className="text-xs text-text-secondary">All systems operational</span>
          </div>
          <button
            onClick={() => {
              clearProfile();
              window.location.reload();
            }}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-amber transition-colors"
            title="Reset & Show Onboarding"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </header>

      {/* Overnight sync bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface border border-border">
        <Radio className="w-3.5 h-3.5 text-accent-teal/50" />
        <p className="text-xs font-mono text-text-secondary leading-relaxed">
          Last AI sync: <span className="text-gray-100">03:47 AM</span>
          <span className="mx-2.5 text-text-muted">·</span>
          <span className="text-gray-100">3 new signals</span>
          <span className="mx-2.5 text-text-muted">·</span>
          <span className="text-gray-100">1 lead activity</span>
          <span className="mx-2.5 text-text-muted">·</span>
          Next sync: <span className="text-gray-100">tonight at 2:00 AM</span>
        </p>
      </div>
    </div>
  );
}
