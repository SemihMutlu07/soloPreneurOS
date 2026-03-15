import { StatsBar } from "@/components/finance/stats-bar";
import { InvoiceList } from "@/components/finance/invoice-list";
import { KDVSummaryCard } from "@/components/finance/kdv-summary";
import { DualCurrencyCard } from "@/components/finance/dual-currency-card";
import { TaxProvisionCard } from "@/components/finance/tax-provision-card";
import type { FinanceStats } from "@/lib/finance-types";
import {
  financeInvoices,
  financeKDVSummary,
  financeRunway,
  financeTaxProvisions,
  TCMB_USD_RATE,
} from "@/lib/mock-data";

export default function FinancePage() {
  const stats: FinanceStats = {
    total_revenue: financeInvoices.reduce((s, i) => s + i.gross_amount, 0),
    net_received: financeInvoices
      .filter((i) => i.status === "odendi")
      .reduce((s, i) => s + i.net_amount, 0),
    kdv_payable: financeKDVSummary.payable,
    runway_months: financeRunway.runway_months,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Finance Dashboard
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Gelir, gider ve vergi takibi
        </p>
      </div>

      <StatsBar stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <InvoiceList invoices={financeInvoices} />
          <KDVSummaryCard summary={financeKDVSummary} />
        </div>
        <div className="space-y-6">
          <DualCurrencyCard runway={financeRunway} tcmbRate={TCMB_USD_RATE} />
          <TaxProvisionCard provisions={financeTaxProvisions} />
        </div>
      </div>
    </div>
  );
}
