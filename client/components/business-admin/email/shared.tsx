import type { EmailMessageStatus } from "@/lib/businessAdminApi";
import { StatusPill } from "@/components/business-admin/ui";

export const inputCls = "w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none";
export const btnPrimary = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50";
export const btnGhost = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/5 disabled:opacity-50";

export const TZ = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "local time";

/** <input type="datetime-local"> value (local time, no zone) -> ISO in UTC. The server only ever stores UTC. */
export const localToIso = (v: string): string | undefined => (v ? new Date(v).toISOString() : undefined);
/** ISO -> value for <input type="datetime-local"> in the viewer's own zone. */
export const isoToLocal = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const whenLocal = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");

const TONE: Record<EmailMessageStatus, "ok" | "warn" | "off" | "info"> = {
  QUEUED: "info",
  SENDING: "info",
  SENT: "ok",
  DELIVERED: "ok",
  BOUNCED: "warn",
  COMPLAINED: "warn",
  FAILED: "warn",
  CANCELLED: "off",
  SKIPPED: "off",
  UNCONFIRMED: "warn",
};
const LABEL: Record<EmailMessageStatus, string> = { QUEUED: "Scheduled", SENDING: "Sending", SENT: "Sent", DELIVERED: "Delivered", BOUNCED: "Bounced", COMPLAINED: "Spam complaint", FAILED: "Failed", CANCELLED: "Cancelled", SKIPPED: "Skipped", UNCONFIRMED: "Needs review" };
export const MessageStatus = ({ status }: { status: EmailMessageStatus }) => <StatusPill tone={TONE[status]}>{LABEL[status]}</StatusPill>;

const REASON: Record<string, string> = {
  EMAIL_NOT_VERIFIED: "Email address not verified",
  ACCOUNT_INACTIVE: "Account deactivated",
  NO_MARKETING_CONSENT: "No marketing consent",
  UNSUBSCRIBED: "Unsubscribed",
  TEMPLATE_NOT_ACTIVE: "Template not active",
  TEMPLATE_DELETED: "Template removed",
  AUTOMATION_OFF: "Automation switched off",
  AUTOMATION_DELETED: "Automation deleted",
  TEMPLATE_ARCHIVED: "Template archived",
  CANCELLED_BY_ADMIN: "Cancelled by an admin",
  EXPIRED: "Too late to send safely",
  UNKNOWN_RECIPIENT: "No such account",
  NO_RECIPIENT_RECORD: "No account record",
  UNSUBSCRIBE_NOT_CONFIGURED: "Unsubscribe link not configured on the server",
  ALREADY_SENT_OR_QUEUED: "Already sent or scheduled",
  RECIPIENT_EMAIL_CHANGED: "Person changed their email address",
  NO_SNAPSHOT: "Stored content missing",
  CONTENT_CHANGED: "Stored content failed its integrity check",
  IDEMPOTENCY_WINDOW_PASSED: "Outcome unknown and too late to retry safely",
  WORKER_STOPPED_BEFORE_RESULT: "Server stopped before the result was recorded",
  CONFIRMED_SENT_BY_ADMIN: "Confirmed as sent by an admin",
  CONFIRMED_NOT_SENT: "Confirmed as not sent by an admin",
};
export const reasonText = (r: string | null | undefined) => (r ? (REASON[r] ?? r) : "");

export const TRIGGER_LABEL: Record<string, string> = { USER_REGISTERED: "User registered", FOLLOW_UP: "Follow-up", SCHEDULED_EMAIL: "Scheduled email", MANUAL_SEND: "Manual send" };
export const ANCHOR_LABEL: Record<string, string> = { USER_REGISTERED: "registration", DEMO_REQUESTED: "demo request" };

export const delayText = (min: number) => (min === 0 ? "immediately" : min % 1440 === 0 ? `${min / 1440} day${min === 1440 ? "" : "s"}` : min % 60 === 0 ? `${min / 60} hour${min === 60 ? "" : "s"}` : `${min} min`);

export const VARIABLES = ["name", "first_name", "email", "company", "app_name", "unsubscribe_url"];
