import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("candidates")
    .select("*, evaluations(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Candidate not found" },
      { status: 404 },
    );
  }

  const candidate = {
    ...data,
    evaluation: data.evaluations?.[0] || null,
    evaluations: undefined,
  };

  return NextResponse.json(candidate);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { status, decision_result } = body;
  if (!status || !["pending", "analyzed", "reviewed"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400 },
    );
  }

  if (decision_result !== undefined && !["GÖRÜŞ", "GEÇME", "BEKLET"].includes(decision_result)) {
    return NextResponse.json({ error: "Invalid decision_result" }, { status: 400 });
  }

  const updatePayload: Record<string, string> = { status };
  if (decision_result !== undefined) updatePayload.decision_result = decision_result;

  const { error } = await supabase
    .from("candidates")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
