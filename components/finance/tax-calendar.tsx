"use client";

import { useState } from "react";
import { List, Grid3x3 } from "lucide-react";
import type { TaxDeadline } from "@/lib/finance-types";
import { DeadlineCard } from "./deadline-card";

interface TaxCalendarProps {
  deadlines: TaxDeadline[];
}

const turkishMonths = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const turkishDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getMonthYear(key: string): { month: number; year: number } {
  const parts = key.split(" ");
  const year = parseInt(parts[parts.length - 1], 10);
  const monthName = parts.slice(0, -1).join(" ");
  const month = turkishMonths.indexOf(monthName);
  return { month, year };
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getStartDayOfWeek(month: number, year: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday-based: Mon=0, Sun=6
  return day === 0 ? 6 : day - 1;
}

export function TaxCalendar({ deadlines }: TaxCalendarProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const sorted = [...deadlines].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const grouped = sorted.reduce<Record<string, TaxDeadline[]>>((acc, dl) => {
    const date = new Date(dl.due_date);
    const key = `${turkishMonths[date.getMonth()]} ${date.getFullYear()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(dl);
    return acc;
  }, {});

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  return (
    <div className="space-y-6">
      {/* View mode toggle */}
      <div className="flex gap-1 p-1 bg-surface-elevated rounded-xl w-fit mb-4">
        <button
          onClick={() => setViewMode("list")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "list"
              ? "bg-surface text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <List className="h-4 w-4" />
          List
        </button>
        <button
          onClick={() => setViewMode("grid")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "grid"
              ? "bg-surface text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <Grid3x3 className="h-4 w-4" />
          Grid
        </button>
      </div>

      {Object.entries(grouped).map(([month, items]) => (
        <div key={month}>
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            {month}
          </h3>

          {viewMode === "list" ? (
            <div className="space-y-3">
              {items.map((dl) => (
                <DeadlineCard
                  key={dl.id}
                  deadline={dl}
                />
              ))}
            </div>
          ) : (
            (() => {
              const { month: m, year } = getMonthYear(month);
              const daysInMonth = getDaysInMonth(m, year);
              const startDay = getStartDayOfWeek(m, year);

              // Map deadline days for this month
              const deadlinesByDay: Record<number, TaxDeadline[]> = {};
              items.forEach((dl) => {
                const d = new Date(dl.due_date).getDate();
                if (!deadlinesByDay[d]) deadlinesByDay[d] = [];
                deadlinesByDay[d].push(dl);
              });

              return (
                <div>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {turkishDays.map((day) => (
                      <div
                        key={day}
                        className="text-xs text-text-muted text-center font-medium py-1"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells before month start */}
                    {Array.from({ length: startDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-10" />
                    ))}

                    {/* Day cells */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const hasDeadline = !!deadlinesByDay[day];
                      const isToday =
                        todayStr === `${year}-${m}-${day}`;

                      return (
                        <div
                          key={day}
                          className={`relative h-10 flex flex-col items-center justify-center rounded-lg text-xs group ${
                            hasDeadline
                              ? "bg-accent-amber/10 text-accent-amber font-medium"
                              : "text-text-muted"
                          } ${isToday ? "ring-1 ring-accent-primary" : ""}`}
                        >
                          {day}
                          {hasDeadline && (
                            <>
                              <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent-amber" />
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 bg-surface-elevated text-text-primary text-xs rounded-lg shadow-lg px-2 py-1 whitespace-nowrap">
                                {deadlinesByDay[day]
                                  .map((dl) => dl.name)
                                  .join(", ")}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      ))}
    </div>
  );
}
