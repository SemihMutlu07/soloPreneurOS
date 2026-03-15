"use client";

import { Activity, DollarSign, Target, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Action {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
  type: string;
}

interface ActionLogPanelProps {
  title?: string;
  actions: Action[];
}

const iconMap: Record<string, React.ElementType> = {
  hiring: UserCheck,
  finance: DollarSign,
  sales: Target,
};

const colorMap: Record<string, string> = {
  hiring: "text-accent-green",
  sales: "text-accent-blue",
  finance: "text-accent-amber",
};

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString();
}

export function ActionLogPanel({ title = "Recent Actions", actions }: ActionLogPanelProps) {
  const entries = actions.slice(0, 15);

  return (
    <aside className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">{title}</h3>
        <div className="card-scroll max-h-[calc(100vh-8rem)] overflow-y-auto space-y-1">
          {entries.map((action) => {
            const Icon = iconMap[action.type] || Activity;
            const iconColor = colorMap[action.type] || "text-accent-primary";

            return (
              <div
                key={action.id}
                className="flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-hover transition-colors"
              >
                <div className={cn("mt-0.5 shrink-0", iconColor)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {action.label}
                  </p>
                  <p className="text-[11px] text-text-muted truncate">
                    {action.detail}
                  </p>
                </div>
                <span className="text-[10px] text-text-muted whitespace-nowrap mt-0.5">
                  {getRelativeTime(action.timestamp)}
                </span>
              </div>
            );
          })}
          {entries.length === 0 && (
            <p className="text-xs text-text-muted px-2 py-4 text-center">
              No recent actions
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
