import { resend, FROM_EMAIL, APP_NAME } from "@/utils/mailer.js";

const LOGO_URL = `${process.env.FRONTEND_URL || "http://localhost:3000"}/favicon.png`;

const WHATSAPP_COMMUNITY_LINK = process.env.WHATSAPP_COMMUNITY_LINK;
if (!WHATSAPP_COMMUNITY_LINK) {
  throw new Error(
    "WHATSAPP_COMMUNITY_LINK is required in backend environment variables.",
  );
}

export interface PaymentConfirmationData {
  name: string;
  amount: number;
  productName: string;
}

function formatAmount(amountInPaise: number): string {
  return `₹${(amountInPaise / 100).toFixed(0)}`;
}

function buildHtml(data: PaymentConfirmationData): string {
  const amountLabel = formatAmount(data.amount);

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
                            <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px; line-height: 1.3;">Payment Received!</h2>
                            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 8px;">Hi ${data.name},</p>
                            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
                                We've received your payment of <strong>${amountLabel}</strong> for <strong>${data.productName}</strong>. Thank you for choosing ${APP_NAME}.
                            </p>

                            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 12px;">
                                Join our WhatsApp community for updates, reminders, and support:
                            </p>

                            <div style="text-align: center; margin-bottom: 28px;">
                                <a href="${WHATSAPP_COMMUNITY_LINK}" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-align: center; box-shadow: 0 4px 6px -1px rgba(37, 211, 102, 0.15), 0 2px 4px -1px rgba(37, 211, 102, 0.1);">
                                    Join WhatsApp Community &rarr;
                                </a>
                            </div>

                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

                            <!-- Footer support -->
                            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0 0 8px; line-height: 1.6;">
                                Have a question? Just reply to this email and we'll help out.
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

export async function sendPaymentConfirmationEmail(
  email: string,
  data: PaymentConfirmationData,
): Promise<void> {
  console.log(`[Resend] Sending payment confirmation email to: ${email}`);
  try {
    const { data: sendData, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `We've received your payment — ${data.productName}`,
      html: buildHtml(data),
    });

    if (error) {
      console.error(
        `[Resend Error] Failed to send payment confirmation email to ${email}:`,
        error,
      );
      return;
    }

    console.log(
      `[Resend Success] Payment confirmation email sent! ID: ${sendData?.id}`,
    );
  } catch (err) {
    // Payment is already captured/recorded — a mail failure must never
    // surface as an error to the caller (client verify call or webhook).
    console.error(
      `[Resend] Error sending payment confirmation email to ${email}:`,
      err,
    );
  }
}
