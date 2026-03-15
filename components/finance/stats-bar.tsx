import type { FinanceStats } from "@/lib/finance-types";

interface StatsBarProps {
  stats: FinanceStats;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR").format(n);

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Toplam Gelir", value: `${fmt(stats.total_revenue)} ₺`, color: "text-text-primary" },
    { label: "Net Tahsilat", value: `${fmt(stats.net_received)} ₺`, color: "text-accent-green" },
    { label: "KDV Borcu", value: `${fmt(stats.kdv_payable)} ₺`, color: "text-accent-red" },
    { label: "Pist (Ay)", value: `${stats.runway_months}`, color: "text-accent-blue" },
  ];

  return (
    <div className="flex gap-3 flex-wrap">
      {items.map((stat) => (
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
