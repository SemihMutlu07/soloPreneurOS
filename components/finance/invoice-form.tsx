"use client";

import { useState } from "react";
import type { Invoice, KDVRate, InvoiceType } from "@/lib/finance-types";

interface InvoiceFormProps {
  onSave: (invoice: Invoice) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR").format(Math.round(n));

export function InvoiceForm({ onSave }: InvoiceFormProps) {
  const [clientName, setClientName] = useState("");
  const [clientVkn, setClientVkn] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [kdvRate, setKdvRate] = useState<KDVRate>(20);
  const [stopajEnabled, setStopajEnabled] = useState(false);
  const [stopajRate, setStopajRate] = useState(20);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("e-arsiv");

  const kdvAmount = amount * (kdvRate / 100);
  const stopajAmount = stopajEnabled ? amount * (stopajRate / 100) : 0;
  const customerPays = amount + kdvAmount - stopajAmount;
  const youReceive = amount - stopajAmount;
  const govCredit = stopajAmount;

  const inputClass =
    "w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange";

  const handleSave = () => {
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      user_id: "user-1",
      client_name: clientName,
      client_vkn: clientVkn || null,
      description,
      gross_amount: amount,
      kdv_rate: kdvRate,
      kdv_amount: kdvAmount,
      stopaj_rate: stopajEnabled ? stopajRate : null,
      stopaj_amount: stopajEnabled ? stopajAmount : null,
      net_amount: customerPays,
      invoice_type: invoiceType,
      status: "beklemede",
      created_at: new Date().toISOString(),
    };
    onSave(invoice);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card space-y-4">
        <div>
          <label className="text-sm text-text-secondary block mb-1">
            Müşteri Adı
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="Şirket veya kişi adı"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary block mb-1">VKN</label>
          <input
            type="text"
            className={inputClass}
            placeholder="Vergi kimlik numarası (opsiyonel)"
            value={clientVkn}
            onChange={(e) => setClientVkn(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary block mb-1">
            Hizmet Açıklaması
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="Danışmanlık, geliştirme, vb."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary block mb-1">
            Tutar (TL)
          </label>
          <input
            type="number"
            className={inputClass}
            placeholder="0"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-sm text-text-secondary block mb-1">
            KDV Oranı
          </label>
          <select
            className={inputClass}
            value={kdvRate}
            onChange={(e) => setKdvRate(Number(e.target.value) as KDVRate)}
          >
            <option value={20}>%20</option>
            <option value={10}>%10</option>
            <option value={1}>%1</option>
            <option value={0}>%0</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-secondary">Stopaj</label>
          <button
            type="button"
            onClick={() => setStopajEnabled(!stopajEnabled)}
            className={`w-10 h-5 rounded-full transition-colors ${
              stopajEnabled ? "bg-accent-orange" : "bg-surface-elevated"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${
                stopajEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          {stopajEnabled && (
            <select
              className={`${inputClass} w-24`}
              value={stopajRate}
              onChange={(e) => setStopajRate(Number(e.target.value))}
            >
              <option value={20}>%20</option>
              <option value={15}>%15</option>
              <option value={10}>%10</option>
            </select>
          )}
        </div>
        <div>
          <label className="text-sm text-text-secondary block mb-2">
            Fatura Tipi
          </label>
          <div className="flex gap-4">
            {(["e-arsiv", "e-smm"] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="invoiceType"
                  value={type}
                  checked={invoiceType === type}
                  onChange={() => setInvoiceType(type)}
                  className="accent-accent-orange"
                />
                <span className="text-sm text-text-primary">
                  {type === "e-arsiv" ? "e-Arşiv" : "e-SMM"}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="bg-accent-orange text-bg font-semibold rounded-lg px-4 py-2.5"
          >
            Kaydet
          </button>
          <button
            type="button"
            onClick={() => alert("PDF hazırlanıyor...")}
            className="border border-border text-text-secondary rounded-lg px-4 py-2.5 hover:border-border-strong"
          >
            PDF İndir
          </button>
        </div>
      </div>

      <div className="card h-fit">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          Hesaplama
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">Brüt Tutar</span>
            <span className="text-sm font-mono text-text-primary">
              {fmt(amount)} ₺
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">
              KDV (%{kdvRate})
            </span>
            <span className="text-sm font-mono text-text-primary">
              +{fmt(kdvAmount)} ₺
            </span>
          </div>
          {stopajEnabled && (
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">
                Stopaj (%{stopajRate})
              </span>
              <span className="text-sm font-mono text-accent-red">
                -{fmt(stopajAmount)} ₺
              </span>
            </div>
          )}
          <div className="border-t border-border/50 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-text-primary">
                Müşteri Öder
              </span>
              <span className="text-sm font-mono font-semibold text-text-primary">
                {fmt(customerPays)} ₺
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-accent-green">
                Senin Alacağın
              </span>
              <span className="text-sm font-mono font-semibold text-accent-green">
                {fmt(youReceive)} ₺
              </span>
            </div>
            {stopajEnabled && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-accent-blue">
                  Devlet Kredisi
                </span>
                <span className="text-sm font-mono font-semibold text-accent-blue">
                  {fmt(govCredit)} ₺
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
