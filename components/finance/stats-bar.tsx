import type { FinanceStats } from "@/lib/finance-types";

interface StatsBarProps {
  stats: FinanceStats;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR").format(n);

export function StatsBar({ stats }: StatsBarProps) {
  const kdvColor = stats.kdv_payable > 0 ? "text-[#EF4444]" : "text-[#10B981]";

  const items = [
    { label: "Toplam Gelir", value: `${fmt(stats.total_revenue)} ₺`, color: "text-text-primary" },
    { label: "Net Tahsilat", value: `${fmt(stats.net_received)} ₺`, color: "text-accent-green" },
    { label: "KDV Borcu", value: `${fmt(stats.kdv_payable)} ₺`, color: kdvColor },
    { label: "Pist (Ay)", value: `${stats.runway_months}`, color: "text-accent-blue" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((stat, i) => (
        <div
          key={stat.label}
          className={`card flex flex-col items-center px-3 md:px-5 py-3 ${
            i > 0 ? "md:border-l md:border-l-border/50" : ""
          }`}
        >
          <span className={`text-2xl font-semibold font-mono ${stat.color}`}>
            {stat.value}
          </span>
          <span className="text-sm text-text-secondary mt-1">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
