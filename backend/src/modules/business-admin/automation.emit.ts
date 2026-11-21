import prisma from "@root/prisma.js";
import { logger } from "@/utils/logger.js";

// The one call website code makes when a customer activity has SUCCEEDED. Fire-and-forget by design:
//  - a no-op unless WHATSAPP_AUTOMATION_ENABLED=true, so a default install adds no work, queries or risk;
//  - never throws and never awaits the send, so a messaging problem can never fail or slow the customer's own action;
//  - the engine (AutomationService.trigger) is idempotent per (rule, eventId), so a hook reached twice sends once.

export interface AutomationEventInput {
  event: string;
  /** Stable id of the thing that happened (registration id, payment id…). */
  eventId: string;
  /** The customer's phone as stored on our side (10-digit Indian numbers get the 91 country code). */
  phone: string | null | undefined;
  fields?: Record<string, unknown>;
  /** The customer ticked the WhatsApp consent box on the form: record opt-in (with this evidence) BEFORE the event runs. */
  optIn?: { evidence: string; name?: string | null; email?: string | null; company?: string | null };
}

type OptInRecorder = (i: { waId: string; name?: string | null; email?: string | null; company?: string | null; evidence: string }) => Promise<unknown>;
let optInOverride: OptInRecorder | null = null;
/** Tests inject the opt-in recorder. */
export const setOptInRecorder = (fn: OptInRecorder | null): void => {
  optInOverride = fn;
};

type Trigger = (input: { event: string; eventId: string; phone: string; fields?: Record<string, unknown> }) => Promise<unknown>;
let override: Trigger | null = null;
/** Tests inject the trigger (and then the real engine, database and WhatsApp are never loaded). */
export const setAutomationTrigger = (fn: Trigger | null): void => {
  override = fn;
};

// Dev sandbox only: lets the in-memory sandbox engine receive events WITHOUT the real WHATSAPP_AUTOMATION_ENABLED switch.
// It is only ever set by devtest/devtest.router.ts (which exists only when NODE_ENV=development and DEV_TEST_LOGIN=true),
// and it replaces the real engine, so a sandbox event can never reach WhatsApp or the real database.
let sandboxTrigger: Trigger | null = null;
export const setSandboxAutomationTrigger = (fn: Trigger | null): void => {
  sandboxTrigger = fn;
};

export const automationSwitchOn = (env: NodeJS.ProcessEnv = process.env): boolean => env.WHATSAPP_AUTOMATION_ENABLED?.trim().toLowerCase() === "true";

/** Digits only; a bare 10-digit (or 0-prefixed 11-digit) Indian mobile number gets the 91 country code. */
export const toWaPhone = (raw: string | null | undefined): string => {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 11 && d.startsWith("0")) return `91${d.slice(1)}`;
  return d;
};

export function emitAutomationEvent(input: AutomationEventInput): void {
  if (!sandboxTrigger && !automationSwitchOn()) return;
  void (async () => {
    try {
      const phone = toWaPhone(input.phone);
      if (!phone) return;
      if (input.optIn) {
        // Consent must be on record before the template is attempted, or the engine skips it (OPT_IN_REQUIRED).
        // A failure here is logged and the event still runs, so the Automation history shows exactly why it was skipped.
        try {
          const record: OptInRecorder = optInOverride ?? (async (i) => (await import("./business-admin.route.js")).contacts.registerWebsiteOptIn(i));
          await record({ waId: phone, ...input.optIn });
        } catch (err) {
          logger.error(`[Automation] could not record WhatsApp opt-in for ${input.event}: ${err instanceof Error ? err.name : "unknown error"}`);
        }
      }
      const trigger: Trigger = sandboxTrigger ?? override ?? (async (i) => (await import("./business-admin.route.js")).automation.trigger(i));
      await trigger({ event: input.event, eventId: String(input.eventId), phone, fields: input.fields });
    } catch (err) {
      logger.error(`[Automation] could not emit ${input.event}: ${err instanceof Error ? err.name : "unknown error"}`);
    }
  })();
}

/** Same, looking the customer up by user id (name, email, phone). Lookup failures are swallowed like everything else. */
export function emitUserAutomationEvent(userId: string, event: string, eventId: string, fields: Record<string, unknown> = {}): void {
  if (!automationSwitchOn()) return;
  void (async () => {
    try {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, email: true, phoneNo: true } });
      if (!u) return;
      emitAutomationEvent({ event, eventId, phone: u.phoneNo, fields: { name: u.firstName || [u.firstName, u.lastName].filter(Boolean).join(" "), email: u.email, ...fields } });
    } catch (err) {
      logger.error(`[Automation] could not look up the customer for ${event}: ${err instanceof Error ? err.name : "unknown error"}`);
    }
  })();
}

export const formatEventDate = (d: Date | null | undefined): string =>
  d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "";
