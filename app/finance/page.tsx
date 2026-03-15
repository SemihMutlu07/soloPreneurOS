"use client";

import { useState, useEffect } from "react";
import { StatsBar } from "@/components/finance/stats-bar";
import { InvoiceList } from "@/components/finance/invoice-list";
import { KDVSummaryCard } from "@/components/finance/kdv-summary";
import { DualCurrencyCard } from "@/components/finance/dual-currency-card";
import { TaxProvisionCard } from "@/components/finance/tax-provision-card";
import type { FinanceStats, Invoice, KDVSummary } from "@/lib/finance-types";
import {
  financeInvoices,
  financeKDVSummary,
  financeRunway,
  financeTaxProvisions,
  TCMB_USD_RATE,
} from "@/lib/mock-data";

const STORAGE_KEY = "finance_invoices";

function loadSavedInvoices(): Invoice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function FinancePage() {
  const [allInvoices, setAllInvoices] = useState<Invoice[]>(financeInvoices);
  const [kdvSummary, setKdvSummary] = useState<KDVSummary>(financeKDVSummary);

  useEffect(() => {
    const saved = loadSavedInvoices();
    const merged = [...saved, ...financeInvoices];
    merged.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setAllInvoices(merged);

    // Recalculate KDV if user invoices exist
    if (saved.length > 0) {
      const totalCollected =
        merged.reduce((s, i) => s + i.kdv_amount, 0);
      setKdvSummary({
        collected: totalCollected,
        paid: financeKDVSummary.paid,
        payable: totalCollected - financeKDVSummary.paid,
      });
    }
  }, []);

  const stats: FinanceStats = {
    total_revenue: allInvoices.reduce((s, i) => s + i.gross_amount, 0),
    net_received: allInvoices
      .filter((i) => i.status === "odendi")
      .reduce((s, i) => s + i.net_amount, 0),
    kdv_payable: kdvSummary.payable,
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
          <InvoiceList invoices={allInvoices} />
          <KDVSummaryCard summary={kdvSummary} />
        </div>
        <div className="space-y-6">
          <DualCurrencyCard runway={financeRunway} tcmbRate={TCMB_USD_RATE} />
          <TaxProvisionCard provisions={financeTaxProvisions} />
        </div>
      </div>
    </div>
  );
}
