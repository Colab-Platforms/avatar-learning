import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";

export type OptInStatus = "UNKNOWN" | "GRANTED" | "WITHDRAWN";

export type ContactErrorCode = "NOT_FOUND" | "PHONE_EXISTS" | "INVALID" | "EVIDENCE_REQUIRED";

export class ContactError extends ApiError {
  constructor(
    readonly code: ContactErrorCode,
    message: string,
    statusCode: number,
    readonly field?: string,
  ) {
    super(message, statusCode);
    Object.setPrototypeOf(this, ContactError.prototype);
  }
}

// ─── pure helpers ──────────────────────────────────────────────────────────────
/**
 * Normalises a phone number to a WhatsApp id (digits only, with country code).
 * Indian mobiles typed without a country code (10 digits starting 6-9, or 0 + 10 digits) get 91; anything else must
 * already carry its country code (a leading + or 00). Length 8-15 digits (E.164).
 */
export function normalizeWaId(input: unknown, defaultCountry = "91"): { ok: true; waId: string } | { ok: false; reason: string } {
  if (typeof input !== "string") return { ok: false, reason: "Enter a phone number." };
  const raw = input.trim();
  if (!raw) return { ok: false, reason: "Enter a phone number." };
  if (/[^\d\s+().-]/.test(raw)) return { ok: false, reason: "Use digits only (spaces, +, - and brackets are fine)." };
  const hasPlus = raw.startsWith("+");
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (!hasPlus) {
    if (/^[6-9]\d{9}$/.test(digits)) digits = defaultCountry + digits;
    else if (/^0[6-9]\d{9}$/.test(digits)) digits = defaultCountry + digits.slice(1);
    else if (!/^\d{11,15}$/.test(digits)) return { ok: false, reason: "Add the country code, for example +91 98765 43210." };
  }
  if (!/^[1-9]\d{7,14}$/.test(digits)) return { ok: false, reason: "That does not look like a valid phone number." };
  return { ok: true, waId: digits };
}

const CONTROL = new RegExp("[\\u0000-\\u001F\\u007F]", "g");
/** Notes may contain line breaks and tabs; every other control character is removed. */
const NOTE_CONTROL = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]", "g");
const NAME = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .,'&()’/-]{0,79}$/u;
const EMAIL = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const TAG = /^[\p{L}\p{N}][\p{L}\p{N} _-]{0,29}$/u;
export const MAX_TAGS = 15;
export const MAX_NOTES = 2000;

const clean = (v: unknown, max: number): string => (typeof v === "string" ? v.replace(CONTROL, "").replace(/\s+/g, " ").trim().slice(0, max) : "");

export interface ContactInput {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  company?: unknown;
  notes?: unknown;
  tags?: unknown;
}

export interface ContactValues {
  waId?: string;
  name?: string;
  email?: string | null;
  company?: string | null;
  notes?: string | null;
  tags?: string[];
}

/** Validates the fields present in `input`. `partial` skips required checks (PATCH). Returns the first problem per field. */
export function validateContact(input: ContactInput, partial: boolean): { ok: true; values: ContactValues } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const values: ContactValues = {};

  if (!partial || input.phone !== undefined) {
    const r = normalizeWaId(input.phone);
    if (r.ok) values.waId = r.waId;
    else errors.phone = r.reason;
  }
  if (!partial || input.name !== undefined) {
    const name = clean(input.name, 80);
    if (!name) errors.name = "Enter a name.";
    else if (!NAME.test(name) || /[<>]/.test(name)) errors.name = "Names can use letters, numbers, spaces and . , ' & ( ) / -";
    else values.name = name;
  }
  if (input.email !== undefined) {
    const email = clean(input.email, 254).toLowerCase();
    if (!email) values.email = null;
    else if (!EMAIL.test(email)) errors.email = "Enter a valid email address.";
    else values.email = email;
  }
  if (input.company !== undefined) {
    const company = clean(input.company, 80);
    if (company && (!NAME.test(company) || /[<>]/.test(company))) errors.company = "Company names can use letters, numbers, spaces and . , ' & ( ) / -";
    else values.company = company || null;
  }
  if (input.notes !== undefined) {
    const notes = typeof input.notes === "string" ? input.notes.replace(NOTE_CONTROL, "").trim() : "";
    if (notes.length > MAX_NOTES) errors.notes = `Notes can be at most ${MAX_NOTES} characters.`;
    else values.notes = notes || null;
  }
  if (input.tags !== undefined) {
    const raw = Array.isArray(input.tags) ? input.tags : typeof input.tags === "string" ? input.tags.split(",") : null;
    if (!raw) errors.tags = "Tags must be a list.";
    else {
      const tags = [...new Set(raw.map((t) => clean(t, 30).toLowerCase()).filter(Boolean))];
      if (tags.length > MAX_TAGS) errors.tags = `Use at most ${MAX_TAGS} tags.`;
      else if (tags.some((t) => !TAG.test(t))) errors.tags = "Tags can use letters, numbers, spaces, _ and - (up to 30 characters).";
      else values.tags = tags;
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, values };
}

/** Inbound messages that withdraw consent. Exact (case-insensitive) match only, so ordinary sentences never trigger it. */
const OPT_OUT_WORDS = new Set(["stop", "stop all", "stopall", "unsubscribe", "opt out", "optout", "cancel subscription"]);
export const isOptOutKeyword = (text: string | null | undefined): boolean => !!text && OPT_OUT_WORDS.has(text.trim().toLowerCase().replace(/[.!]+$/, ""));

export const OPT_IN_EVIDENCE_TYPES = ["website_form", "whatsapp_optin_flow", "written", "verbal_recorded", "existing_customer_agreement"] as const;
export type OptInEvidenceType = (typeof OPT_IN_EVIDENCE_TYPES)[number];

// ─── data access ───────────────────────────────────────────────────────────────
export interface ContactsDb {
  whatsappContact: {
    findMany(args?: any): Promise<any[]>;
    findUnique(args: any): Promise<any | null>;
    count(args?: any): Promise<number>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
    delete(args: any): Promise<any>;
    upsert(args: any): Promise<any>;
  };
}

export interface ContactDto {
  id: string;
  waId: string;
  name: string;
  email: string | null;
  company: string | null;
  notes: string | null;
  tags: string[];
  source: string;
  optIn: { status: OptInStatus; evidence: string | null; at: string | null; outAt: string | null; bySomeoneElse: boolean };
  createdAt: string;
}

const isUnique = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";

export const toContactDto = (r: any): ContactDto => ({
  id: r.id,
  waId: r.waId,
  name: r.name,
  email: r.email ?? null,
  company: r.company ?? null,
  notes: r.notes ?? null,
  tags: r.tags ?? [],
  source: r.source,
  optIn: {
    status: r.optInStatus,
    evidence: r.optInEvidence ?? null,
    at: r.optInAt ? new Date(r.optInAt).toISOString() : null,
    outAt: r.optOutAt ? new Date(r.optOutAt).toISOString() : null,
    bySomeoneElse: !!r.optStatusByUserId,
  },
  createdAt: new Date(r.createdAt).toISOString(),
});

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

export const MAX_IMPORT_ROWS = 500;

export class ContactsService {
  constructor(
    private readonly db: ContactsDb,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async list(opts: { q?: string; tag?: string; optIn?: OptInStatus; page: number; pageSize: number }): Promise<{ items: ContactDto[]; total: number }> {
    const q = opts.q?.trim();
    const digits = q?.replace(/\D/g, "") ?? "";
    const where: any = {
      ...(opts.tag ? { tags: { has: opts.tag.toLowerCase() } } : {}),
      ...(opts.optIn ? { optInStatus: opts.optIn } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
              ...(digits.length >= 3 ? [{ waId: { contains: digits } }] : []),
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.db.whatsappContact.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (opts.page - 1) * opts.pageSize, take: opts.pageSize }),
      this.db.whatsappContact.count({ where }),
    ]);
    return { items: rows.map(toContactDto), total };
  }

  async get(id: string): Promise<ContactDto> {
    const r = await this.db.whatsappContact.findUnique({ where: { id } });
    if (!r) throw new ContactError("NOT_FOUND", "Contact not found.", STATUS_CODES.NOT_FOUND);
    return toContactDto(r);
  }

  async getByWaId(waId: string): Promise<ContactDto | null> {
    const r = await this.db.whatsappContact.findUnique({ where: { waId } });
    return r ? toContactDto(r) : null;
  }

  async create(input: ContactInput, userId: string): Promise<ContactDto> {
    const v = validateContact(input, false);
    if (!v.ok) {
      const [field, message] = Object.entries(v.errors)[0];
      throw new ContactError("INVALID", message, STATUS_CODES.BAD_REQUEST, field);
    }
    try {
      const r = await this.db.whatsappContact.create({
        data: { waId: v.values.waId, name: v.values.name, email: v.values.email ?? null, company: v.values.company ?? null, notes: v.values.notes ?? null, tags: v.values.tags ?? [], source: "manual", createdByUserId: userId },
      });
      return toContactDto(r);
    } catch (e) {
      if (isUnique(e)) throw new ContactError("PHONE_EXISTS", "A contact with this phone number already exists.", STATUS_CODES.CONFLICT, "phone");
      throw e;
    }
  }

  async update(id: string, input: ContactInput, _userId: string): Promise<ContactDto> {
    const v = validateContact(input, true);
    if (!v.ok) {
      const [field, message] = Object.entries(v.errors)[0];
      throw new ContactError("INVALID", message, STATUS_CODES.BAD_REQUEST, field);
    }
    if (Object.keys(v.values).length === 0) throw new ContactError("INVALID", "Nothing to change.", STATUS_CODES.BAD_REQUEST);
    await this.get(id);
    try {
      return toContactDto(await this.db.whatsappContact.update({ where: { id }, data: v.values }));
    } catch (e) {
      if (isUnique(e)) throw new ContactError("PHONE_EXISTS", "A contact with this phone number already exists.", STATUS_CODES.CONFLICT, "phone");
      throw e;
    }
  }

  /** Deletes the saved contact only. Messages and conversation history stay (they are the business record). */
  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.db.whatsappContact.delete({ where: { id } });
  }

  /**
   * Bulk create/update from parsed rows. An import can NEVER change consent: new contacts start UNKNOWN and existing
   * contacts keep whatever opt-in status they have. Existing contacts get blank fields filled and tags merged.
   */
  async importRows(rows: ContactInput[], userId: string): Promise<ImportResult> {
    if (rows.length > MAX_IMPORT_ROWS) throw new ContactError("INVALID", `Import at most ${MAX_IMPORT_ROWS} rows at a time.`, STATUS_CODES.BAD_REQUEST);
    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };
    const seen = new Set<string>();
    for (let i = 0; i < rows.length; i++) {
      const v = validateContact(rows[i] ?? {}, false);
      if (!v.ok) {
        result.skipped++;
        result.errors.push({ row: i + 1, reason: Object.values(v.errors)[0] });
        continue;
      }
      const { waId } = v.values as { waId: string };
      if (seen.has(waId)) {
        result.skipped++;
        result.errors.push({ row: i + 1, reason: "Duplicate phone number in this file." });
        continue;
      }
      seen.add(waId);
      const existing = await this.db.whatsappContact.findUnique({ where: { waId } });
      if (existing) {
        const patch: Record<string, unknown> = {};
        if (!existing.email && v.values.email) patch.email = v.values.email;
        if (!existing.company && v.values.company) patch.company = v.values.company;
        if (v.values.tags?.length) patch.tags = [...new Set([...(existing.tags ?? []), ...v.values.tags])].slice(0, MAX_TAGS);
        if (Object.keys(patch).length) await this.db.whatsappContact.update({ where: { id: existing.id }, data: patch });
        result.updated++;
      } else {
        await this.db.whatsappContact.create({
          data: { waId, name: v.values.name, email: v.values.email ?? null, company: v.values.company ?? null, notes: v.values.notes ?? null, tags: v.values.tags ?? [], source: "import", createdByUserId: userId },
        });
        result.created++;
      }
    }
    return result;
  }

  /**
   * Records the consent state for business-initiated messages. Granting needs recorded evidence (what proves the
   * customer agreed); withdrawing needs none. Both are attributed to the team member and time-stamped.
   */
  async setOptIn(id: string, input: { status: OptInStatus; evidence?: unknown; note?: unknown }, userId: string): Promise<ContactDto> {
    const existing = await this.get(id);
    const now = this.clock();
    if (input.status === "GRANTED") {
      const type = typeof input.evidence === "string" ? input.evidence : "";
      if (!(OPT_IN_EVIDENCE_TYPES as readonly string[]).includes(type)) {
        throw new ContactError("EVIDENCE_REQUIRED", "Choose how the customer gave consent before recording it.", STATUS_CODES.BAD_REQUEST, "evidence");
      }
      const note = clean(input.note, 200);
      if (note.length < 3) throw new ContactError("EVIDENCE_REQUIRED", "Add a short reference for the consent (for example the form name or date).", STATUS_CODES.BAD_REQUEST, "note");
      return toContactDto(
        await this.db.whatsappContact.update({
          where: { id },
          data: { optInStatus: "GRANTED", optInEvidence: `${type}: ${note}`, optInAt: now, optOutAt: null, optStatusByUserId: userId },
        }),
      );
    }
    if (input.status === "WITHDRAWN") {
      return toContactDto(await this.db.whatsappContact.update({ where: { id }, data: { optInStatus: "WITHDRAWN", optOutAt: now, optStatusByUserId: userId } }));
    }
    if (input.status === "UNKNOWN") {
      if (existing.optIn.status === "WITHDRAWN") {
        throw new ContactError("INVALID", "A withdrawn consent cannot be reset. Record new consent with its evidence instead.", STATUS_CODES.CONFLICT, "status");
      }
      return toContactDto(await this.db.whatsappContact.update({ where: { id }, data: { optInStatus: "UNKNOWN", optInEvidence: null, optInAt: null, optStatusByUserId: userId } }));
    }
    throw new ContactError("INVALID", "Invalid consent status.", STATUS_CODES.BAD_REQUEST, "status");
  }

  /** The customer replied STOP (or similar): withdraw consent immediately, creating a minimal contact if needed. */
  async registerOptOut(waId: string, profileName?: string | null, messageAt?: Date): Promise<void> {
    const now = this.clock();
    // Idempotent: the webhook may run this again for a redelivered message.
    const existing = await this.db.whatsappContact.findUnique({ where: { waId } });
    if (existing?.optInStatus === "WITHDRAWN") return;
    // A redelivered STOP older than a consent someone recorded afterwards must not undo that newer consent.
    if (existing?.optInStatus === "GRANTED" && existing.optInAt && messageAt && messageAt < existing.optInAt) return;
    await this.db.whatsappContact.upsert({
      where: { waId },
      create: { waId, name: profileName?.slice(0, 80) || `+${waId}`, tags: [], source: "inbound", optInStatus: "WITHDRAWN", optOutAt: now, optStatusByUserId: null },
      update: { optInStatus: "WITHDRAWN", optOutAt: now, optStatusByUserId: null },
    });
  }

  /** Consent guard for the send path: only an explicit WITHDRAWN blocks; GRANTED lets business-initiated templates through. */
  async consentFor(waId: string): Promise<"granted" | "withdrawn" | "unknown"> {
    const r = await this.db.whatsappContact.findUnique({ where: { waId } });
    if (!r) return "unknown";
    return r.optInStatus === "GRANTED" ? "granted" : r.optInStatus === "WITHDRAWN" ? "withdrawn" : "unknown";
  }

  async tags(): Promise<string[]> {
    const rows = await this.db.whatsappContact.findMany({ select: { tags: true }, take: 5000 });
    return [...new Set(rows.flatMap((r) => r.tags ?? []))].sort();
  }
}
