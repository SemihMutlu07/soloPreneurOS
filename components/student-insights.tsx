"use client";

import { GraduationCap, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { studentMetrics, studentInsightCommentary } from "@/lib/mock-data";

export default function StudentInsights() {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-accent-teal" />
        <h2 className="text-lg font-semibold font-mono">Student Insights</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {studentMetrics.map((metric) => (
          <div key={metric.label} className="p-3 rounded-lg bg-bg/50">
            <p className="text-xs text-text-muted">{metric.label}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-semibold font-mono text-text-primary">
                {metric.value.toLocaleString()}
              </span>
              {metric.unit && <span className="text-xs text-text-muted">{metric.unit}</span>}
            </div>
            <div className={cn("flex items-center gap-1 mt-1 text-xs", metric.change >= 0 ? "text-accent-green" : "text-accent-red")}>
              {metric.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {metric.change >= 0 ? "+" : ""}
              {metric.change}%
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider">AI Commentary</p>
        {studentInsightCommentary.map((comment, i) => (
          <p key={i} className="text-xs text-text-secondary leading-relaxed pl-3 border-l-2 border-accent-teal/30">
            {comment}
          </p>
        ))}
      </div>
    </div>
  );
}
