import type { TaxDeadline } from "@/lib/finance-types";

interface DeadlineCardProps {
  deadline: TaxDeadline;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR").format(n);

const statusLabel: Record<string, string> = {
  bekliyor: "Bekliyor",
  hazirlaniyor: "Hazırlanıyor",
  odendi: "Ödendi",
};

const statusColor: Record<string, string> = {
  bekliyor: "bg-accent-amber/15 text-accent-amber",
  hazirlaniyor: "bg-accent-blue/15 text-accent-blue",
  odendi: "bg-accent-green/15 text-accent-green",
};

export function DeadlineCard({ deadline }: DeadlineCardProps) {
  const dueDate = new Date(deadline.due_date);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let daysColor = "text-accent-green";
  if (daysRemaining < 7) daysColor = "text-accent-red";
  else if (daysRemaining < 30) daysColor = "text-accent-amber";

  return (
    <div className="card flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{deadline.name}</p>
        <p className="text-xs text-text-muted mt-0.5">{deadline.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-mono text-text-secondary">
            {fmt(deadline.estimated_amount)} ₺
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${statusColor[deadline.status]}`}
          >
            {statusLabel[deadline.status]}
          </span>
        </div>
      </div>
      <div className="text-right ml-4">
        <span className={`text-lg font-mono font-semibold ${daysColor}`}>
          {daysRemaining}
        </span>
        <p className="text-xs text-text-muted">gün</p>
      </div>
    </div>
  );
}
