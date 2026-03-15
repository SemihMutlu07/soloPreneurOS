import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const FINANCE_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("expenses")
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

  const { description, amount, category } = body;

  if (!description || !amount) {
    return NextResponse.json(
      { error: "description and amount are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: FINANCE_USER_ID,
      description,
      amount,
      category: category || "general",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
