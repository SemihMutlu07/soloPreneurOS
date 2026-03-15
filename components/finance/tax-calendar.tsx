import type { TaxDeadline } from "@/lib/finance-types";
import { DeadlineCard } from "./deadline-card";

interface TaxCalendarProps {
  deadlines: TaxDeadline[];
}

const turkishMonths = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function TaxCalendar({ deadlines }: TaxCalendarProps) {
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

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([month, items]) => (
        <div key={month}>
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            {month}
          </h3>
          <div className="space-y-3 relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50" />
            <div className="space-y-3 pl-8">
              {items.map((dl) => (
                <DeadlineCard key={dl.id} deadline={dl} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
