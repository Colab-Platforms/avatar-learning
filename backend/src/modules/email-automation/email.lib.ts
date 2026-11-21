import crypto from "node:crypto";

/** Pure helpers for Email Automation (no database, no network) so they can be checked in isolation. */

export const TEMPLATE_VARIABLES = ["name", "first_name", "email", "company", "app_name", "unsubscribe_url"] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
export type TemplateVars = Partial<Record<TemplateVariable, string>>;

export const SAMPLE_VARS: Required<TemplateVars> = {
  name: "Priya Sharma",
  first_name: "Priya",
  email: "priya@example.com",
  company: "Example Pvt Ltd",
  app_name: "Avatar AI Adoption",
  unsubscribe_url: "https://example.com/unsubscribe",
};

const VAR_RE = /\{\{\s*([a-z_]+)\s*\}\}/gi;

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Variable names used in a template string, de-duplicated. */
export function usedVariables(text: string): string[] {
  return [...new Set([...text.matchAll(VAR_RE)].map((m) => m[1].toLowerCase()))];
}

/** Variables used that the system does not provide (a typo like {{nmae}} would otherwise send an empty gap). */
export function unknownVariables(...texts: string[]): string[] {
  const known = new Set<string>(TEMPLATE_VARIABLES);
  return [...new Set(texts.flatMap(usedVariables))].filter((v) => !known.has(v));
}

/** Replaces {{var}}. HTML values are escaped; subject/plain-text values are not. Unknown or missing variables become "". */
export function renderString(text: string, vars: TemplateVars, mode: "html" | "text"): string {
  return text.replace(VAR_RE, (_m, raw: string) => {
    const v = vars[raw.toLowerCase() as TemplateVariable] ?? "";
    return mode === "html" ? escapeHtml(v) : v;
  });
}

/** A header value can never contain a line break (header injection). */
export const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>|<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function renderEmail(t: { subject: string; htmlBody: string; textBody?: string | null }, vars: TemplateVars, opts: { footer?: boolean } = {}): RenderedEmail {
  let html = renderString(t.htmlBody, vars, "html");
  let text = t.textBody ? renderString(t.textBody, vars, "text") : stripHtml(html);
  if (opts.footer && vars.unsubscribe_url) {
    const url = vars.unsubscribe_url;
    html += `<div style="font-family:Arial,sans-serif;font-size:12px;color:#8a939e;text-align:center;padding:16px 0">You are receiving this because you have an Avatar AI Adoption account and opted in to updates. <a href="${escapeHtml(url)}" style="color:#6b7cff">Unsubscribe</a></div>`;
    text += `\n\n--\nUnsubscribe: ${url}`;
  }
  return { subject: oneLine(renderString(t.subject, vars, "text")), html, text };
}

// ─── recipients ──────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
export const normalizeEmail = (e: string) => e.trim().toLowerCase();
export const isValidEmail = (e: unknown): e is string => typeof e === "string" && e.length <= 254 && EMAIL_RE.test(e.trim());

export interface Recipient {
  isActive: boolean;
  emailVerified: boolean;
  marketingEmailOptIn: boolean;
  emailUnsubscribedAt: Date | null;
}

/**
 * Whether an email of this type may go to this person.
 * Every email needs an active, verified account. Promotional email additionally needs recorded consent and no unsubscribe.
 */
export function canEmail(type: "TRANSACTIONAL" | "PROMOTIONAL", r: Recipient): { ok: true } | { ok: false; reason: string } {
  if (!r.isActive) return { ok: false, reason: "ACCOUNT_INACTIVE" };
  if (!r.emailVerified) return { ok: false, reason: "EMAIL_NOT_VERIFIED" };
  if (type === "PROMOTIONAL") {
    if (r.emailUnsubscribedAt) return { ok: false, reason: "UNSUBSCRIBED" };
    if (!r.marketingEmailOptIn) return { ok: false, reason: "NO_MARKETING_CONSENT" };
  }
  return { ok: true };
}

// ─── unsubscribe tokens ──────────────────────────────────────────────────────
const b64url = (b: Buffer) => b.toString("base64url");

export function unsubscribeToken(userId: string, secret: string): string {
  return b64url(crypto.createHmac("sha256", secret).update(`email-unsub:${userId}`).digest());
}

export function verifyUnsubscribeToken(userId: string, token: string, secret: string): boolean {
  const expected = Buffer.from(unsubscribeToken(userId, secret));
  const got = Buffer.from(token);
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
}

// ─── Resend webhook signature (Svix scheme) ──────────────────────────────────
/**
 * Verifies a Resend/Svix webhook: HMAC-SHA256 over `${id}.${timestamp}.${rawBody}` with the base64 secret (after "whsec_"),
 * compared in constant time against every `v1,<sig>` in the header, and the timestamp must be within the tolerance.
 */
export function verifyResendSignature(args: {
  secret: string;
  id: string | undefined;
  timestamp: string | undefined;
  signature: string | undefined;
  rawBody: string;
  nowMs?: number;
  toleranceSec?: number;
}): boolean {
  const { secret, id, timestamp, signature, rawBody } = args;
  if (!secret || !id || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = (args.nowMs ?? Date.now()) / 1000;
  if (Math.abs(now - ts) > (args.toleranceSec ?? 300)) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest();
  return signature.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const got = Buffer.from(sig, "base64");
    return got.length === expected.length && crypto.timingSafeEqual(got, expected);
  });
}

// ─── dedupe keys ─────────────────────────────────────────────────────────────
export const autoKey = (automationId: string, event: string, subjectId: string) => `auto:${automationId}:${event}:${subjectId}`;

/** Manual sends: the same template to the same person for the same time is one email within a 10-minute window (double-click safe). */
export function manualKey(templateId: string, userId: string, scheduledFor: Date | null, nowMs: number): string {
  const when = scheduledFor ? scheduledFor.toISOString() : `now-${Math.floor(nowMs / 600_000)}`;
  return `manual:${templateId}:${userId}:${when}`;
}

// ─── consent type ────────────────────────────────────────────────────────────
export type EmailType = "TRANSACTIONAL" | "PROMOTIONAL";

/**
 * The distinction the system enforces:
 *  - TRANSACTIONAL: one email caused by one person's own action (registration, demo request) or sent by hand to chosen people.
 *  - A SCHEDULED_EMAIL goes to a whole audience, so it is ALWAYS treated as PROMOTIONAL (marketing consent + unsubscribe),
 *    whatever its template is labelled. Creating one with a transactional template is also rejected up front.
 */
export const effectiveType = (trigger: string, templateType: EmailType): EmailType => (trigger === "SCHEDULED_EMAIL" ? "PROMOTIONAL" : templateType);

// ─── content snapshot ────────────────────────────────────────────────────────
export interface PayloadParts {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
  listUnsubscribe: string | null;
}

/** Fingerprint of exactly what will be sent. Checked before every attempt so one idempotency key is only ever used with one payload. */
export function payloadHash(p: PayloadParts): string {
  return crypto.createHash("sha256").update(JSON.stringify([p.toEmail, p.subject, p.html, p.text, p.listUnsubscribe])).digest("hex");
}

// ─── retry policy ────────────────────────────────────────────────────────────
export const MAX_ATTEMPTS = 3;
/** Minutes to wait before attempt number `attempt` + 1. */
export const backoffMinutes = (attempt: number) => [1, 5, 30][Math.min(attempt - 1, 2)] ?? 30;

/**
 * How long after a possibly-accepted attempt we still trust the provider's idempotency key. Resend does not state this in its SDK,
 * so this is a deliberately short, conservative margin (the commonly documented window is 24 hours). Beyond it, a retry could
 * duplicate, so the message is parked for a human instead.
 */
export const SAFE_IDEMPOTENCY_WINDOW_MS = 12 * 3600_000;

export type SendOutcome =
  /** Resend refused the request outright. Nothing was sent; a retry (new key) is safe. */
  | { kind: "REJECTED"; reason: string }
  /** Resend refused for capacity reasons (rate limit / quota). Nothing was sent; retry later with the SAME key. */
  | { kind: "TRANSIENT"; reason: string }
  /** We cannot tell whether it was accepted (timeout, network failure, server error, unknown error). Retry ONLY with the same key. */
  | { kind: "AMBIGUOUS"; reason: string }
  /** The same key is still being processed by Resend. The earlier request may succeed. Retry later with the SAME key. */
  | { kind: "IN_FLIGHT"; reason: string }
  /** The same key was already used with different content. An earlier attempt may have been accepted: needs a human. */
  | { kind: "CONFLICT"; reason: string };

// Names are from the Resend SDK's RESEND_ERROR_CODE_KEY type. The SDK does not map names to HTTP statuses, so no status is assumed.
const REJECTED_NAMES = new Set([
  "validation_error",
  "invalid_from_address",
  "invalid_parameter",
  "missing_required_field",
  "invalid_attachment",
  "invalid_access",
  "invalid_region",
  "missing_api_key",
  "invalid_api_key",
  "restricted_api_key",
  "not_found",
  "method_not_allowed",
  "security_error",
  "invalid_idempotency_key",
]);
const TRANSIENT_NAMES = new Set(["rate_limit_exceeded", "daily_quota_exceeded", "monthly_quota_exceeded"]);

/** Interprets a failed send by the SDK's typed error name. Anything not positively known to be a refusal is treated as ambiguous. */
export function classifySendError(err: unknown): SendOutcome {
  const e = err as { name?: string; message?: string } | undefined;
  const name = e?.name ?? "";
  const reason = (e?.message ?? "Unknown error").slice(0, 300);
  if (name === "concurrent_idempotent_requests") return { kind: "IN_FLIGHT", reason };
  if (name === "invalid_idempotent_request") return { kind: "CONFLICT", reason };
  if (REJECTED_NAMES.has(name)) return { kind: "REJECTED", reason };
  if (TRANSIENT_NAMES.has(name)) return { kind: "TRANSIENT", reason };
  // SendTimeout, application_error (the SDK also uses it for network failures), internal_server_error, or a name we do not know.
  return { kind: "AMBIGUOUS", reason };
}
