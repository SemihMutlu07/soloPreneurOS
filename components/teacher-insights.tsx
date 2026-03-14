"use client";

import { Users } from "lucide-react";
import { teacherMetrics, teacherInsightCommentary } from "@/lib/mock-data";

export default function TeacherInsights() {
  return (
    <div className="card">
      <div className="flex items-center gap-2.5 mb-5">
        <Users className="w-5 h-5 text-accent-amber" />
        <h2 className="text-base font-semibold font-mono text-gray-100">Teacher Insights</h2>
      </div>

      <div className="space-y-4 mb-5">
        {teacherMetrics.map((metric) => {
          const pct = Math.round((metric.value / metric.total) * 100);
          return (
            <div key={metric.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-text-secondary">{metric.label}</span>
                <span className="text-sm font-mono text-gray-100">
                  {metric.value}/{metric.total}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-amber/70 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2.5">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">AI Commentary</p>
        {teacherInsightCommentary.map((comment, i) => (
          <p key={i} className="text-xs text-text-secondary leading-relaxed pl-3.5 border-l-2 border-accent-amber/20">
            {comment}
          </p>
        ))}
      </div>
    </div>
  );
}
