"use client";

import { useState, useEffect } from "react";
import { StatsBar } from "@/components/finance/stats-bar";
import { InvoiceList } from "@/components/finance/invoice-list";
import { InvoiceForm } from "@/components/finance/invoice-form";
import { KDVSummaryCard } from "@/components/finance/kdv-summary";
import { DualCurrencyCard } from "@/components/finance/dual-currency-card";
import { TaxProvisionCard } from "@/components/finance/tax-provision-card";
import type {
  FinanceStats,
  Invoice,
  KDVSummary,
  RunwayData,
  TaxProvision,
} from "@/lib/finance-types";

const TCMB_USD_RATE = 32.5;

const STATIC_RUNWAY: RunwayData = {
  cash_tl: 245000,
  cash_usd: Math.round(245000 / 32.5),
  monthly_burn: 22000,
  runway_months: Math.round(245000 / 22000),
};

const STATIC_KDV_PAID = 6640; // matches original financeKDVSummary.paid

const STATIC_TAX_PROVISIONS: TaxProvision[] = [
  {
    id: "00000000-0000-0000-0003-000000000001",
    user_id: "00000000-0000-0000-0000-000000000001",
    period: "2026-Q1",
    kdv_payable: 3200,
    gecici_vergi_estimate: 8400,
    sgk_amount: 2800,
    total_provision: 14400,
    created_at: "2026-03-01T00:00:00Z",
  },
];

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/finance/invoices")
      .then((r) => r.json())
      .then((data) => {
        setInvoices(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Veriler yüklenemedi");
        setLoading(false);
      });
  }, []);

  const kdvSummary: KDVSummary = {
    collected: invoices.reduce((s, i) => s + i.kdv_amount, 0),
    paid: STATIC_KDV_PAID,
    payable: invoices.reduce((s, i) => s + i.kdv_amount, 0) - STATIC_KDV_PAID,
  };

  const stats: FinanceStats = {
    total_revenue: invoices.reduce((s, i) => s + i.gross_amount, 0),
    net_received: invoices
      .filter((i) => i.status === "odendi")
      .reduce((s, i) => s + i.net_amount, 0),
    kdv_payable: kdvSummary.payable,
    runway_months: STATIC_RUNWAY.runway_months,
  };

  const handleInvoiceSaved = (invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
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

      {loading && (
        <p className="text-sm text-text-secondary">Yükleniyor...</p>
      )}

      {error && (
        <p className="text-sm text-accent-red">{error}</p>
      )}

      {!loading && !error && (
        <>
          <StatsBar stats={stats} />

          <InvoiceForm onSave={handleInvoiceSaved} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <InvoiceList invoices={invoices} />
              <KDVSummaryCard summary={kdvSummary} />
            </div>
            <div className="space-y-6">
              <DualCurrencyCard runway={STATIC_RUNWAY} tcmbRate={TCMB_USD_RATE} />
              <TaxProvisionCard provisions={STATIC_TAX_PROVISIONS} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
