// Pure helpers for the WhatsApp Inbox UI (no React, no network) so the rules are unit-testable.
import type { InboxMessage, MessageState } from "./businessAdminApi";

export const MAX_MESSAGE_LENGTH = 4096;
export const NEAR_BOTTOM_PX = 80;

/** A message the user just sent that the server has not confirmed yet (or that never reached the server). */
export interface LocalMessage extends InboxMessage {
  local: true;
  /** Set when the request failed before the server could answer (network down, 4xx/5xx without a stored row). */
  localError?: string;
}

export type ThreadMessage = InboxMessage | LocalMessage;
export const isLocal = (m: ThreadMessage): m is LocalMessage => (m as LocalMessage).local === true;

/** Stable per-send id: the server uses it to make retries and double clicks safe. */
export function newClientRequestId(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  const raw = c && "randomUUID" in c ? c.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  return `web-${raw}`.slice(0, 64);
}

export function localMessage(text: string, clientRequestId: string, me: { id: string; name: string } | null, now = new Date()): LocalMessage {
  return {
    local: true,
    id: `local-${clientRequestId}`,
    direction: "OUTBOUND",
    state: "sending",
    type: "text",
    kind: "text",
    text,
    media: null,
    template: null,
    replyTo: null,
    at: now.toISOString(),
    sentBy: me,
    error: null,
    canRetry: false,
    clientRequestId,
  };
}

const time = (m: InboxMessage) => new Date(m.at).getTime();

/**
 * Combines every source of messages into one chronological list without duplicates:
 *  - server messages win over each other by id (newest fetch replaces older copies),
 *  - a local (optimistic) message disappears as soon as the server returned the same clientRequestId,
 *  - local messages that have not been confirmed stay at the end.
 */
export function mergeThread(sources: InboxMessage[][], locals: LocalMessage[]): ThreadMessage[] {
  const byId = new Map<string, InboxMessage>();
  for (const list of sources) for (const m of list) byId.set(m.id, m);
  const server = [...byId.values()];
  const confirmed = new Set(server.map((m) => m.clientRequestId).filter((x): x is string => !!x));
  const pending = locals.filter((l) => !l.clientRequestId || !confirmed.has(l.clientRequestId));
  server.sort((a, b) => time(a) - time(b) || a.id.localeCompare(b.id));
  return [...server, ...pending];
}

/** Whether the viewer is close enough to the newest message that new ones should scroll into view. */
export function isNearBottom(el: { scrollTop: number; clientHeight: number; scrollHeight: number }, threshold = NEAR_BOTTOM_PX): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
}

export interface ScrollDecision {
  /** Jump to the newest message. */
  scrollToBottom: boolean;
  /** Show a "N new messages" chip instead of moving the viewport. */
  showNewChip: boolean;
}

/**
 * Auto-scroll without disrupting someone reading older messages:
 *  - opening a conversation, or the viewer's own send -> always go to the newest message;
 *  - new messages while the viewer is near the bottom -> follow them;
 *  - new messages while reading history -> do not move; offer a chip.
 */
export function decideScroll(input: { conversationChanged: boolean; addedAtEnd: number; wasNearBottom: boolean; lastIsOwnLocal: boolean }): ScrollDecision {
  if (input.conversationChanged) return { scrollToBottom: true, showNewChip: false };
  if (input.addedAtEnd <= 0) return { scrollToBottom: false, showNewChip: false };
  if (input.lastIsOwnLocal || input.wasNearBottom) return { scrollToBottom: true, showNewChip: false };
  return { scrollToBottom: false, showNewChip: true };
}

export const STATE_LABEL: Record<MessageState, string> = {
  sending: "Sending…",
  accepted: "Accepted",
  simulated: "Simulated",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed",
  unconfirmed: "Not confirmed",
  received: "Received",
};

export const stateLabel = (s: MessageState): string => STATE_LABEL[s];

/** One plain sentence per state: what it does and does NOT prove. */
export const STATE_HELP: Record<MessageState, string> = {
  sending: "Being handed to WhatsApp.",
  accepted: "WhatsApp's API accepted this message. WhatsApp has not confirmed it yet, so it may not have reached the customer.",
  sent: "WhatsApp confirmed it received the message for delivery. It has not been confirmed on the customer's phone yet.",
  delivered: "Delivered to the customer's phone.",
  read: "The customer has read the message.",
  failed: "WhatsApp could not send or deliver this message.",
  unconfirmed: "WhatsApp did not confirm this message. Check the conversation before sending again.",
  received: "Message from the customer.",
  simulated: "Sandbox only. A test sender handled this message. Nothing was sent to WhatsApp and nobody received it.",
};

/** States that claim WhatsApp itself did something. A simulated message may never show any of them. */
const REAL_PROGRESS: ReadonlySet<MessageState> = new Set(["accepted", "sent", "delivered", "read"]);

export interface StatusView {
  /** The state to show. For a simulated message this is forced to "simulated" so it can never read as real progress. */
  state: MessageState;
  label: string;
  help: string;
  simulated: boolean;
  /** Where the message went: the dev sandbox (nowhere) or the real WhatsApp Cloud API. */
  path: "sandbox" | "whatsapp";
}

/**
 * The single place the UI decides how a message's status reads. Real and sandbox statuses never share a label:
 * a message flagged simulated is shown as Simulated even if its state says sent/delivered/read.
 */
export function statusView(m: { state: MessageState; simulated?: boolean }): StatusView {
  const simulated = m.simulated === true || m.state === "simulated";
  const state: MessageState = simulated && (REAL_PROGRESS.has(m.state) || m.state === "simulated") ? "simulated" : m.state;
  return { state, label: STATE_LABEL[state], help: STATE_HELP[state], simulated, path: simulated ? "sandbox" : "whatsapp" };
}

export interface TimelineRow {
  label: string;
  at: string;
}

/** The recorded stages for the message details. Sandbox messages only ever show when the sandbox handled them. */
export function timelineRows(m: { simulated?: boolean; timeline?: { acceptedAt: string | null; sentAt: string | null; deliveredAt: string | null; readAt: string | null; failedAt: string | null } }): TimelineRow[] {
  const t = m.timeline;
  if (!t) return [];
  const rows: Array<[string, string | null]> =
    m.simulated === true
      ? [["Simulated by the sandbox", t.acceptedAt], ["Failed", t.failedAt]]
      : [["Accepted by the WhatsApp API", t.acceptedAt], ["Sent (confirmed by WhatsApp)", t.sentAt], ["Delivered", t.deliveredAt], ["Read", t.readAt], ["Failed", t.failedAt]];
  return rows.filter((r): r is [string, string] => r[1] !== null).map(([label, at]) => ({ label, at }));
}

/** "Replies allowed for 3h 12m" / "closes in 25 min" / closed. */
export function windowLabel(windowOpen: boolean, expiresAt: string | null, now = new Date()): { open: boolean; text: string } {
  if (!windowOpen || !expiresAt) return { open: false, text: "24-hour window closed" };
  const ms = new Date(expiresAt).getTime() - now.getTime();
  if (ms <= 0) return { open: false, text: "24-hour window closed" };
  const mins = Math.max(1, Math.floor(ms / 60_000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return { open: true, text: h > 0 ? `Reply window open for ${h}h ${m}m` : `Reply window closes in ${m} min` };
}

export const displayName = (c: { contactName: string | null; contactWaId: string }): string => c.contactName || `+${c.contactWaId}`;

export const initials = (name: string): string => {
  const parts = name.replace(/^\+/, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[1][0]).toUpperCase();
};

export const unreadBadge = (n: number): string => (n > 99 ? "99+" : String(n));

// ─── attachments ─────────────────────────────────────────────────────────────
/** Mirrors the server's WhatsApp media rules (the server re-checks everything, including file contents). */
export const ATTACHMENT_RULES = {
  image: { mimes: ["image/jpeg", "image/png"], maxBytes: 5 * 1024 * 1024 },
  video: { mimes: ["video/mp4", "video/3gpp"], maxBytes: 16 * 1024 * 1024 },
  audio: { mimes: ["audio/aac", "audio/mp4", "audio/mpeg", "audio/amr", "audio/ogg"], maxBytes: 16 * 1024 * 1024 },
  document: {
    mimes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ],
    maxBytes: 25 * 1024 * 1024,
  },
} as const;
export type AttachmentKind = keyof typeof ATTACHMENT_RULES;

/** The accept attribute for the file picker. */
export const ATTACHMENT_ACCEPT = Object.values(ATTACHMENT_RULES).flatMap((r) => r.mimes).join(",");

export const kindForMime = (mime: string): AttachmentKind | null => {
  const m = mime.toLowerCase().split(";")[0].trim();
  return (Object.keys(ATTACHMENT_RULES) as AttachmentKind[]).find((k) => (ATTACHMENT_RULES[k].mimes as readonly string[]).includes(m)) ?? null;
};

export const formatBytes = (n: number | null | undefined): string => {
  if (n == null || !Number.isFinite(n) || n < 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
};

/** Checks a picked file before uploading. Returns the kind or a plain-language reason. */
export function checkAttachment(file: { type: string; size: number; name: string }): { ok: true; kind: AttachmentKind } | { ok: false; reason: string } {
  const kind = kindForMime(file.type);
  if (!kind) return { ok: false, reason: `${file.name || "This file"} is not a type WhatsApp accepts. Use JPEG or PNG images, MP4 video, AAC/MP3/OGG/AMR audio, or PDF, Office and text documents.` };
  if (file.size === 0) return { ok: false, reason: `${file.name} is empty.` };
  const max = ATTACHMENT_RULES[kind].maxBytes;
  if (file.size > max) return { ok: false, reason: `${file.name} is ${formatBytes(file.size)}. ${kind[0].toUpperCase()}${kind.slice(1)} files can be at most ${formatBytes(max)}.` };
  return { ok: true, kind };
}

export const mediaLabel = (kind: string, voice = false): string => (voice ? "Voice message" : kind === "image" ? "Photo" : kind === "video" ? "Video" : kind === "audio" ? "Audio" : kind === "document" ? "Document" : kind === "sticker" ? "Sticker" : kind === "template" ? "Template" : "Message");

/** Preview text for the conversation list. */
export const previewText = (c: { lastPreview: string | null; lastKind: string; lastMessageType: string | null }): string => c.lastPreview ?? `[${mediaLabel(c.lastKind)}]`;

// ─── templates ───────────────────────────────────────────────────────────────
export const fillTemplate = (body: string, params: string[]): string => body.replace(/\{\{\s*(\d+)\s*\}\}/g, (_m, n: string) => (params[Number(n) - 1]?.trim() ? params[Number(n) - 1] : `{{${n}}}`));
export const templateReady = (variableCount: number, params: string[]): boolean => params.length === variableCount && params.every((p) => p.trim().length > 0);

// ─── contacts import ─────────────────────────────────────────────────────────
/** Minimal CSV parser (quotes, commas, newlines in quotes). Header row required; columns: name, phone, email, company, tags, notes. */
export function parseContactsCsv(text: string): { rows: Array<Record<string, string>>; problem?: string } {
  const src = text.replace(/^\uFEFF/, "");
  const table: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") (row.push(cell), (cell = ""));
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x.trim() !== "")) table.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) table.push(row);
  if (table.length < 2) return { rows: [], problem: "The file needs a header row and at least one contact." };
  const ALIASES: Record<string, string> = { name: "name", fullname: "name", "full name": "name", phone: "phone", mobile: "phone", number: "phone", "phone number": "phone", whatsapp: "phone", email: "email", "email id": "email", company: "company", organisation: "company", organization: "company", tags: "tags", tag: "tags", notes: "notes", note: "notes" };
  const header = table[0].map((h) => ALIASES[h.trim().toLowerCase()] ?? "");
  if (!header.includes("name") || !header.includes("phone")) return { rows: [], problem: "The header row must include name and phone columns." };
  const rows = table.slice(1).map((r) => {
    const o: Record<string, string> = {};
    header.forEach((key, i) => {
      if (key && r[i] !== undefined) o[key] = r[i].trim();
    });
    return o;
  });
  return { rows };
}

/** Short relative time for the list: "now", "12m", "3h", "Tue", "19 Nov". */
export function shortTime(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const diff = now.getTime() - d.getTime();
  if (Number.isNaN(diff)) return "";
  if (diff < 60_000) return "now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 24 * 3600_000) return `${Math.floor(diff / 3600_000)}h`;
  if (diff < 7 * 24 * 3600_000) return d.toLocaleDateString("en-IN", { weekday: "short" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Day separators in the thread ("Today", "Yesterday", "19 Nov 2026"). */
export function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Search-as-you-type without a request per keystroke. */
export function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number): ((...a: A) => void) & { cancel(): void } {
  let t: ReturnType<typeof setTimeout> | undefined;
  const wrapped = (...a: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
  wrapped.cancel = () => t && clearTimeout(t);
  return wrapped;
}

/** Composer rule: what blocks sending, in priority order (null = can send). */
export function composerBlock(input: { outboundReady: boolean | undefined; windowOpen: boolean | undefined }): "not-configured" | "window-closed" | null {
  if (input.outboundReady === false) return "not-configured";
  if (input.windowOpen === false) return "window-closed";
  return null;
}
