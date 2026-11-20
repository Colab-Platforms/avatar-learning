import { toWaPhone } from "@/modules/business-admin/automation.emit.js";

// Plain, dependency-free validation so the customer gets a specific, honest message per field.
// The preferred date/time is what the customer typed in India time (IST, UTC+05:30).

export interface DemoBookingInput {
  name: string;
  email: string;
  phone: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string; // HH:mm (24h)
  company?: string;
  role?: string;
  companySize?: string;
  interestedTools?: string[];
  customRequirements?: string;
  message?: string;
  /** The customer ticked the (unchecked-by-default) WhatsApp consent box. Anything but literal `true` is "no". */
  whatsappConsent?: boolean;
}

export interface ValidDemoBooking {
  name: string;
  email: string;
  phone: string;
  waPhone: string;
  preferredAt: Date;
  company: string | null;
  role: string | null;
  companySize: string | null;
  interestedTools: string[];
  customRequirements: string | null;
  message: string | null;
  whatsappConsent: boolean;
}

export type DemoValidation = { ok: true; value: ValidDemoBooking } | { ok: false; errors: Record<string, string> };

const IST_OFFSET_MS = 5.5 * 3600_000;
const MAX_DAYS_AHEAD = 120;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max) : "");
const opt = (v: unknown, max: number): string | null => str(v, max) || null;

/** "2026-11-25" + "16:00" (IST) -> the UTC instant, or null when it is not a real date/time. */
export function istToDate(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!d || !t) return null;
  const [y, m, day] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const utc = Date.UTC(y, m - 1, day, Number(t[1]), Number(t[2])) - IST_OFFSET_MS;
  const back = new Date(utc + IST_OFFSET_MS);
  // Reject 2026-02-31 style dates that JS would silently roll over.
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== m - 1 || back.getUTCDate() !== day) return null;
  return new Date(utc);
}

export function validateDemoBooking(body: unknown, now: Date = new Date()): DemoValidation {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const name = str(b.name, 100);
  if (name.length < 2) errors.name = "Please enter your name.";

  const email = str(b.email, 254).toLowerCase();
  if (!EMAIL.test(email)) errors.email = "Please enter a valid email address.";

  const phone = str(b.phone, 30);
  const waPhone = toWaPhone(phone);
  if (!phone) errors.phone = "Please enter your phone number so we can confirm your demo.";
  else if (!/^\d{11,15}$/.test(waPhone) || (waPhone.startsWith("91") && waPhone.length === 12 && !/^91[6-9]/.test(waPhone))) {
    errors.phone = "Please enter a valid phone number, with country code if it is not an Indian number.";
  }

  const preferredDate = str(b.preferredDate, 10);
  const preferredTime = str(b.preferredTime, 5);
  const preferredAt = istToDate(preferredDate, preferredTime);
  if (!preferredDate || !preferredTime) errors.preferredAt = "Please choose a preferred date and time.";
  else if (!preferredAt) errors.preferredAt = "That date or time is not valid.";
  else if (preferredAt.getTime() < now.getTime()) errors.preferredAt = "Please choose a date and time in the future.";
  else if (preferredAt.getTime() > now.getTime() + MAX_DAYS_AHEAD * 86400_000) errors.preferredAt = `Please choose a date within the next ${MAX_DAYS_AHEAD} days.`;

  const tools = Array.isArray(b.interestedTools) ? b.interestedTools.map((t) => str(t, 60)).filter(Boolean).slice(0, 20) : [];

  if (Object.keys(errors).length > 0 || !preferredAt) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      email,
      phone,
      waPhone,
      preferredAt,
      company: opt(b.company, 120),
      role: opt(b.role, 80),
      companySize: opt(b.companySize, 60),
      interestedTools: tools,
      customRequirements: opt(b.customRequirements, 1000),
      message: opt(b.message, 2000),
      whatsappConsent: b.whatsappConsent === true,
    },
  };
}
