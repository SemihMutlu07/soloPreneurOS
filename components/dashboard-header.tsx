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
    <div className="mb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            soloPreneur<span className="text-accent-teal">OS</span>
          </h1>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-text-muted text-xs">soloPreneurOS</span>
            <ChevronRight className="w-3 h-3 text-text-muted" />
            <span className="text-text-secondary text-xs">
              {profile ? profile.productName : "dashboard"}
            </span>
          </div>
          <p className="text-text-muted text-xs mt-1">
            {profile && (
              <span className="text-text-secondary">
                Welcome back, {profile.name}
                <span className="mx-1.5 text-text-muted">&middot;</span>
              </span>
            )}
            {today}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-accent-teal" />
            <span className="font-semibold font-mono text-text-primary">{companyInfo.students.toLocaleString()}</span>
            <span className="text-text-secondary text-xs">students</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-accent-amber" />
            <span className="font-semibold font-mono text-text-primary">${companyInfo.mrr.toLocaleString()}</span>
            <span className="text-text-secondary text-xs">MRR</span>
          </div>
          {profile && activeAgentCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Bot className="w-4 h-4 text-accent-blue" />
              <span className="font-semibold font-mono text-text-primary">{activeAgentCount}</span>
              <span className="text-text-secondary text-xs">agents</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-soft-pulse" />
            <span className="text-xs text-text-secondary">Operational</span>
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
          </button>
        </div>
      </header>

      {/* Overnight sync bar */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface border border-border">
        <Radio className="w-3.5 h-3.5 text-accent-teal/40" />
        <p className="text-xs text-text-secondary leading-relaxed">
          Last sync: <span className="text-text-primary font-medium">03:47 AM</span>
          <span className="mx-2 text-text-muted">&middot;</span>
          <span className="font-mono text-text-primary">3</span> signals
          <span className="mx-2 text-text-muted">&middot;</span>
          <span className="font-mono text-text-primary">1</span> lead activity
        </p>
      </div>
    </div>
  );
}
