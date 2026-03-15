"use client";

import { useState, useEffect } from "react";
import { Activity, Zap, ChevronRight, Radio, Bot, RotateCcw, Users } from "lucide-react";
import { companyInfo } from "@/lib/mock-data";
import { getProfile, clearProfile } from "@/lib/profile-store";
import { getActiveAgents } from "@/lib/agent-config";
import type { UserProfile } from "@/lib/types";
import Link from "next/link";

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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            soloPreneur<span className="text-accent-orange">OS</span>
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

        {/* Metrics — bigger, more readable */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-border">
            <Activity className="w-5 h-5 text-accent-orange" />
            <div className="flex flex-col">
              <span className="font-bold font-mono text-lg text-text-primary leading-none">{companyInfo.users.toLocaleString()}</span>
              <span className="text-text-secondary text-[11px]">users</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-border">
            <Zap className="w-5 h-5 text-accent-amber" />
            <div className="flex flex-col">
              <span className="font-bold font-mono text-lg text-text-primary leading-none">${companyInfo.mrr.toLocaleString()}</span>
              <span className="text-text-secondary text-[11px]">MRR</span>
            </div>
          </div>
          {profile && activeAgentCount > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-border">
              <Bot className="w-5 h-5 text-accent-blue" />
              <div className="flex flex-col">
                <span className="font-bold font-mono text-lg text-text-primary leading-none">{activeAgentCount}</span>
                <span className="text-text-secondary text-[11px]">agents</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-soft-pulse" />
            <span className="text-xs text-text-secondary">Operational</span>
          </div>
          <button
            onClick={() => {
              clearProfile();
              window.location.reload();
            }}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-orange transition-colors p-2"
            title="Reset & Show Onboarding"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Sync bar + Hiring CTA */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface border border-border min-w-0">
          <Radio className="w-3.5 h-3.5 text-accent-orange/50 shrink-0" />
          <p className="text-xs text-text-secondary leading-relaxed truncate">
            Last sync: <span className="text-text-primary font-medium">03:47 AM</span>
            <span className="mx-2 text-text-muted">&middot;</span>
            <span className="font-mono text-text-primary">3</span> signals
            <span className="mx-2 text-text-muted">&middot;</span>
            <span className="font-mono text-text-primary">1</span> lead activity
          </p>
        </div>
        <Link
          href="/hiring"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-orange/15 border border-accent-orange/30 text-accent-orange font-semibold text-sm hover:bg-accent-orange/25 hover:border-accent-orange/50 transition-all shrink-0"
        >
          <Users className="w-4 h-4" />
          Hiring Pipeline
        </Link>
      </div>
    </div>
  );
}
