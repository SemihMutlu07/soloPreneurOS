import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const module = searchParams.get("module");

  if (!module) {
    return NextResponse.json(
      { error: "module query param is required (e.g. ?module=sales)" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cross_module_insights")
    .select("*")
    .is("dismissed_at", null)
    .contains("module_tags", [module])
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
