import type { SalesLead } from "@/lib/sales-types";

interface StatsBarProps {
  leads: SalesLead[];
}

export function StatsBar({ leads }: StatsBarProps) {
  const total = leads.length;
  const qualified = leads.filter((l) => l.stage === "qualified").length;
  const hot = leads.filter((l) => l.ai_score >= 70).length;
  const closing = leads.filter(
    (l) => l.stage === "negotiation" || l.stage === "proposal",
  ).length;
  const nonNew = leads.filter((l) => l.stage !== "new");
  const won = leads.filter((l) => l.stage === "won").length;
  const conversionRate = nonNew.length > 0 ? Math.round((won / nonNew.length) * 100) : 0;

  const stats = [
    { label: "Total Leads", value: String(total), color: "text-text-primary" },
    { label: "Qualified", value: String(qualified), color: "text-accent-blue" },
    { label: "Hot Leads", value: String(hot), color: "text-accent-red" },
    { label: "Closing", value: String(closing), color: "text-accent-amber" },
    { label: "Conversion", value: `${conversionRate}%`, color: "text-accent-green" },
  ];

  return (
    <div className="flex gap-3 flex-wrap">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="card flex flex-col items-center px-5 py-3 min-w-[100px]"
        >
          <span className={`text-2xl font-semibold font-mono ${stat.color}`}>
            {stat.value}
          </span>
          <span className="text-xs text-text-secondary mt-1">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
