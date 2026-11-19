import type { InboundMessageEvent, ParsedWebhook, StatusEvent } from "./whatsapp.types.js";

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
/**
 * Postgres cannot store U+0000 in text/JSONB. One such character would make every retry of the
 * event fail (HTTP 500 -> Meta retries for days), so it is removed at the single parsing choke point.
 */
const NUL = new RegExp(String.fromCharCode(0), "g");
const clean = (s: string): string => s.replace(NUL, "");
const str = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const c = clean(v);
  return c.length > 0 ? c : undefined;
};

/** Deep copy of a JSON value with NUL characters removed from every string. */
const deepClean = <T,>(v: T): T => {
  if (typeof v === "string") return clean(v) as T;
  if (Array.isArray(v)) return v.map(deepClean) as T;
  if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [clean(k), deepClean(x)])) as T;
  return v;
};

/** Meta sends unix seconds as a string. */
function toDate(v: unknown): Date | undefined {
  const n = typeof v === "string" || typeof v === "number" ? Number(v) : NaN;
  if (!Number.isFinite(n) || n <= 0) return undefined;
  const d = new Date(n * 1000);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Best-effort human text for the message types that carry one. */
function extractText(message: Obj, type: string): string | undefined {
  if (type === "text" && isObj(message.text)) return str(message.text.body);
  if (type === "button" && isObj(message.button)) return str(message.button.text);
  if (type === "interactive" && isObj(message.interactive)) {
    const i = message.interactive;
    if (isObj(i.button_reply)) return str(i.button_reply.title);
    if (isObj(i.list_reply)) return str(i.list_reply.title);
  }
  return undefined;
}

/**
 * Turns Meta's `whatsapp_business_account` payload into normalised events.
 * Pure and defensive: unknown shapes are skipped, never thrown.
 * @param expectedPhoneNumberId when set, changes for other numbers are skipped.
 */
export function parseWhatsappWebhook(payload: unknown, expectedPhoneNumberId?: string): ParsedWebhook {
  const result: ParsedWebhook = { inbound: [], statuses: [], skipped: 0 };
  if (!isObj(payload) || !Array.isArray(payload.entry)) return result;

  for (const entry of payload.entry) {
    if (!isObj(entry) || !Array.isArray(entry.changes)) {
      result.skipped++;
      continue;
    }
    for (const change of entry.changes) {
      if (!isObj(change) || change.field !== "messages" || !isObj(change.value)) {
        result.skipped++;
        continue;
      }
      const value = change.value;
      const phoneNumberId = isObj(value.metadata) ? str(value.metadata.phone_number_id) : undefined;
      if (expectedPhoneNumberId && phoneNumberId !== expectedPhoneNumberId) {
        result.skipped++;
        continue;
      }

      const names = new Map<string, string>();
      if (Array.isArray(value.contacts)) {
        for (const c of value.contacts) {
          const waId = isObj(c) ? str(c.wa_id) : undefined;
          const profileName = isObj(c) && isObj(c.profile) ? str(c.profile.name) : undefined;
          if (waId && profileName) names.set(waId, profileName);
        }
      }

      if (Array.isArray(value.messages)) {
        for (const m of value.messages) {
          const id = isObj(m) ? str(m.id) : undefined;
          const from = isObj(m) ? str(m.from) : undefined;
          if (!isObj(m) || !id || !from) {
            result.skipped++;
            continue;
          }
          const type = str(m.type) ?? "unknown";
          const event: InboundMessageEvent = {
            waMessageId: id,
            from,
            contactName: names.get(from),
            type,
            textBody: extractText(m, type),
            timestamp: toDate(m.timestamp),
            phoneNumberId,
            raw: deepClean(m),
          };
          result.inbound.push(event);
        }
      }

      if (Array.isArray(value.statuses)) {
        for (const s of value.statuses) {
          const id = isObj(s) ? str(s.id) : undefined;
          const status = isObj(s) ? str(s.status) : undefined;
          if (!isObj(s) || !id || !status) {
            result.skipped++;
            continue;
          }
          const first = Array.isArray(s.errors) && isObj(s.errors[0]) ? s.errors[0] : undefined;
          const event: StatusEvent = {
            waMessageId: id,
            status: status.toLowerCase(),
            recipientId: str(s.recipient_id) ?? "unknown",
            timestamp: toDate(s.timestamp),
            phoneNumberId,
            error: first
              ? {
                  code: typeof first.code === "number" ? first.code : undefined,
                  title: str(first.title) ?? str(first.message),
                  details: isObj(first.error_data) ? str(first.error_data.details) : undefined,
                }
              : undefined,
          };
          result.statuses.push(event);
        }
      }
    }
  }
  return result;
}
