// Media rules shared by the Business Admin inbox: what we accept for upload, how big, and what a stored message's media is.
import type { OutboundMediaKind } from "./whatsapp.client.js";

export type MediaKind = OutboundMediaKind;

/**
 * Accepted outgoing formats, per WhatsApp Cloud API documentation:
 *  image: JPEG, PNG (5 MB) · video: MP4, 3GPP (16 MB) · audio: AAC, MP4, MPEG, AMR, OGG/Opus (16 MB)
 *  document: PDF, Word, Excel, PowerPoint, plain text (Meta allows 100 MB; we cap lower to protect server memory).
 * Verify against Meta's current "Supported media types" before relying on a format not listed here.
 */
export const MEDIA_RULES: Record<MediaKind, { mimes: string[]; maxBytes: number }> = {
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
};

/** The largest upload we will ever buffer (the biggest per-kind cap). */
export const MAX_UPLOAD_BYTES = Math.max(...Object.values(MEDIA_RULES).map((r) => r.maxBytes));

export const kindForMime = (mime: string): MediaKind | null => {
  const m = mime.toLowerCase().split(";")[0].trim();
  return (Object.keys(MEDIA_RULES) as MediaKind[]).find((k) => MEDIA_RULES[k].mimes.includes(m)) ?? null;
};

export type MediaProblem = "unsupported_type" | "too_large" | "empty" | "content_mismatch";

const startsWith = (b: Uint8Array, bytes: number[], at = 0) => bytes.every((v, i) => b[at + i] === v);
const ascii = (b: Uint8Array, s: string, at = 0) => [...s].every((c, i) => b[at + i] === c.charCodeAt(0));

/** First-bytes check so a renamed file (e.g. an .exe sent as image/jpeg) is refused. Text/plain has no signature. */
export function contentMatchesMime(mime: string, b: Uint8Array): boolean {
  switch (mime) {
    case "image/jpeg":
      return startsWith(b, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "application/pdf":
      return ascii(b, "%PDF-");
    case "video/mp4":
    case "video/3gpp":
    case "audio/mp4":
      return ascii(b, "ftyp", 4);
    case "audio/ogg":
      return ascii(b, "OggS");
    case "audio/mpeg":
      return ascii(b, "ID3") || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
    case "audio/aac":
      return b[0] === 0xff && (b[1] & 0xf6) === 0xf0;
    case "audio/amr":
      return ascii(b, "#!AMR");
    case "application/msword":
    case "application/vnd.ms-excel":
    case "application/vnd.ms-powerpoint":
      return startsWith(b, [0xd0, 0xcf, 0x11, 0xe0]);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return startsWith(b, [0x50, 0x4b, 0x03, 0x04]);
    case "text/plain":
      return !b.slice(0, 2048).includes(0); // no NUL bytes in the first 2 KB
    default:
      return false;
  }
}

/** Validates an upload. Returns the media kind, or why it was refused. */
export function validateUpload(file: { mimeType: string; data: Uint8Array }): { ok: true; kind: MediaKind; mimeType: string } | { ok: false; problem: MediaProblem; message: string } {
  const mimeType = file.mimeType.toLowerCase().split(";")[0].trim();
  const kind = kindForMime(mimeType);
  if (!kind) return { ok: false, problem: "unsupported_type", message: "This file type is not supported by WhatsApp. Use JPEG/PNG images, MP4 video, AAC/MP3/OGG/AMR audio, or PDF/Office/text documents." };
  if (file.data.byteLength === 0) return { ok: false, problem: "empty", message: "The file is empty." };
  const max = MEDIA_RULES[kind].maxBytes;
  if (file.data.byteLength > max) return { ok: false, problem: "too_large", message: `${kind[0].toUpperCase()}${kind.slice(1)} files can be at most ${Math.round(max / 1024 / 1024)} MB.` };
  if (!contentMatchesMime(mimeType, file.data)) return { ok: false, problem: "content_mismatch", message: "The file contents do not match its type, so it was not sent." };
  return { ok: true, kind, mimeType };
}

/** Strips path parts and control characters so a filename is safe to store, show and put in a header. */
export function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[\u0000-\u001f\u007f"<>:|?*]/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
  return cleaned.length > 0 && cleaned !== "." && cleaned !== ".." ? cleaned : "file";
}

export interface StoredMedia {
  kind: MediaKind | "sticker";
  /** WhatsApp media id (download via the Graph API). Null when an upload has not completed. */
  id: string | null;
  mimeType: string | null;
  filename: string | null;
  sizeBytes: number | null;
  caption: string | null;
  /** audio sent as a voice note */
  voice: boolean;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

const KINDS = ["image", "video", "audio", "document", "sticker"] as const;

/** Media of a stored message: inbound = Meta's raw message object; outbound = { media: StoredMedia }. */
export function mediaOf(messageType: string | null, payload: unknown): StoredMedia | null {
  if (!isObj(payload)) return null;
  if (isObj(payload.media)) {
    const m = payload.media;
    return {
      kind: (KINDS as readonly string[]).includes(String(m.kind)) ? (m.kind as StoredMedia["kind"]) : "document",
      id: typeof m.id === "string" ? m.id : null,
      mimeType: typeof m.mimeType === "string" ? m.mimeType : null,
      filename: typeof m.filename === "string" ? m.filename : null,
      sizeBytes: typeof m.sizeBytes === "number" ? m.sizeBytes : null,
      caption: typeof m.caption === "string" ? m.caption : null,
      voice: m.voice === true,
    };
  }
  if (messageType && (KINDS as readonly string[]).includes(messageType) && isObj(payload[messageType])) {
    const m = payload[messageType] as Record<string, unknown>;
    return {
      kind: messageType as StoredMedia["kind"],
      id: typeof m.id === "string" ? m.id : null,
      mimeType: typeof m.mime_type === "string" ? m.mime_type : null,
      filename: typeof m.filename === "string" ? m.filename : null,
      sizeBytes: null,
      caption: typeof m.caption === "string" ? m.caption : null,
      voice: m.voice === true,
    };
  }
  return null;
}

/** wamid of the message this one replies to (inbound: context.id; outbound: payload.replyTo), if any. */
export function replyTargetOf(payload: unknown): string | null {
  if (!isObj(payload)) return null;
  if (typeof payload.replyTo === "string") return payload.replyTo;
  if (isObj(payload.context) && typeof payload.context.id === "string") return payload.context.id;
  return null;
}
