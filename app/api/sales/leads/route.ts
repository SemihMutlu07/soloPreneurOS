import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PIPELINE_STAGES } from "@/lib/sales-types";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const minScore = searchParams.get("min_score");
  const sortBy = searchParams.get("sort") || "created_at";
  const order = searchParams.get("order") === "asc";

  let query = supabase.from("leads").select("*");

  if (status && PIPELINE_STAGES.includes(status as typeof PIPELINE_STAGES[number])) {
    query = query.eq("status", status);
  }
  if (source) {
    query = query.eq("source", source);
  }
  if (minScore) {
    query = query.gte("ai_score", parseInt(minScore, 10));
  }

  query = query.order(sortBy, { ascending: order });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
