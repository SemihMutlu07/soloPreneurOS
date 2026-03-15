import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PIPELINE_STAGES } from "@/lib/sales-types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Lead not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const allowedFields = [
    "status",
    "deal_value",
    "notes",
    "assigned_to",
    "next_follow_up_at",
    "lost_reason",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (updates.status && !PIPELINE_STAGES.includes(updates.status as typeof PIPELINE_STAGES[number])) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${PIPELINE_STAGES.join(", ")}` },
      { status: 400 },
    );
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
