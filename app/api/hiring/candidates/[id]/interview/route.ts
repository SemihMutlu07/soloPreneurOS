import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInterviewEmail } from "@/lib/email";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: candidate, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !candidate) {
    return NextResponse.json(
      { error: "Candidate not found" },
      { status: 404 },
    );
  }

  try {
    await sendInterviewEmail(candidate.email, candidate.name, candidate.role);

    await supabase
      .from("candidates")
      .update({ status: "reviewed" })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
