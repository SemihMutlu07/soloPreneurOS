"use client";

import { useState, useEffect } from "react";
import type { Invoice, KDVRate, InvoiceType } from "@/lib/finance-types";

interface InvoiceFormProps {
  onSave: (invoice: Invoice) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR").format(Math.round(n));

function generatePdfHtml(inv: {
  clientName: string;
  clientVkn: string;
  description: string;
  amount: number;
  kdvRate: KDVRate;
  kdvAmount: number;
  stopajEnabled: boolean;
  stopajRate: number;
  stopajAmount: number;
  customerPays: number;
  youReceive: number;
  govCredit: number;
  invoiceType: InvoiceType;
}): string {
  const typeLabel = inv.invoiceType === "e-arsiv" ? "e-Arşiv" : "e-SMM";
  const now = new Date().toLocaleDateString("tr-TR");
  const line = "─".repeat(40);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Fatura</title>
<style>
  body { font-family: "Courier New", monospace; padding: 40px; color: #111; max-width: 600px; margin: 0 auto; }
  .line { color: #666; margin: 12px 0; }
  .row { display: flex; justify-content: space-between; margin: 6px 0; }
  .row .label { color: #444; }
  .row .value { font-weight: bold; text-align: right; }
  .title { font-size: 24px; font-weight: bold; letter-spacing: 4px; margin-bottom: 16px; }
  .footer { margin-top: 32px; text-align: center; color: #999; font-size: 12px; border: 1px dashed #ccc; padding: 8px; }
  .section-title { font-size: 11px; color: #888; text-transform: uppercase; margin-top: 16px; margin-bottom: 4px; }
</style></head><body>
  <div class="title">FATURA</div>
  <div class="line">${line}</div>
  <div class="row"><span class="label">Müşteri:</span><span class="value">${inv.clientName || "—"}</span></div>
  <div class="row"><span class="label">VKN:</span><span class="value">${inv.clientVkn || "—"}</span></div>
  <div class="row"><span class="label">Tarih:</span><span class="value">${now}</span></div>
  <div class="row"><span class="label">Fatura Tipi:</span><span class="value">${typeLabel}</span></div>
  <div class="line">${line}</div>
  <div class="row"><span class="label">Hizmet:</span><span class="value">${inv.description || "—"}</span></div>
  <div class="line">${line}</div>
  <div class="section-title">Hesaplama</div>
  <div class="row"><span class="label">Brüt Tutar:</span><span class="value">${fmt(inv.amount)} ₺</span></div>
  <div class="row"><span class="label">KDV (%${inv.kdvRate}):</span><span class="value">+${fmt(inv.kdvAmount)} ₺</span></div>
  ${inv.stopajEnabled ? `<div class="row"><span class="label">Stopaj (%${inv.stopajRate}):</span><span class="value">-${fmt(inv.stopajAmount)} ₺</span></div>` : ""}
  <div class="line">${line}</div>
  <div class="row"><span class="label">Müşteri Öder:</span><span class="value">${fmt(inv.customerPays)} ₺</span></div>
  <div class="row"><span class="label">Senin Alacağın:</span><span class="value">${fmt(inv.youReceive)} ₺</span></div>
  ${inv.stopajEnabled ? `<div class="row"><span class="label">Devlet Kredisi:</span><span class="value">${fmt(inv.govCredit)} ₺</span></div>` : ""}
  <div class="line">${line}</div>
  <div class="footer">MOCK BELGE — Gerçek fatura değildir</div>
</body></html>`;
}

export function InvoiceForm({ onSave }: InvoiceFormProps) {
  const [clientName, setClientName] = useState("");
  const [clientVkn, setClientVkn] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [kdvRate, setKdvRate] = useState<KDVRate>(20);
  const [stopajEnabled, setStopajEnabled] = useState(false);
  const [stopajRate, setStopajRate] = useState(20);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("e-arsiv");

  // e-SMM forces stopaj on
  useEffect(() => {
    if (invoiceType === "e-smm") {
      setStopajEnabled(true);
    }
  }, [invoiceType]);

  // correct calculations
  const kdvAmount = amount * (kdvRate / 100);
  const stopajAmount = stopajEnabled ? amount * (stopajRate / 100) : 0;
  const customerPays = amount + kdvAmount - stopajAmount;
  const youReceive = amount - stopajAmount;
  const govCredit = stopajAmount;

  const inputClass =
    "w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-colors";

  const handleSave = async () => {
    const payload = {
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
      status: "beklemede" as const,
    };

    try {
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Kaydetme başarısız");
      const invoice = await res.json();
      onSave(invoice);
      // Reset form fields after successful save
      setClientName("");
      setClientVkn("");
      setDescription("");
      setAmount(0);
      setKdvRate(20);
      setStopajEnabled(false);
      setStopajRate(20);
      setInvoiceType("e-arsiv");
    } catch {
      // Show a simple alert for now — loading state can be improved later
      alert("Fatura kaydedilemedi. Lütfen tekrar deneyin.");
    }
  };

  // generate PDF via print window
  const handlePdf = () => {
    const html = generatePdfHtml({
      clientName,
      clientVkn,
      description,
      amount,
      kdvRate,
      kdvAmount,
      stopajEnabled,
      stopajRate,
      stopajAmount,
      customerPays,
      youReceive,
      govCredit,
      invoiceType,
    });

    const printWindow = window.open("", "_blank", "width=700,height=900");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
        <div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-text-secondary">Stopaj</label>
            <button
              type="button"
              onClick={() => {
                if (invoiceType === "e-smm") return;
                setStopajEnabled(!stopajEnabled);
              }}
              className={`w-10 h-5 rounded-full transition-colors ${
                stopajEnabled ? "bg-accent-primary" : "bg-surface-elevated"
              } ${invoiceType === "e-smm" ? "opacity-60 cursor-not-allowed" : ""}`}
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
          {invoiceType === "e-smm" && (
            <p className="text-xs text-accent-amber mt-1.5 ml-0.5">
              e-SMM&apos;de stopaj zorunludur
            </p>
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
                  className="accent-accent-primary"
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
            className="bg-accent-primary text-bg font-semibold rounded-lg px-4 py-2.5"
          >
            Kaydet
          </button>
          <button
            type="button"
            onClick={handlePdf}
            className="border border-border text-text-secondary rounded-lg px-4 py-2.5 hover:border-border-strong"
          >
            PDF İndir
          </button>
        </div>
      </div>

      {/* sticky calculation panel */}
      <div className="card h-fit sticky top-6">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          Hesaplama
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">Brüt Tutar</span>
            <span className="text-sm font-mono text-text-primary tabular-nums text-right">
              {fmt(amount)} ₺
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">
              KDV (%{kdvRate})
            </span>
            <span className="text-sm font-mono text-text-primary tabular-nums text-right">
              +{fmt(kdvAmount)} ₺
            </span>
          </div>
          {stopajEnabled && (
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">
                Stopaj (%{stopajRate})
              </span>
              <span className="text-sm font-mono text-accent-red tabular-nums text-right">
                -{fmt(stopajAmount)} ₺
              </span>
            </div>
          )}
          <div className="border-t border-border/50 pt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-text-primary">
                Müşteri Öder
              </span>
              <span className="text-sm font-mono font-semibold text-text-primary tabular-nums text-right">
                {fmt(customerPays)} ₺
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-accent-green">
                Senin Alacağın
              </span>
              <span className="text-sm font-mono font-semibold text-accent-green tabular-nums text-right">
                {fmt(youReceive)} ₺
              </span>
            </div>
            {stopajEnabled && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-accent-blue">
                  Devlet Kredisi
                </span>
                <span className="text-sm font-mono font-semibold text-accent-blue tabular-nums text-right">
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
