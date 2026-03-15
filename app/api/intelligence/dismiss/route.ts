import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // Step 1 — Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).id !== "string" ||
    !(body as Record<string, string>).id.trim()
  ) {
    return NextResponse.json(
      { error: "Request body must be { id: string }" },
      { status: 400 }
    );
  }

  const { id } = body as { id: string };

  // Step 2 — Create Supabase client (user-facing route, not admin)
  const supabase = await createClient();

  // Step 3 — Check existence
  const { data: existing, error: fetchError } = await supabase
    .from("cross_module_insights")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Insight not found" }, { status: 404 });
  }

  // Step 4 — Soft-delete
  const { error: updateError } = await supabase
    .from("cross_module_insights")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Step 5 — Return 204 No Content (no body)
  return new NextResponse(null, { status: 204 });
}
