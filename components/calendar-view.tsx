"use client";

import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { calendarEvents, type CalendarEvent } from "@/lib/mock-data";

const typeConfig: Record<CalendarEvent["type"], { color: string; bg: string }> = {
  meeting: { color: "border-l-accent-blue", bg: "bg-accent-blue/5" },
  focus: { color: "border-l-emerald-300", bg: "bg-emerald-500/5" },
  break: { color: "border-l-text-muted", bg: "bg-surface-elevated/20" },
  external: { color: "border-l-accent-amber", bg: "bg-accent-amber/5" },
};

export default function CalendarView() {
  return (
    <div className="card">
      <div className="flex items-center gap-2.5 mb-4">
        <Calendar className="w-5 h-5 text-accent-blue" />
        <h2 className="text-sm font-semibold text-text-primary">Today&apos;s Schedule</h2>
      </div>
      <div className="space-y-1.5 card-scroll">
        {calendarEvents.map((event) => {
          const config = typeConfig[event.type];
          return (
            <div
              key={event.id}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-xl border-l-2 transition-colors",
                config.color,
                config.bg
              )}
            >
              <div className="w-11 shrink-0">
                <span className="text-[11px] font-mono text-text-muted">{event.time}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-text-primary truncate">{event.title}</p>
              </div>
              <div className="flex items-center gap-1 text-text-muted shrink-0">
                <Clock className="w-3 h-3" />
                <span className="text-[11px] font-mono">{event.duration}m</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
