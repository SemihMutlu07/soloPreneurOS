import type { TaxDeadline } from "@/lib/finance-types";

interface DeadlineCardProps {
  deadline: TaxDeadline;
  overrideAmount?: number;
  calculated?: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR").format(n);

const statusLabel: Record<string, string> = {
  bekliyor: "Bekliyor",
  hazirlaniyor: "Hazırlanıyor",
  odendi: "Ödendi",
};

const statusColor: Record<string, string> = {
  bekliyor: "text-[#F59E0B] bg-[#451A03]",
  hazirlaniyor: "text-[#60A5FA] bg-[#1E3A5F]",
  odendi: "text-[#10B981] bg-[#022C22]",
};

export function DeadlineCard({ deadline, overrideAmount, calculated }: DeadlineCardProps) {
  const dueDate = new Date(deadline.due_date);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let daysColor = "text-emerald-400";
  let borderColor = "border-l-emerald-400";
  if (daysRemaining <= 7) {
    daysColor = "text-red-400";
    borderColor = "border-l-red-400";
  } else if (daysRemaining <= 30) {
    daysColor = "text-amber-400";
    borderColor = "border-l-amber-400";
  }

  const displayAmount = overrideAmount ?? deadline.estimated_amount;

  return (
    <div className={`card flex items-center justify-between border-l-2 ${borderColor}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{deadline.name}</p>
        <p className="text-xs text-text-muted mt-0.5">{deadline.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-mono text-text-secondary">
            {fmt(displayAmount)} ₺
          </span>
          {calculated !== undefined && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                calculated
                  ? "text-[#10B981] bg-[#022C22]"
                  : "text-[#F59E0B] bg-[#451A03]"
              }`}
            >
              {calculated ? "Hesaplandı" : "Tahmini"}
            </span>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${statusColor[deadline.status]}`}
          >
            {statusLabel[deadline.status]}
          </span>
        </div>
      </div>
      <div className="text-right ml-4 flex items-center gap-2">
        {daysRemaining <= 7 && (
          <span className="w-2 h-2 rounded-full bg-red-400 animate-soft-pulse" />
        )}
        <div>
          <span className={`text-lg font-mono font-semibold ${daysColor}`}>
            {daysRemaining}
          </span>
          <p className="text-xs text-text-muted">gün</p>
        </div>
      </div>
    </div>
  );
}
