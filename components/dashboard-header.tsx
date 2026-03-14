"use client";

import { Activity, Zap, ChevronRight } from "lucide-react";
import { companyInfo } from "@/lib/mock-data";

export default function DashboardHeader() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.04] pb-6 mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-mono">
          soloPreneur<span className="text-accent-teal">OS</span>
        </h1>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-text-muted text-xs">soloPreneurOS</span>
          <ChevronRight className="w-3 h-3 text-text-muted" />
          <span className="text-text-secondary text-xs font-mono">/denemeler/ajan-modu</span>
        </div>
        <p className="text-text-muted text-xs mt-1">{today}</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Activity className="w-4 h-4 text-accent-teal" />
          <span>
            <span className="text-text-primary font-medium">{companyInfo.students.toLocaleString()}</span> students
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Zap className="w-4 h-4 text-accent-amber" />
          <span>
            <span className="text-text-primary font-medium">${companyInfo.mrr.toLocaleString()}</span> MRR
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-soft-pulse" />
          <span className="text-xs text-text-muted">All systems operational</span>
        </div>
      </div>
    </header>
  );
}
