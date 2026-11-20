import { createHash } from "node:crypto";
import { logger } from "@/utils/logger.js";
import { emitAutomationEvent, formatEventDate } from "@/modules/business-admin/automation.emit.js";
import type { ValidDemoBooking } from "./demo.validators.js";

/** The small slice of the Prisma client this module uses (tests pass an in-memory one). */
export interface DemoDb {
  demoBooking: {
    findUnique(args: any): Promise<any | null>;
    create(args: any): Promise<any>;
  };
  whatsappContact: {
    findUnique(args: any): Promise<any | null>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
  };
}

let sandboxDb: DemoDb | null = null;
/** Dev sandbox only (set by devtest.router.ts): bookings and consent then go to the in-memory sandbox, never to Prisma. */
export const setSandboxDemoDb = (db: DemoDb | null): void => {
  sandboxDb = db;
};
export const getSandboxDemoDb = (): DemoDb | null => sandboxDb;

export interface BookingResult {
  id: string;
  /** True when this exact request had already been saved (double click, retry): nothing new was created. */
  duplicate: boolean;
  preferredAt: string;
}

const isUnique = (err: unknown) => typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
const kind = (err: unknown) => (err instanceof Error ? `${err.name}${(err as { code?: string }).code ? ` (${(err as { code?: string }).code})` : ""}` : "unknown error");

/** The same request always yields the same key, so a repeated submit finds the same booking instead of creating a second. */
export const requestKeyFor = (b: Pick<ValidDemoBooking, "waPhone" | "email" | "preferredAt">): string =>
  createHash("sha256").update(`${b.waPhone}|${b.email}|${b.preferredAt.toISOString()}`).digest("hex");

/** "4:00 PM" in India time, the way a customer reads it. */
export const formatDemoTime = (d: Date): string => d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).toUpperCase();

export class DemoBookingService {
  constructor(
    private readonly db: DemoDb,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /**
   * 1. Save the booking (or find the identical earlier one).
   * 2. If the customer ticked the WhatsApp box, record that opt-in with its evidence (never overriding a withdrawal).
   * 3. Tell the automation engine `demo.requested`, fire-and-forget.
   * Steps 2 and 3 can fail or be skipped for any reason (automation off, no consent, template not approved, WhatsApp down):
   * the booking is already saved and the customer still gets a confirmation. That is the contract.
   */
  async book(input: ValidDemoBooking): Promise<BookingResult> {
    const requestKey = requestKeyFor(input);
    let row = await this.db.demoBooking.findUnique({ where: { requestKey } });
    let duplicate = true;
    if (!row) {
      try {
        row = await this.db.demoBooking.create({
          data: {
            name: input.name,
            email: input.email,
            phone: input.phone,
            waPhone: input.waPhone,
            company: input.company,
            role: input.role,
            companySize: input.companySize,
            interestedTools: input.interestedTools,
            customRequirements: input.customRequirements,
            message: input.message,
            preferredAt: input.preferredAt,
            whatsappConsent: input.whatsappConsent,
            requestKey,
          },
        });
        duplicate = false;
      } catch (err) {
        // Two identical submits at the same instant: the loser reads the winner's row.
        if (!isUnique(err)) throw err;
        row = await this.db.demoBooking.findUnique({ where: { requestKey } });
        if (!row) throw err;
      }
    }

    if (!duplicate && input.whatsappConsent) await this.recordConsent(input, row.id);

    // The booking id is the event id: the engine sends at most one message per (rule, booking), however often this runs.
    emitAutomationEvent({
      event: "demo.requested",
      eventId: row.id,
      phone: row.waPhone,
      fields: { name: row.name, email: row.email, demo_date: formatEventDate(row.preferredAt), demo_time: formatDemoTime(row.preferredAt) },
    });

    return { id: row.id, duplicate, preferredAt: new Date(row.preferredAt).toISOString() };
  }

  /** Records "the customer agreed on our website form" as consent evidence. Never throws: consent is optional to booking. */
  private async recordConsent(b: ValidDemoBooking, bookingId: string): Promise<void> {
    try {
      const now = this.clock();
      const evidence = `website_form: Book a demo form, booking ${bookingId}, ${now.toISOString().slice(0, 10)}`;
      const existing = await this.db.whatsappContact.findUnique({ where: { waId: b.waPhone } });
      if (!existing) {
        await this.db.whatsappContact.create({
          data: { waId: b.waPhone, name: b.name, email: b.email, company: b.company, tags: ["demo"], source: "website_demo", optInStatus: "GRANTED", optInEvidence: evidence, optInAt: now, optStatusByUserId: null },
        });
        return;
      }
      // A customer who replied STOP stays opted out; a form tick does not silently reverse it.
      if (existing.optInStatus === "WITHDRAWN" || existing.optInStatus === "GRANTED") return;
      await this.db.whatsappContact.update({ where: { id: existing.id }, data: { optInStatus: "GRANTED", optInEvidence: evidence, optInAt: now, optOutAt: null, optStatusByUserId: null } });
    } catch (err) {
      logger.error(`[Demo] Could not record WhatsApp consent: ${kind(err)}`);
    }
  }
}
