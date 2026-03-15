import { FileText } from "lucide-react";
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
  odendi: "text-[#10B981] bg-[#022C22]",
  beklemede: "text-[#F59E0B] bg-[#451A03]",
  gecmis: "text-[#F87171] bg-[#450A0A]",
};

export function InvoiceList({ invoices }: InvoiceListProps) {
  const recent = invoices.slice(0, 6);

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
                className={`text-xs px-2 py-0.5 rounded-full ${statusColor[inv.status] || ""}`}
              >
                {statusLabel[inv.status] || inv.status}
              </span>
            </div>
          </div>
        ))}
        {recent.length === 0 && (
          <div className="py-10 flex flex-col items-center gap-3">
            <FileText className="w-8 h-8 text-text-muted/40" strokeWidth={1.5} />
            <p className="text-text-muted text-sm">Henüz fatura yok</p>
            <p className="text-xs text-text-muted/60">Soldaki formu kullanarak ilk faturanı oluştur</p>
          </div>
        )}
      </div>
    </div>
  );
}
