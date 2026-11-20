// Pure helpers for the Book a demo form. The server (POST /api/demo/book) is the authority: these only give instant
// feedback and build the request. Dates and times are India time (IST), which is what the customer means.

const IST_MS = 5.5 * 3600_000;

export interface DemoFormValues {
  name: string;
  company: string;
  email: string;
  phone: string;
  role: string;
  companySize: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string; // HH:mm
  interestedTools: string[];
  customRequirements?: string;
  message: string;
  whatsappConsent: boolean;
}

/** Today's date in India, as YYYY-MM-DD (the earliest date the picker offers). */
export const todayInIst = (now: Date = new Date()): string => new Date(now.getTime() + IST_MS).toISOString().slice(0, 10);

/** The UTC instant for an IST date + time, or null when it is not a real date/time. */
export function istInstant(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!d || !t) return null;
  const utc = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2])) - IST_MS;
  const back = new Date(utc + IST_MS);
  return back.getUTCDate() === Number(d[3]) && back.getUTCMonth() === Number(d[2]) - 1 ? new Date(utc) : null;
}

export type DemoFormErrors = Partial<Record<"phone" | "preferredAt", string>>;

/** Quick checks so the customer sees a problem before the request is sent. The server repeats every check. */
export function validateDemoForm(v: Pick<DemoFormValues, "phone" | "preferredDate" | "preferredTime">, now: Date = new Date()): DemoFormErrors {
  const errors: DemoFormErrors = {};
  const digits = v.phone.replace(/\D/g, "");
  if (!v.phone.trim()) errors.phone = "Please enter your phone number so we can confirm your demo.";
  else if (digits.length < 10 || digits.length > 15) errors.phone = "Please enter a valid phone number, with country code if it is not an Indian number.";
  const at = istInstant(v.preferredDate, v.preferredTime);
  if (!v.preferredDate || !v.preferredTime) errors.preferredAt = "Please choose a preferred date and time.";
  else if (!at) errors.preferredAt = "That date or time is not valid.";
  else if (at.getTime() < now.getTime()) errors.preferredAt = "Please choose a date and time in the future.";
  return errors;
}

export interface DemoBookingPayload {
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  company?: string;
  role?: string;
  companySize?: string;
  interestedTools: string[];
  customRequirements?: string;
  message?: string;
  whatsappConsent: boolean;
}

const t = (s: string | undefined): string | undefined => (s && s.trim() ? s.trim() : undefined);

export function buildDemoPayload(v: DemoFormValues): DemoBookingPayload {
  return {
    name: v.name.trim(),
    email: v.email.trim(),
    phone: v.phone.trim(),
    preferredDate: v.preferredDate,
    preferredTime: v.preferredTime,
    company: t(v.company),
    role: t(v.role),
    companySize: t(v.companySize),
    interestedTools: v.interestedTools,
    customRequirements: v.interestedTools.includes("custom") ? t(v.customRequirements) : undefined,
    message: t(v.message),
    // Only an explicit tick counts. The box is unchecked by default and never pre-selected.
    whatsappConsent: v.whatsappConsent === true,
  };
}

/** "25 Nov 2026, 4:00 PM" for the confirmation screen. */
export function formatPreferred(date: string, time: string): string {
  const at = istInstant(date, time);
  if (!at) return "";
  const d = at.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  const tm = at.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).toUpperCase();
  return `${d}, ${tm}`;
}

/** What to tell the customer when the booking could not be saved. Specific for a refused form, generic for anything else. */
export function describeBookingError(err: unknown): string {
  const r = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
  if (r?.status === 400 && typeof r.data?.message === "string" && r.data.message) return r.data.message;
  if (r?.status === 429) return "Too many requests from this connection. Please try again in a few minutes.";
  return "We could not save your request. Please try again in a moment, or email us.";
}

/**
 * The success screen. It confirms the BOOKING only. WhatsApp is mentioned as something we will try, never as done,
 * because the website cannot know whether the message will be sent.
 */
export function confirmationLines(opts: { whatsappConsent: boolean; when: string; duplicate?: boolean }): { title: string; lines: string[] } {
  const lines = [`Preferred time: ${opts.when}.`, "Our team will confirm your demo shortly."];
  if (opts.whatsappConsent) lines.push("You asked for WhatsApp updates, so we will also try to confirm on WhatsApp.");
  return { title: opts.duplicate ? "We already have your demo request" : "Your demo request is booked", lines };
}
