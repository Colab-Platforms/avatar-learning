import prisma from "@root/prisma.js";
import { resend, FROM_EMAIL, isMailConfigured } from "@/utils/mailer.js";
import { EmailAutomationService, type EmailSender } from "./email-automation.service.js";
import { unsubscribeToken } from "./email.lib.js";

/** Wires the service to the EXISTING Resend client from utils/mailer.ts (no second client, no new credentials). */
const FROM_NAME = process.env.EMAIL_AUTOMATION_FROM_NAME?.trim() || "Avatar AI Adoption";

const sender: EmailSender = {
  async send({ to, subject, html, text, idempotencyKey, headers }) {
    const { data, error } = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject, html, text, ...(headers ? { headers } : {}) }, { idempotencyKey });
    if (error || !data?.id) throw Object.assign(new Error(error?.message ?? "Resend returned no message id."), { name: error?.name, statusCode: (error as { statusCode?: number } | null)?.statusCode });
    return { id: data.id };
  },
  async check() {
    const { error } = await resend.domains.list();
    if (error) throw Object.assign(new Error(error.message), { name: error.name });
  },
};

/** Master switch. Off unless EMAIL_AUTOMATION_ENABLED=true: automatic triggers, scheduled sends and the worker stay idle. */
export const emailAutomationEnabled = (): boolean => process.env.EMAIL_AUTOMATION_ENABLED?.trim().toLowerCase() === "true";

const unsubSecret = () => process.env.EMAIL_UNSUBSCRIBE_SECRET?.trim() || process.env.JWT_SECRET?.trim() || "";

export const emailUnsubscribeSecret = unsubSecret;

export const emailAutomation = new EmailAutomationService({
  db: prisma,
  sender,
  isEnabled: emailAutomationEnabled,
  isConfigured: () => isMailConfigured,
  appName: FROM_NAME,
  unsubscribeUrl: (userId) => {
    const secret = unsubSecret();
    const base = (process.env.BACKEND_URL ?? "").replace(/\/+$/, "");
    if (!secret || !base) return null;
    return `${base}/api/email-automation/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId, secret)}`;
  },
});
