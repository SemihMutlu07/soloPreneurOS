import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const role = searchParams.get("role");
  const recommendation = searchParams.get("recommendation");
  const sortBy = searchParams.get("sort") || "applied_at";
  const order = searchParams.get("order") === "asc" ? true : false;

  let query = supabase
    .from("candidates")
    .select("*, evaluations(*)");

  if (status) query = query.eq("status", status);
  if (role) query = query.eq("role", role);
  if (recommendation) {
    query = query.eq("evaluations.recommendation", recommendation);
  }

  query = query.order(sortBy, { ascending: order });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten evaluations (take first if exists)
  const candidates = (data || []).map((c) => ({
    ...c,
    evaluation: c.evaluations?.[0] || null,
    evaluations: undefined,
  }));

  return NextResponse.json(candidates);
}
