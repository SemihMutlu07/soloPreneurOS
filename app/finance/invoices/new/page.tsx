"use client";

import { useState } from "react";
import { InvoiceForm } from "@/components/finance/invoice-form";
import type { Invoice } from "@/lib/finance-types";

export default function NewInvoicePage() {
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = (invoice: Invoice) => {
    console.log("Saved invoice:", invoice);
    setToast(`"${invoice.client_name}" faturası kaydedildi`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Fatura Oluştur
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Yeni fatura oluştur ve KDV hesapla
        </p>
      </div>

      <InvoiceForm onSave={handleSave} />

      {toast && (
        <div className="fixed bottom-6 right-6 bg-accent-green/20 border border-accent-green/30 text-accent-green px-4 py-3 rounded-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
