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

export interface GmailAttachment {
  messageId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  date: string;
  filename: string;
  data: Buffer;
  mimeType: string;
}

export async function fetchEmailsWithPDFs(
  sinceDate: Date,
): Promise<GmailAttachment[]> {
  const auth = getAuthClient();
  const gmail = google.gmail({ version: "v1", auth });

  const epoch = Math.floor(sinceDate.getTime() / 1000);
  const query = `has:attachment filename:pdf after:${epoch}`;

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 50,
  });

  const messages = listRes.data.messages || [];
  const results: GmailAttachment[] = [];

  for (const msg of messages) {
    const full = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });

    const headers = full.data.payload?.headers || [];
    const from = headers.find((h) => h.name === "From")?.value || "";
    const subject = headers.find((h) => h.name === "Subject")?.value || "";
    const date = headers.find((h) => h.name === "Date")?.value || "";

    const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
    const emailMatch = from.match(/<([^>]+)>/);
    const senderName = nameMatch?.[1]?.trim() || from;
    const senderEmail = emailMatch?.[1] || from;

    const parts = full.data.payload?.parts || [];
    for (const part of parts) {
      if (
        part.mimeType === "application/pdf" &&
        part.body?.attachmentId
      ) {
        const attachment = await gmail.users.messages.attachments.get({
          userId: "me",
          messageId: msg.id!,
          id: part.body.attachmentId,
        });

        const data = Buffer.from(attachment.data.data!, "base64url");

        results.push({
          messageId: msg.id!,
          senderName,
          senderEmail,
          subject,
          date,
          filename: part.filename || "resume.pdf",
          data,
          mimeType: "application/pdf",
        });
      }
    }
  }

  return results;
}
