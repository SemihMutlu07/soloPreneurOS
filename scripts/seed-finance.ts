// Run: npx dotenv-cli -e .env.local -- npx tsx scripts/seed-finance.ts
// Or: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-finance.ts

import { createAdminClient } from "../lib/supabase/admin";

const FINANCE_USER_ID = "00000000-0000-0000-0000-000000000001";

// --- Invoices ---
const invoiceRows = [
  {
    id: "00000000-0000-0000-0001-000000000001",
    user_id: FINANCE_USER_ID,
    client_name: "Teknoloji A.Ş.",
    client_vkn: "1234567890",
    description: "Yazılım danışmanlık hizmeti - Mart 2026",
    gross_amount: 50000,
    kdv_rate: 20,
    kdv_amount: 10000,
    stopaj_rate: 20,
    stopaj_amount: 10000,
    net_amount: 50000,
    invoice_type: "e-smm",
    status: "odendi",
    created_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "00000000-0000-0000-0001-000000000002",
    user_id: FINANCE_USER_ID,
    client_name: "Teknoloji A.Ş.",
    client_vkn: "1234567890",
    description: "API entegrasyon projesi - Mart 2026",
    gross_amount: 35000,
    kdv_rate: 20,
    kdv_amount: 7000,
    stopaj_rate: 20,
    stopaj_amount: 7000,
    net_amount: 35000,
    invoice_type: "e-smm",
    status: "beklemede",
    created_at: "2026-03-05T14:00:00Z",
  },
  {
    id: "00000000-0000-0000-0001-000000000003",
    user_id: FINANCE_USER_ID,
    client_name: "StartupXYZ Ltd",
    client_vkn: null,
    description: "Full-stack geliştirme - Şubat 2026",
    gross_amount: 25000,
    kdv_rate: 20,
    kdv_amount: 5000,
    stopaj_rate: null,
    stopaj_amount: null,
    net_amount: 30000,
    invoice_type: "e-arsiv",
    status: "odendi",
    created_at: "2026-02-20T09:00:00Z",
  },
  {
    id: "00000000-0000-0000-0001-000000000004",
    user_id: FINANCE_USER_ID,
    client_name: "Dijital Ajans",
    client_vkn: "9876543210",
    description: "UI/UX danışmanlık - Şubat 2026",
    gross_amount: 12000,
    kdv_rate: 20,
    kdv_amount: 2400,
    stopaj_rate: 20,
    stopaj_amount: 2400,
    net_amount: 12000,
    invoice_type: "e-smm",
    status: "odendi",
    created_at: "2026-02-15T11:00:00Z",
  },
  {
    id: "00000000-0000-0000-0001-000000000005",
    user_id: FINANCE_USER_ID,
    client_name: "StartupXYZ Ltd",
    client_vkn: null,
    description: "Mobil uygulama geliştirme - Mart 2026",
    gross_amount: 18000,
    kdv_rate: 20,
    kdv_amount: 3600,
    stopaj_rate: null,
    stopaj_amount: null,
    net_amount: 21600,
    invoice_type: "e-arsiv",
    status: "beklemede",
    created_at: "2026-03-10T16:00:00Z",
  },
  {
    id: "00000000-0000-0000-0001-000000000006",
    user_id: FINANCE_USER_ID,
    client_name: "Freelance Proje",
    client_vkn: null,
    description: "Landing page tasarım ve geliştirme",
    gross_amount: 8000,
    kdv_rate: 1,
    kdv_amount: 80,
    stopaj_rate: null,
    stopaj_amount: null,
    net_amount: 8080,
    invoice_type: "e-arsiv",
    status: "gecmis",
    created_at: "2026-01-25T08:00:00Z",
  },
];

// --- Expenses ---
const expenseRows = [
  {
    id: "00000000-0000-0000-0002-000000000001",
    user_id: FINANCE_USER_ID,
    description: "Vercel Pro",
    amount: 2200,
    kdv_paid: 440,
    category: "Altyapı",
    date: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "00000000-0000-0000-0002-000000000002",
    user_id: FINANCE_USER_ID,
    description: "AWS Hizmetleri",
    amount: 4500,
    kdv_paid: 900,
    category: "Altyapı",
    date: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "00000000-0000-0000-0002-000000000003",
    user_id: FINANCE_USER_ID,
    description: "Figma Pro",
    amount: 800,
    kdv_paid: 160,
    category: "Araçlar",
    date: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "00000000-0000-0000-0002-000000000004",
    user_id: FINANCE_USER_ID,
    description: "Coworking Alanı",
    amount: 3500,
    kdv_paid: 700,
    category: "Ofis",
    date: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "00000000-0000-0000-0002-000000000005",
    user_id: FINANCE_USER_ID,
    description: "Domain & Hosting",
    amount: 1200,
    kdv_paid: 240,
    category: "Altyapı",
    date: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
];

// --- Tax Provisions ---
const taxRows = [
  {
    id: "00000000-0000-0000-0003-000000000001",
    user_id: FINANCE_USER_ID,
    period: "2026-Q1",
    kdv_payable: 3200,
    gecici_vergi_estimate: 8400,
    sgk_amount: 2800,
    total_provision: 14400,
    created_at: "2026-03-01T00:00:00Z",
  },
];

async function main() {
  const supabase = createAdminClient();

  // Seed invoices
  const { error: invoiceError } = await supabase
    .from("invoices")
    .upsert(invoiceRows, { onConflict: "id" });

  if (invoiceError) {
    console.error("Error seeding invoices:", invoiceError.message);
    process.exit(1);
  }
  console.log(`Seeded ${invoiceRows.length} invoices successfully.`);

  // Seed expenses
  const { error: expenseError } = await supabase
    .from("expenses")
    .upsert(expenseRows, { onConflict: "id" });

  if (expenseError) {
    console.error("Error seeding expenses:", expenseError.message);
    process.exit(1);
  }
  console.log(`Seeded ${expenseRows.length} expenses successfully.`);

  // Seed tax provisions
  const { error: taxError } = await supabase
    .from("tax_provisions")
    .upsert(taxRows, { onConflict: "id" });

  if (taxError) {
    console.error("Error seeding tax_provisions:", taxError.message);
    process.exit(1);
  }
  console.log(`Seeded ${taxRows.length} tax_provisions successfully.`);

  console.log("Finance seed complete.");
}

main();
