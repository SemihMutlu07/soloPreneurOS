import { Mail, Send, StickyNote, ArrowRightLeft, Phone, Calendar } from "lucide-react";
import type { SalesActivity } from "@/lib/sales-types";

interface ActivityTimelineProps {
  activities: SalesActivity[];
}

const ACTIVITY_ICONS: Record<SalesActivity["type"], typeof Mail> = {
  email_received: Mail,
  email_sent: Send,
  note: StickyNote,
  status_change: ArrowRightLeft,
  call: Phone,
  meeting: Calendar,
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  const diffM = Math.floor(diffD / 30);
  return `${diffM}mo ago`;
}

const CREATED_BY_STYLES: Record<string, string> = {
  ai: "bg-[#1E3A5F] text-[#60A5FA]",
  system: "bg-surface-elevated text-text-muted",
  user: "bg-[#022C22] text-[#10B981]",
};

const CREATED_BY_LABELS: Record<string, string> = {
  ai: "AI",
  system: "System",
  user: "You",
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-text-muted text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="card space-y-0 max-h-[60vh] overflow-y-auto">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
        Activity
      </h3>
      <div className="relative pl-6 border-l border-border space-y-5">
        {sorted.map((activity) => {
          const Icon = ACTIVITY_ICONS[activity.type] ?? Mail;
          return (
            <div key={activity.id} className="relative">
              {/* Icon on the line */}
              <div className="absolute -left-[calc(0.75rem+13px)] top-0.5 w-[26px] h-[26px] rounded-full bg-surface-elevated border border-border flex items-center justify-center">
                <Icon size={13} className="text-text-muted" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-text-muted">{relativeTime(activity.created_at)}</span>
                  {activity.created_by && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CREATED_BY_STYLES[activity.created_by] ?? CREATED_BY_STYLES.system}`}>
                      {CREATED_BY_LABELS[activity.created_by] ?? activity.created_by}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-text-primary">{activity.subject}</p>
                {activity.body && (
                  <p className="text-xs text-text-secondary leading-relaxed">{activity.body}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
