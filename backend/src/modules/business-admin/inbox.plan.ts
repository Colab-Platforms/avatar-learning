import { AMBIGUOUS_MARKER } from "@/modules/whatsapp/whatsapp.pending.js";
import { mediaOf, replyTargetOf } from "@/modules/whatsapp/whatsapp.media.js";
import type { InboxFilter, InboxMessage, MediaDto, MessageKind, MessageState, PersonRef, ReplyRef, StoredMessage } from "./inbox.types.js";

/** WhatsApp lets a business send free-form messages only within 24h of the customer's last message. */
export const WINDOW_MS = 24 * 60 * 60 * 1000;
/** An outbound row that stays SENDING this long was never confirmed (e.g. the server stopped mid-send). */
export const STALE_SENDING_MS = 2 * 60 * 1000;
export const PREVIEW_LENGTH = 140;

export function windowState(lastInboundAt: Date | null | undefined, now: Date): { open: boolean; expiresAt: Date | null } {
  if (!lastInboundAt) return { open: false, expiresAt: null };
  const expiresAt = new Date(lastInboundAt.getTime() + WINDOW_MS);
  return { open: expiresAt.getTime() > now.getTime(), expiresAt };
}

export interface ContactAggregate {
  contactWaId: string;
  messageCount: number;
  /** Newest message (any direction). */
  lastAt: Date;
  /** Newest inbound message, if any. */
  lastInboundAt: Date | null;
  /** Every distinct profile name seen for this contact (used by search). */
  names: string[];
}

export interface ConversationState {
  contactWaId: string;
  assignedToUserId: string | null;
  lastReadAt: Date | null;
}

export const isUnread = (agg: ContactAggregate, conv: ConversationState | undefined): boolean =>
  agg.lastInboundAt !== null && (!conv?.lastReadAt || agg.lastInboundAt.getTime() > conv.lastReadAt.getTime());

/** Digits only, so "+91 98765-43210" matches the stored wa_id. */
export const digitsOf = (s: string): string => s.replace(/\D/g, "");

export interface PlanInput {
  contacts: ContactAggregate[];
  states: Map<string, ConversationState>;
  filter: InboxFilter;
  assignee?: string;
  q?: string;
  meId: string;
  page: number;
  pageSize: number;
}

/**
 * Filters, searches, sorts (latest activity first) and paginates conversation aggregates.
 * Pure: the store supplies the aggregates, this decides what the team sees.
 */
export function planConversationList(input: PlanInput): { pageContacts: ContactAggregate[]; total: number; unreadTotal: number } {
  const { contacts, states, filter, assignee, meId, page, pageSize } = input;
  const q = (input.q ?? "").trim().toLowerCase();
  const qDigits = digitsOf(q);

  const unreadTotal = contacts.filter((c) => isUnread(c, states.get(c.contactWaId))).length;

  const matches = contacts.filter((c) => {
    const st = states.get(c.contactWaId);
    const assignedTo = st?.assignedToUserId ?? null;
    if (filter === "unread" && !isUnread(c, st)) return false;
    if (filter === "mine" && assignedTo !== meId) return false;
    if (filter === "unassigned" && assignedTo !== null) return false;
    if (assignee && assignedTo !== assignee) return false;
    if (q) {
      const byName = c.names.some((n) => n.toLowerCase().includes(q));
      const byPhone = qDigits.length >= 2 && c.contactWaId.includes(qDigits);
      if (!byName && !byPhone) return false;
    }
    return true;
  });

  matches.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime() || a.contactWaId.localeCompare(b.contactWaId));
  const start = (page - 1) * pageSize;
  return { pageContacts: matches.slice(start, start + pageSize), total: matches.length, unreadTotal };
}

/** Every id the dev sandbox's mock sender makes up starts with this. A real WhatsApp id never does. */
export const SIMULATED_WAMID_PREFIX = "wamid.DEVTEST";

/** True when a message was handled by the sandbox mock: either the store says so, or the id is a mock id (defence in depth). */
export const isSimulatedMessage = (m: Pick<StoredMessage, "waMessageId">, storeIsSandbox = false): boolean =>
  storeIsSandbox || (typeof m.waMessageId === "string" && m.waMessageId.startsWith(SIMULATED_WAMID_PREFIX));

export const messageState = (
  m: Pick<StoredMessage, "direction" | "status" | "createdAt"> & { sentAt?: Date | null },
  now: Date,
  simulated = false,
): MessageState => {
  if (m.direction === "INBOUND") return "received";
  switch (m.status) {
    case "SENDING":
      return now.getTime() - m.createdAt.getTime() > STALE_SENDING_MS ? "unconfirmed" : "sending";
    // Sandbox: whatever progress the row records, a mock produced it. Never call it sent/delivered/read.
    // Real: SENT without a WhatsApp confirmation (sentAt) is only "accepted" by the API.
    case "SENT":
      return simulated ? "simulated" : m.sentAt ? "sent" : "accepted";
    case "DELIVERED":
      return simulated ? "simulated" : "delivered";
    case "READ":
      return simulated ? "simulated" : "read";
    case "FAILED":
      return "failed";
    default:
      return simulated ? "simulated" : "accepted";
  }
};

export { AMBIGUOUS_MARKER };

/** What kind of message this is, for icons, previews and retry rules. */
export function kindOf(messageType: string | null, payload: unknown): MessageKind {
  switch (messageType) {
    case "text":
    case "button":
    case "interactive":
      return "text";
    case "image":
    case "video":
    case "audio":
    case "document":
    case "sticker":
    case "template":
      return messageType;
    case null:
      return mediaOf(null, payload) ? (mediaOf(null, payload)!.kind as MessageKind) : "text";
    default:
      return "other";
  }
}

const REPLY_PREVIEW = 120;

/** When the Graph API accepted the message (written by InboxStore.markSent into the payload). */
const acceptedAtOf = (payload: unknown): string | null => {
  const v = payload && typeof payload === "object" ? (payload as { acceptedAt?: unknown }).acceptedAt : null;
  return typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : null;
};

export function toMessageDto(
  m: StoredMessage,
  ctx: { now: Date; names: Map<string, string>; retriedIds: Set<string>; replies?: Map<string, ReplyRef>; sandbox?: boolean },
): InboxMessage {
  const simulated = m.direction === "OUTBOUND" && isSimulatedMessage(m, ctx.sandbox === true);
  const state = messageState(m, ctx.now, simulated);
  const failed = state === "failed";
  const kind = kindOf(m.messageType, m.payload);
  const stored = mediaOf(m.messageType, m.payload);
  const media: MediaDto | null = stored
    ? { kind: stored.kind, mimeType: stored.mimeType, filename: stored.filename, sizeBytes: stored.sizeBytes, caption: stored.caption ?? m.textBody, voice: stored.voice, available: stored.id !== null }
    : null;
  const tpl = m.messageType === "template" && m.payload && typeof m.payload === "object" ? ((m.payload as { template?: { name?: string; language?: string } }).template ?? null) : null;
  const replyWamid = replyTargetOf(m.payload);
  const replyTo = replyWamid ? (ctx.replies?.get(replyWamid) ?? { id: null, text: null, kind: "other" as MessageKind, direction: null }) : null;
  // A failed message can be resent when we still hold what to send: text, a template, or media that was already uploaded.
  const resendable = kind === "text" || kind === "template" || (media !== null && media.available && kind !== "sticker");
  return {
    id: m.id,
    direction: m.direction,
    state,
    type: m.messageType,
    kind,
    text: media ? null : m.textBody,
    media,
    template: tpl && tpl.name ? { name: String(tpl.name), language: String(tpl.language ?? "") } : null,
    replyTo,
    at: (m.messageTimestamp ?? m.createdAt).toISOString(),
    sentBy: m.sentByUserId ? { id: m.sentByUserId, name: ctx.names.get(m.sentByUserId) ?? "Team member" } : null,
    error: failed || m.errorCode !== null || m.errorTitle ? { code: m.errorCode, title: m.errorTitle, ambiguous: m.errorDetails === AMBIGUOUS_MARKER } : null,
    simulated,
    timeline: {
      acceptedAt: acceptedAtOf(m.payload),
      sentAt: m.sentAt ? m.sentAt.toISOString() : null,
      deliveredAt: m.deliveredAt ? m.deliveredAt.toISOString() : null,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      failedAt: m.failedAt ? m.failedAt.toISOString() : null,
    },
    canRetry: m.direction === "OUTBOUND" && failed && resendable && !ctx.retriedIds.has(m.id),
    clientRequestId: m.clientRequestId,
  };
}

/** Short quoted-message preview used by replies. */
export function replyRefOf(m: StoredMessage): ReplyRef {
  const kind = kindOf(m.messageType, m.payload);
  const media = mediaOf(m.messageType, m.payload);
  const text = m.textBody ?? media?.caption ?? null;
  return { id: m.id, text: text ? text.slice(0, REPLY_PREVIEW) : null, kind, direction: m.direction };
}

/** Deterministic idempotency key for retrying a failed message: a double click can never create two retries. */
export const retryKeyFor = (failedMessageId: string): string => `retry-of:${failedMessageId}`;

/** Opaque cursor over (createdAt, id) so pages stay stable while new messages arrive. */
export const encodeCursor = (createdAt: Date, id: string): string => `${createdAt.getTime()}_${id}`;
export function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  const m = /^(\d{10,15})_([A-Za-z0-9_-]{5,64})$/.exec(cursor);
  return m ? { createdAt: new Date(Number(m[1])), id: m[2] } : null;
}

export const displayName = (u: { firstName?: string | null; lastName?: string | null; email?: string | null }): string => {
  const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  return full || (u.email ? u.email.split("@")[0] : "Team member");
};

export const personRef = (id: string | null | undefined, names: Map<string, string>): PersonRef | null =>
  id ? { id, name: names.get(id) ?? "Team member" } : null;
