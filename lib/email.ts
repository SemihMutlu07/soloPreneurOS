import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendInterviewEmail(
  to: string,
  candidateName: string,
  roleName: string,
) {
  const meetLink = process.env.GOOGLE_MEET_LINK;

  const { error } = await getResend().emails.send({
    from: process.env.FROM_EMAIL || "hiring@yourdomain.com",
    to,
    subject: `Interview Invitation — ${roleName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Interview Invitation</h2>
        <p>Hi ${candidateName},</p>
        <p>Thank you for your application for the <strong>${roleName}</strong> position.</p>
        <p>We'd like to invite you for an interview. Please use the link below to join:</p>
        <p><a href="${meetLink}" style="display: inline-block; padding: 12px 24px; background: #6ee7b7; color: #141414; border-radius: 8px; text-decoration: none; font-weight: 600;">Join Interview</a></p>
        <p>We'll reach out separately to coordinate a time that works for you.</p>
        <p>Best regards,<br/>Hiring Team</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send interview email: ${error.message}`);
  }
}

export async function sendDuplicateNotification(
  to: string,
  candidateName: string,
  roleName: string,
) {
  const { error } = await getResend().emails.send({
    from: process.env.FROM_EMAIL || "hiring@yourdomain.com",
    to,
    subject: `Application Received — ${roleName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Hi ${candidateName},</p>
        <p>We've received your updated application for the <strong>${roleName}</strong> position.</p>
        <p>Our team will review it and get back to you soon.</p>
        <p>Best regards,<br/>Hiring Team</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(
      `Failed to send duplicate notification: ${error.message}`,
    );
  }
}
