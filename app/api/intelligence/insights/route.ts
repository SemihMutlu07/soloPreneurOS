import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cross_module_insights")
    .select("*")
    .is("dismissed_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  const sorted = (data || []).sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  );

  return NextResponse.json(sorted);
}
