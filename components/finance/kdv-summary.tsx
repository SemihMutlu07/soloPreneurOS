import type { KDVSummary } from "@/lib/finance-types";

interface KDVSummaryCardProps {
  summary: KDVSummary;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR").format(n);

export function KDVSummaryCard({ summary }: KDVSummaryCardProps) {
  const payableColor = summary.payable > 0 ? "text-accent-red" : "text-accent-green";

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-text-secondary mb-4">
        KDV Özeti
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">Hesaplanan KDV</span>
          <span className="text-sm font-mono text-text-primary">
            {fmt(summary.collected)} ₺
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">İndirilecek KDV</span>
          <span className="text-sm font-mono text-text-primary">
            {fmt(summary.paid)} ₺
          </span>
        </div>
        <div className="border-t border-border/50 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-text-primary">
              Ödenecek KDV
            </span>
            <span className={`text-sm font-mono font-semibold ${payableColor}`}>
              {fmt(summary.payable)} ₺
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
