import { resend, FROM_EMAIL } from "@/utils/mailer.js";

// Emails for AI Adoption accounts (separate wording/branding from the learning platform's).
const BRAND = "Avatar AI Adoption";

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function codeEmail(heading: string, intro: string, code: string, name?: string) {
  return `
  <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#07080b;padding:32px 16px;">
    <div style="background:#0b0d12;border:1px solid #1f242c;border-radius:20px;padding:36px;color:#f4f6f8;">
      <div style="font-size:20px;font-weight:700;letter-spacing:.04em;margin-bottom:28px;">AVATAR <span style="color:#6fe3ef;font-weight:500;">AI Adoption</span></div>
      <h1 style="font-size:22px;font-weight:600;margin:0 0 10px;">${heading}</h1>
      <p style="color:#a3abb5;font-size:15px;line-height:1.6;margin:0 0 24px;">${name ? `Hi ${escape(name)}, ` : ""}${intro}</p>
      <div style="background:#11151b;border:1px solid #23303a;border-radius:14px;padding:20px;text-align:center;margin-bottom:24px;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#8fe9f2;font-family:'Courier New',monospace;">${code}</span>
      </div>
      <p style="color:#8a939e;font-size:13px;line-height:1.6;margin:0;">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
    </div>
  </div>`;
}

export async function sendAdoptionVerifyEmail(to: string, code: string, name?: string) {
  const { error } = await resend.emails.send({
    from: `${BRAND} <${FROM_EMAIL}>`,
    to,
    subject: `Verify your ${BRAND} account`,
    html: codeEmail("Verify your email", "use this code to finish creating your Avatar AI Adoption account.", code, name),
  });
  if (error) throw new Error(`Failed to send verification email: ${error.message}`);
}

export async function sendAdoptionChangeEmail(to: string, code: string, name?: string) {
  const { error } = await resend.emails.send({
    from: `${BRAND} <${FROM_EMAIL}>`,
    to,
    subject: `Confirm your new ${BRAND} email`,
    html: codeEmail("Confirm your new email", "use this code to make this your Avatar AI Adoption sign-in email.", code, name),
  });
  if (error) throw new Error(`Failed to send email-change code: ${error.message}`);
}

export async function sendAdoptionResetEmail(to: string, code: string, name?: string) {
  const { error } = await resend.emails.send({
    from: `${BRAND} <${FROM_EMAIL}>`,
    to,
    subject: `Reset your ${BRAND} password`,
    html: codeEmail("Reset your password", "use this code to set a new password for your Avatar AI Adoption account.", code, name),
  });
  if (error) throw new Error(`Failed to send reset email: ${error.message}`);
}
