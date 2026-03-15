export type InvoiceStatus = "odendi" | "beklemede" | "gecmis";
export type InvoiceType = "e-arsiv" | "e-smm";
export type KDVRate = 0 | 1 | 10 | 20;

export interface Invoice {
  id: string;
  user_id: string;
  client_name: string;
  client_vkn: string | null;
  description: string;
  gross_amount: number;
  kdv_rate: KDVRate;
  kdv_amount: number;
  stopaj_rate: number | null;
  stopaj_amount: number | null;
  net_amount: number;
  invoice_type: InvoiceType;
  status: InvoiceStatus;
  created_at: string;
}

export interface TaxProvision {
  id: string;
  user_id: string;
  period: string;
  kdv_payable: number;
  gecici_vergi_estimate: number;
  sgk_amount: number;
  total_provision: number;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  kdv_paid: number;
  category: string;
  date: string;
  created_at: string;
}

export interface KDVSummary {
  collected: number;
  paid: number;
  payable: number;
}

export interface RunwayData {
  cash_tl: number;
  cash_usd: number;
  monthly_burn: number;
  runway_months: number;
}

export interface TaxDeadline {
  id: string;
  name: string;
  type: string;
  due_date: string;
  estimated_amount: number;
  status: "bekliyor" | "hazirlaniyor" | "odendi";
  description: string;
}

export interface FinanceStats {
  total_revenue: number;
  net_received: number;
  kdv_payable: number;
  runway_months: number;
}
