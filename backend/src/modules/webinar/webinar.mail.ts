import { resend, FROM_EMAIL, APP_NAME } from "@/utils/mailer.js";

const LOGO_URL = `${process.env.FRONTEND_URL || "http://localhost:3000"}/favicon.png`;

const WEBINAR_TITLE = "AI Webinar";
const WEBINAR_SCHEDULE = "Saturday, 22 Aug &middot; 8:00 PM IST";

// General community — for interaction/networking, open to everyone.
const WHATSAPP_COMMUNITY_LINK = process.env.WHATSAPP_COMMUNITY_LINK;
if (!WHATSAPP_COMMUNITY_LINK) {
  throw new Error(
    "WHATSAPP_COMMUNITY_LINK is required in backend environment variables.",
  );
}

// Webinar-specific group — where the joining link/session updates for this
// batch are shared, only for confirmed attendees.
const WEBINAR_WHATSAPP_GROUP_LINK = process.env.WEBINAR_WHATSAPP_GROUP_LINK;
if (!WEBINAR_WHATSAPP_GROUP_LINK) {
  throw new Error(
    "WEBINAR_WHATSAPP_GROUP_LINK is required in backend environment variables.",
  );
}

export interface WebinarPaymentConfirmationData {
  name: string;
  amount: number;
  currency: string;
}

function formatAmount(amount: number, currency: string): string {
  return `${currency === "INR" ? "₹" : currency + " "}${(amount / 100).toFixed(0)}`;
}

function buildHtml(data: WebinarPaymentConfirmationData): string {
  const amountLabel = formatAmount(data.amount, data.currency);

  return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; width: 100%; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <tr>
                <td align="center" style="padding: 32px 16px;">
                    <!--[if mso]>
                    <table align="center" border="0" cellspacing="0" cellpadding="0" width="560">
                    <tr>
                    <td>
                    <![endif]-->
                    <div style="max-width: 560px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; border-top: 4px solid #4f46e5; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); overflow: hidden; text-align: left;">

                        <!-- Header Logo -->
                        <div style="padding: 24px 24px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                            <img src="${LOGO_URL}" alt="${APP_NAME}" width="32" height="32" style="display: inline-block; vertical-align: middle; margin-right: 8px; border-radius: 6px;" />
                            <span style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; vertical-align: middle;">${APP_NAME}</span>
                        </div>

                        <!-- Body Content -->
                        <div style="padding: 32px 24px;">
                            <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px; line-height: 1.3;">Payment Received &mdash; Seat Reserved!</h2>
                            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 8px;">Hi ${data.name},</p>
                            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
                                We've received your payment of <strong>${amountLabel}</strong> and your seat for the ${WEBINAR_TITLE} is confirmed.
                            </p>

                            <table role="presentation" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; width: 100%; table-layout: fixed;">
                                <tr>
                                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                                        <span style="display: block; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Session</span>
                                        <span style="display: block; color: #0f172a; font-size: 14px; font-weight: 600; line-height: 1.4;">${WEBINAR_TITLE}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; vertical-align: top;">
                                        <span style="display: block; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Scheduled For</span>
                                        <span style="display: block; color: #0f172a; font-size: 14px; font-weight: 600; line-height: 1.4;">${WEBINAR_SCHEDULE}</span>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 12px;">
                                First, join the <strong>webinar group</strong> below &mdash; that's where we'll share the joining link and any session updates or reminders before we go live:
                            </p>

                            <div style="text-align: center; margin-bottom: 20px;">
                                <a href="${WEBINAR_WHATSAPP_GROUP_LINK}" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-align: center; box-shadow: 0 4px 6px -1px rgba(37, 211, 102, 0.15), 0 2px 4px -1px rgba(37, 211, 102, 0.1);">
                                    Join Webinar Group &rarr;
                                </a>
                            </div>

                            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 12px;">
                                And for ongoing interaction, networking, and updates beyond this session, you're also welcome in our general WhatsApp community:
                            </p>

                            <div style="text-align: center; margin-bottom: 28px;">
                                <a href="${WHATSAPP_COMMUNITY_LINK}" style="display: inline-block; background-color: #ffffff; color: #0f172a; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 13px; text-align: center; border: 1.5px solid #cbd5e1;">
                                    Join WhatsApp Community &rarr;
                                </a>
                            </div>

                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

                            <!-- Footer support -->
                            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0 0 8px; line-height: 1.6;">
                                Have a question before then? Just reply to this email and we'll help out.
                            </p>
                            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0; line-height: 1.6;">
                                Thank you,<br />
                                <span style="font-weight: 600; color: #64748b;">${APP_NAME} Team</span>
                            </p>
                        </div>

                    </div>
                    <!--[if mso]>
                    </td>
                    </tr>
                    </table>
                    <![endif]-->
                </td>
            </tr>
        </table>`;
}

function buildRecoveryOtpHtml(otp: string): string {
  return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; width: 100%; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <tr>
                <td align="center" style="padding: 32px 16px;">
                    <div style="max-width: 560px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; border-top: 4px solid #4f46e5; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); overflow: hidden; text-align: left;">
                        <div style="padding: 24px 24px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                            <img src="${LOGO_URL}" alt="${APP_NAME}" width="32" height="32" style="display: inline-block; vertical-align: middle; margin-right: 8px; border-radius: 6px;" />
                            <span style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; vertical-align: middle;">${APP_NAME}</span>
                        </div>
                        <div style="padding: 32px 24px;">
                            <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px; line-height: 1.3;">Verify your email</h2>
                            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
                                Use the code below to recover your ${WEBINAR_TITLE} registration:
                            </p>
                            <div style="text-align: center; margin-bottom: 24px;">
                                <span style="display: inline-block; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 32px; font-size: 28px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${otp}</span>
                            </div>
                            <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
                                This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
                            </p>
                        </div>
                    </div>
                </td>
            </tr>
        </table>`;
}

export async function sendWebinarRecoveryOtpEmail(
  email: string,
  otp: string,
): Promise<void> {
  console.log(`[Resend] Sending webinar recovery OTP email to: ${email}`);
  try {
    const { data: sendData, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Your verification code — ${WEBINAR_TITLE}`,
      html: buildRecoveryOtpHtml(otp),
    });

    if (error) {
      console.error(
        `[Resend Error] Failed to send webinar recovery OTP email to ${email}:`,
        error,
      );
      return;
    }

    console.log(
      `[Resend Success] Webinar recovery OTP email sent! ID: ${sendData?.id}`,
    );
  } catch (err) {
    console.error(
      `[Resend] Error sending webinar recovery OTP email to ${email}:`,
      err,
    );
  }
}

export async function sendWebinarPaymentConfirmationEmail(
  email: string,
  data: WebinarPaymentConfirmationData,
): Promise<void> {
  console.log(`[Resend] Sending webinar payment confirmation email to: ${email}`);
  try {
    const { data: sendData, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `We've received your payment — ${WEBINAR_TITLE} seat confirmed`,
      html: buildHtml(data),
    });

    if (error) {
      console.error(
        `[Resend Error] Failed to send webinar confirmation email to ${email}:`,
        error,
      );
      return;
    }

    console.log(
      `[Resend Success] Webinar confirmation email sent! ID: ${sendData?.id}`,
    );
  } catch (err) {
    // Payment is already captured/recorded — a mail failure must never
    // surface as an error to the caller (client verify call or webhook).
    console.error(
      `[Resend] Error sending webinar confirmation email to ${email}:`,
      err,
    );
  }
}
