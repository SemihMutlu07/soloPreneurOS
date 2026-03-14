"use client";

import { Users } from "lucide-react";
import { teacherMetrics, teacherInsightCommentary } from "@/lib/mock-data";

export default function TeacherInsights() {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-accent-amber" />
        <h2 className="text-lg font-semibold font-mono">Teacher Insights</h2>
      </div>

      <div className="space-y-3 mb-4">
        {teacherMetrics.map((metric) => {
          const pct = Math.round((metric.value / metric.total) * 100);
          return (
            <div key={metric.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-secondary">{metric.label}</span>
                <span className="text-sm font-mono text-text-primary">
                  {metric.value}/{metric.total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-bg/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-amber transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">AI Commentary</p>
        {teacherInsightCommentary.map((comment, i) => (
          <p key={i} className="text-xs text-text-secondary leading-relaxed pl-3 border-l-2 border-accent-amber/30">
            {comment}
          </p>
        ))}
      </div>
    </div>
  );
}
