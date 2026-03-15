import type { TaxProvision } from "@/lib/finance-types";

interface TaxProvisionCardProps {
  provisions: TaxProvision[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR").format(n);

export function TaxProvisionCard({ provisions }: TaxProvisionCardProps) {
  const current = provisions[0];
  if (!current) return null;

  const rows = [
    { label: "Geçici Vergi", amount: current.gecici_vergi_estimate },
    { label: "KDV", amount: current.kdv_payable },
    { label: "SGK (Bağ-Kur)", amount: current.sgk_amount },
  ];

  const progressPct = Math.min(
    100,
    Math.round((current.sgk_amount / current.total_provision) * 100 * 3)
  );

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-text-secondary mb-1">
        Vergi Karşılıkları
      </h3>
      <p className="text-xs text-text-muted mb-4">
        Bu ay ayırman gereken
      </p>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">{row.label}</span>
            <span className="text-sm font-mono text-text-primary">
              {fmt(row.amount)} ₺
            </span>
          </div>
        ))}
        <div className="border-t border-border/50 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-text-primary">Toplam</span>
            <span className="text-sm font-mono font-semibold text-accent-red">
              {fmt(current.total_provision)} ₺
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="bg-surface-elevated rounded-full h-2">
          <div
            className="bg-accent-green rounded-full h-2 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-text-muted mt-2">
          {current.period} dönemi
        </p>
      </div>
    </div>
  );
}
