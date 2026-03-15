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
