import type { RunwayData } from "@/lib/finance-types";

interface DualCurrencyCardProps {
  runway: RunwayData;
  tcmbRate: number;
}

const fmtTL = (n: number) =>
  new Intl.NumberFormat("tr-TR").format(n);

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US").format(n);

export function DualCurrencyCard({ runway, tcmbRate }: DualCurrencyCardProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-medium text-text-secondary mb-4">
        Çift Para Birimi
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">Pist (TL)</span>
          <span className="text-sm font-mono text-text-primary tabular-nums text-right">
            {fmtTL(runway.cash_tl)} ₺
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">Pist (USD)</span>
          <span className="text-sm font-mono text-text-primary tabular-nums text-right">
            ${fmtUSD(runway.cash_usd)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">Aylık Yakım</span>
          <span className="text-sm font-mono text-accent-amber tabular-nums text-right">
            {fmtTL(runway.monthly_burn)} ₺
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">TCMB Kuru</span>
          <span className="text-sm font-mono text-text-muted tabular-nums text-right">
            ₺{tcmbRate.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-border/50">
        <p className="text-xs text-text-muted">
          Geçen aya göre TL&apos;de +%8 büyüdün, USD&apos;de -%2
        </p>
      </div>
    </div>
  );
}
