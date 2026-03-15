import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";

function getAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
  return oauth2Client;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !lead) {
    return NextResponse.json(
      { error: "Lead not found" },
      { status: 404 },
    );
  }

  const body = await request.json();
  const { subject, message } = body;

  if (!subject || !message) {
    return NextResponse.json(
      { error: "subject and message are required" },
      { status: 400 },
    );
  }

  try {
    const auth = getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    const raw = Buffer.from(
      [
        `To: ${lead.email}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        "",
        message,
      ].join("\r\n"),
    ).toString("base64url");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    // Log activity
    await supabase.from("lead_activities").insert({
      lead_id: id,
      type: "email_sent",
      content: `Subject: ${subject}\n\n${message}`,
      created_by: "user",
    });

    // Update last contact
    await supabase
      .from("leads")
      .update({
        last_contact_at: new Date().toISOString(),
        status: lead.status === "new" ? "contacted" : lead.status,
      })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
