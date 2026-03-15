import type { Invoice } from "@/lib/finance-types";

interface InvoiceListProps {
  invoices: Invoice[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR").format(n);

const statusLabel: Record<string, string> = {
  odendi: "Ödendi",
  beklemede: "Beklemede",
  gecmis: "Geçmiş",
};

const statusColor: Record<string, string> = {
  odendi: "bg-accent-green/15 text-accent-green",
  beklemede: "bg-accent-amber/15 text-accent-amber",
  gecmis: "bg-accent-red/15 text-accent-red",
};

export function InvoiceList({ invoices }: InvoiceListProps) {
  const recent = invoices.slice(0, 5);

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-text-secondary mb-4">
        Son Faturalar
      </h3>
      <div className="space-y-0">
        {recent.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between border-b border-border/50 py-3 last:border-b-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">
                {inv.client_name}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {new Date(inv.created_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-text-primary">
                {fmt(inv.gross_amount)} ₺
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${statusColor[inv.status]}`}
              >
                {statusLabel[inv.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
