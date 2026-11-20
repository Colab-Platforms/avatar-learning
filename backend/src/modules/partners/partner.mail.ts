import { resend, FROM_EMAIL, APP_NAME } from "@/utils/mailer.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";

/** Thrown when a partner email needs SUPPORT_EMAIL but it is not configured. */
export class SupportEmailConfigError extends ApiError {
  readonly code = "SUPPORT_EMAIL_NOT_CONFIGURED";
  constructor() {
    super(
      "SUPPORT_EMAIL is not configured; the partner notification email was not sent.",
      STATUS_CODES.SERVICE_UNAVAILABLE,
    );
    Object.setPrototypeOf(this, SupportEmailConfigError.prototype);
  }
}

// Read lazily (never at import time) so the backend can start without it.
export const getSupportEmail = (env: Record<string, string | undefined> = process.env): string => {
  const value = env.SUPPORT_EMAIL?.trim();
  if (!value) throw new SupportEmailConfigError();
  return value;
};

interface PartnerMailInfo {
  type: string;
  organizationName: string | null;
  contactPerson: string | null;
  phone: string;
  email: string;
}

/**
 * Best-effort notification: it is called after the application/claim has been
 * saved, so a failure is logged and reported through the return value (true
 * only when Resend accepted the email) instead of failing the request.
 */
export const sendPartnerApplicationEmail = async (partner: PartnerMailInfo): Promise<boolean> => {
  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: getSupportEmail(),
      subject: `New partner application (${partner.type})`,
      html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0f172a;">New Partner Application — ${partner.type}</h2>
        <p><strong>Organization:</strong> ${partner.organizationName ?? "—"}</p>
        <p><strong>Contact person:</strong> ${partner.contactPerson ?? "—"}</p>
        <p><strong>Phone:</strong> ${partner.phone}</p>
        <p><strong>Email:</strong> ${partner.email}</p>
      </div>
      `,
    });
    if (error) {
      console.error("[Resend Error] partner application email:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Resend] Error sending partner application email:", err);
    return false;
  }
};

export const sendPartnerClaimEmail = async (
  partner: { contactPerson: string | null; email: string; phone: string },
  amount: number,
): Promise<boolean> => {
  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: getSupportEmail(),
      subject: `Partner payout claim — Rs.${amount}`,
      html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0f172a;">Partner Payout Claim</h2>
        <p><strong>Partner:</strong> ${partner.contactPerson ?? "—"}</p>
        <p><strong>Email:</strong> ${partner.email}</p>
        <p><strong>Phone:</strong> ${partner.phone}</p>
        <p><strong>Amount requested:</strong> Rs.${amount}</p>
      </div>
      `,
    });
    if (error) {
      console.error("[Resend Error] partner claim email:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Resend] Error sending partner claim email:", err);
    return false;
  }
};
