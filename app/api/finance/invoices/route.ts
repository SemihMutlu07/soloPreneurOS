import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const FINANCE_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const body = await request.json();

  const {
    client_name,
    client_vkn,
    description,
    gross_amount,
    kdv_rate,
    kdv_amount,
    stopaj_rate,
    stopaj_amount,
    net_amount,
    invoice_type,
    status,
  } = body;

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      user_id: FINANCE_USER_ID,
      client_name,
      client_vkn,
      description,
      gross_amount,
      kdv_rate,
      kdv_amount,
      stopaj_rate,
      stopaj_amount,
      net_amount,
      invoice_type,
      status,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
