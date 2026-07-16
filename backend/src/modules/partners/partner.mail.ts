import { resend, FROM_EMAIL, APP_NAME } from "@/utils/mailer.js";

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;
if (!SUPPORT_EMAIL) {
  throw new Error("SUPPORT_EMAIL is required in backend environment variables.");
}

interface PartnerMailInfo {
  type: string;
  organizationName: string | null;
  contactPerson: string | null;
  phone: string;
  email: string;
}

export const sendPartnerApplicationEmail = async (partner: PartnerMailInfo): Promise<void> => {
  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: SUPPORT_EMAIL,
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
    if (error) console.error("[Resend Error] partner application email:", error);
  } catch (err) {
    console.error("[Resend] Error sending partner application email:", err);
  }
};

export const sendPartnerClaimEmail = async (
  partner: { contactPerson: string | null; email: string; phone: string },
  amount: number,
): Promise<void> => {
  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: SUPPORT_EMAIL,
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
    if (error) console.error("[Resend Error] partner claim email:", error);
  } catch (err) {
    console.error("[Resend] Error sending partner claim email:", err);
  }
};
