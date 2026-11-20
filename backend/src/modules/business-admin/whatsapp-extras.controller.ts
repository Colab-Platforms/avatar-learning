import { Readable } from "node:stream";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import multer from "multer";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { logger } from "@/utils/logger.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { MAX_UPLOAD_BYTES, mediaOf, safeFilename } from "@/modules/whatsapp/whatsapp.media.js";
import { InboxError } from "./inbox.errors.js";
import { MAX_TEXT_LENGTH, type InboxService } from "./inbox.service.js";
import type { InboxStore } from "./inbox.types.js";
import { ContactError, MAX_IMPORT_ROWS, OPT_IN_EVIDENCE_TYPES, type ContactsService, type OptInStatus } from "./contacts.service.js";
import type { TemplatesService } from "./templates.service.js";

const ID = /^[A-Za-z0-9_-]{8,64}$/;
const WA_ID = /^\d{5,20}$/;

/** Reads the raw JSON body (the global sanitizer would HTML-escape text; see the main controller for why). */
function readBody(req: Request): Record<string, unknown> {
  const raw = (req as Request & { rawBody?: string }).rawBody;
  if (typeof raw === "string" && raw.length > 0) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      /* fall through */
    }
  }
  return req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};
}

/** What the media proxy needs from WhatsApp. Injected so tests never touch the network. */
export interface MediaFetcher {
  fetch(mediaId: string): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string; contentLength: number | null; fileSize: number | null }>;
  /** False when WhatsApp credentials are missing (then downloads answer 503 instead of failing mysteriously). */
  available(): boolean;
}

export interface ExtrasDeps {
  inbox: InboxStore;
  service: InboxService;
  contacts: ContactsService;
  templates: TemplatesService;
  media: MediaFetcher;
}

const INLINE_TYPES = /^(image\/(jpeg|png|webp|gif)|audio\/[a-z0-9.+-]+|video\/(mp4|3gpp|webm)|application\/pdf)$/i;
const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;

export function createExtrasController({ inbox, service, contacts, templates, media }: ExtrasDeps) {
  const bad = (res: Response, message: string, field?: string) => sendResponse(res, false, field ? { field } : null, message, STATUS_CODES.BAD_REQUEST);
  const userId = (req: Request) => (req as AuthRequest).user?.id as string;
  const fail = (res: Response, what: string, err: unknown) => {
    if (err instanceof InboxError) return void sendResponse(res, false, { code: err.code }, err.message, err.statusCode);
    if (err instanceof ContactError) return void sendResponse(res, false, { code: err.code, field: err.field }, err.message, err.statusCode);
    const kind = err instanceof Error ? `${err.name}${(err as { code?: string }).code ? ` (${(err as { code?: string }).code})` : ""}` : "unknown error";
    logger.error(`[BusinessAdmin] ${what} failed: ${kind}`);
    sendResponse(res, false, null, "Something went wrong. Please try again.", STATUS_CODES.SERVER_ERROR);
  };
  const run = (what: string, fn: (req: Request, res: Response) => Promise<void>): RequestHandler => async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      fail(res, what, err);
    }
  };
  const waIdOf = (req: Request, res: Response): string | null => {
    const waId = String(req.params.waId ?? "");
    if (!WA_ID.test(waId)) return void bad(res, "Invalid conversation id."), null;
    return waId;
  };

  // multipart upload: memory storage, hard size cap, exactly one file
  const uploader = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 8, fieldSize: 8 * 1024 } }).single("file");
  const upload: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    uploader(req, res, (err: unknown) => {
      if (!err) return next();
      const code = (err as { code?: string }).code;
      if (code === "LIMIT_FILE_SIZE") return void sendResponse(res, false, { code: "MEDIA_INVALID" }, `Files can be at most ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`, STATUS_CODES.BAD_REQUEST);
      return void sendResponse(res, false, { code: "MEDIA_INVALID" }, "The upload could not be read. Send one file in the 'file' field.", STATUS_CODES.BAD_REQUEST);
    });
  };

  const optIn = (v: unknown): v is OptInStatus => v === "UNKNOWN" || v === "GRANTED" || v === "WITHDRAWN";

  return {
    upload,

    // ─── media ──────────────────────────────────────────────────────────────
    sendMedia: run("sendMedia", async (req, res) => {
      const waId = waIdOf(req, res);
      if (!waId) return;
      const file = (req as Request & { file?: { buffer: Buffer; mimetype: string; originalname: string } }).file;
      if (!file) return void bad(res, "Choose a file to send.", "file");
      const body = (req.body ?? {}) as Record<string, unknown>;
      const clientRequestId = typeof body.clientRequestId === "string" ? body.clientRequestId : "";
      if (!ID.test(clientRequestId)) return void bad(res, "clientRequestId is required (8-64 letters, numbers, - or _).", "clientRequestId");
      const replyToMessageId = typeof body.replyToMessageId === "string" && body.replyToMessageId ? body.replyToMessageId : undefined;
      if (replyToMessageId && !ID.test(replyToMessageId)) return void bad(res, "Invalid reply target.");
      const caption = typeof body.caption === "string" ? body.caption.replace(/\r\n/g, "\n") : undefined;
      const result = await service.sendMedia({
        contactWaId: waId,
        clientRequestId,
        userId: userId(req),
        replyToMessageId,
        caption,
        file: { data: new Uint8Array(file.buffer), mimeType: file.mimetype, filename: safeFilename(file.originalname) },
      });
      sendResponse(res, true, result, result.created ? "Message recorded." : "Message already recorded.", result.created ? STATUS_CODES.CREATED : STATUS_CODES.OK);
    }),

    /** Streams a message's media from WhatsApp through the server (the access token never reaches the browser). */
    downloadMedia: run("downloadMedia", async (req, res) => {
      const id = String(req.params.messageId ?? "");
      if (!ID.test(id)) return void bad(res, "Invalid message id.");
      const msg = await inbox.getMessage(id);
      const m = msg ? mediaOf(msg.messageType, msg.payload) : null;
      if (!msg || !m) return void sendResponse(res, false, { code: "NOT_FOUND" }, "No file for this message.", STATUS_CODES.NOT_FOUND);
      if (!m.id) return void sendResponse(res, false, { code: "NOT_FOUND" }, "This file was never uploaded.", STATUS_CODES.NOT_FOUND);
      if (!media.available()) return void sendResponse(res, false, { code: "NOT_CONFIGURED" }, "WhatsApp is not configured on this server, so files cannot be downloaded.", STATUS_CODES.SERVICE_UNAVAILABLE);
      let got;
      try {
        got = await media.fetch(m.id);
      } catch {
        // Expired media ids (WhatsApp keeps media ~30 days) and network errors look the same to the user.
        return void sendResponse(res, false, { code: "MEDIA_UNAVAILABLE" }, "WhatsApp no longer has this file or could not be reached. Media is only kept for about 30 days.", STATUS_CODES.NOT_FOUND);
      }
      if ((got.fileSize ?? got.contentLength ?? 0) > MAX_DOWNLOAD_BYTES) return void sendResponse(res, false, { code: "MEDIA_UNAVAILABLE" }, "This file is too large to download here.", 413);
      const type = (m.mimeType ?? got.contentType).split(";")[0].trim().toLowerCase();
      const inline = INLINE_TYPES.test(type);
      const filename = safeFilename(m.filename ?? `${m.kind}-${id}`);
      res.status(200);
      res.setHeader("Content-Type", inline ? type : "application/octet-stream");
      if (got.contentLength) res.setHeader("Content-Length", String(got.contentLength));
      res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
      res.setHeader("Cache-Control", "private, max-age=600");
      const readable = Readable.fromWeb(got.stream as never);
      readable.on("error", () => res.destroy());
      readable.pipe(res);
    }),

    // ─── templates ──────────────────────────────────────────────────────────
    listTemplates: run("listTemplates", async (req, res) => {
      try {
        const items = await templates.list(req.query.refresh === "1");
        sendResponse(res, true, { items, source: "WhatsApp Business Account (live, cached up to 5 minutes)" }, "OK");
      } catch {
        sendResponse(res, false, { code: "TEMPLATES_UNAVAILABLE" }, "Could not load your templates from WhatsApp. Check that WHATSAPP_BUSINESS_ACCOUNT_ID and the access token are set.", STATUS_CODES.SERVICE_UNAVAILABLE);
      }
    }),

    sendTemplate: run("sendTemplate", async (req, res) => {
      const waId = waIdOf(req, res);
      if (!waId) return;
      const body = readBody(req);
      const clientRequestId = typeof body.clientRequestId === "string" ? body.clientRequestId : "";
      if (!ID.test(clientRequestId)) return void bad(res, "clientRequestId is required (8-64 letters, numbers, - or _).", "clientRequestId");
      if (typeof body.name !== "string" || !/^[a-z0-9_]{1,512}$/.test(body.name)) return void bad(res, "Choose a template.", "name");
      if (typeof body.language !== "string" || !/^[A-Za-z_]{2,10}$/.test(body.language)) return void bad(res, "Choose the template language.", "language");
      const result = await service.sendTemplate({ contactWaId: waId, clientRequestId, userId: userId(req), name: body.name, language: body.language, params: body.params });
      sendResponse(res, true, result, result.created ? "Message recorded." : "Message already recorded.", result.created ? STATUS_CODES.CREATED : STATUS_CODES.OK);
    }),

    // ─── search ─────────────────────────────────────────────────────────────
    search: run("search", async (req, res) => {
      const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
      if (q.length < 2) return void sendResponse(res, true, { items: [], q }, "Type at least 2 characters.");
      const waId = typeof req.query.waId === "string" && req.query.waId ? req.query.waId : undefined;
      if (waId && !WA_ID.test(waId)) return void bad(res, "Invalid conversation id.");
      const limitRaw = typeof req.query.limit === "string" ? req.query.limit : "30";
      const limit = /^\d{1,3}$/.test(limitRaw) ? Math.min(Math.max(Number(limitRaw), 1), 50) : 30;
      sendResponse(res, true, { items: await inbox.searchMessages(q, { contactWaId: waId, limit }), q }, "OK");
    }),

    // ─── contacts ───────────────────────────────────────────────────────────
    listContacts: run("listContacts", async (req, res) => {
      const pageRaw = typeof req.query.page === "string" ? req.query.page : "1";
      const sizeRaw = typeof req.query.pageSize === "string" ? req.query.pageSize : "25";
      if (!/^\d{1,5}$/.test(pageRaw) || !/^\d{1,3}$/.test(sizeRaw) || Number(pageRaw) < 1 || Number(sizeRaw) < 1 || Number(sizeRaw) > 100) return void bad(res, "Invalid paging.");
      const optInQ = typeof req.query.optIn === "string" && req.query.optIn ? req.query.optIn : undefined;
      if (optInQ && !optIn(optInQ)) return void bad(res, "Invalid consent filter.");
      const list = await contacts.list({
        q: typeof req.query.q === "string" ? req.query.q.slice(0, 100) : undefined,
        tag: typeof req.query.tag === "string" && req.query.tag ? req.query.tag.slice(0, 30) : undefined,
        optIn: optInQ as OptInStatus | undefined,
        page: Number(pageRaw),
        pageSize: Number(sizeRaw),
      });
      sendResponse(res, true, { ...list, page: Number(pageRaw), pageSize: Number(sizeRaw) }, "OK");
    }),

    createContact: run("createContact", async (req, res) => {
      sendResponse(res, true, await contacts.create(readBody(req), userId(req)), "Contact saved.", STATUS_CODES.CREATED);
    }),

    getContact: run("getContact", async (req, res) => {
      const id = String(req.params.id ?? "");
      if (!ID.test(id)) return void bad(res, "Invalid contact id.");
      sendResponse(res, true, await contacts.get(id), "OK");
    }),

    updateContact: run("updateContact", async (req, res) => {
      const id = String(req.params.id ?? "");
      if (!ID.test(id)) return void bad(res, "Invalid contact id.");
      sendResponse(res, true, await contacts.update(id, readBody(req), userId(req)), "Contact updated.");
    }),

    deleteContact: run("deleteContact", async (req, res) => {
      const id = String(req.params.id ?? "");
      if (!ID.test(id)) return void bad(res, "Invalid contact id.");
      await contacts.remove(id);
      sendResponse(res, true, { deleted: true }, "Contact deleted. Their messages are kept.");
    }),

    importContacts: run("importContacts", async (req, res) => {
      const rows = readBody(req).rows;
      if (!Array.isArray(rows) || rows.length === 0) return void bad(res, "Send a list of rows to import.", "rows");
      if (rows.length > MAX_IMPORT_ROWS) return void bad(res, `Import at most ${MAX_IMPORT_ROWS} rows at a time.`, "rows");
      sendResponse(res, true, await contacts.importRows(rows as Array<Record<string, unknown>>, userId(req)), "Import finished.");
    }),

    setOptIn: run("setOptIn", async (req, res) => {
      const id = String(req.params.id ?? "");
      if (!ID.test(id)) return void bad(res, "Invalid contact id.");
      const body = readBody(req);
      if (!optIn(body.status)) return void bad(res, "status must be UNKNOWN, GRANTED or WITHDRAWN.", "status");
      sendResponse(res, true, await contacts.setOptIn(id, { status: body.status, evidence: body.evidence, note: body.note }, userId(req)), "Consent recorded.");
    }),

    tags: run("tags", async (_req, res) => {
      sendResponse(res, true, { items: await contacts.tags() }, "OK");
    }),

    /** The saved contact (if any) for a conversation, so the side panel can show profile, tags and consent. */
    conversationProfile: run("conversationProfile", async (req, res) => {
      const waId = waIdOf(req, res);
      if (!waId) return;
      sendResponse(res, true, { contact: await contacts.getByWaId(waId), evidenceTypes: OPT_IN_EVIDENCE_TYPES }, "OK");
    }),

    // ─── groups ─────────────────────────────────────────────────────────────
    /** Honest capability report: this server makes no Groups API calls, so it never pretends to. */
    groupsStatus(_req: Request, res: Response) {
      sendResponse(
        res,
        true,
        {
          supported: false,
          reason:
            "Group messaging through the WhatsApp Cloud API (the Groups API) is only available to eligible business accounts, and eligibility, participant limits and supported message types are set by Meta. This server has not verified that your WhatsApp Business Account is eligible, so group features are switched off and nothing is simulated.",
          nextSteps: [
            "In Meta Business Manager, open your WhatsApp Business Account settings and check whether the Groups API is offered to your account.",
            "Read Meta's current Groups API documentation for eligibility, limits and the webhook events groups use.",
            "Once confirmed, group support can be built against the documented endpoints and verified on your test number.",
          ],
          maxMessageLength: MAX_TEXT_LENGTH,
        },
        "OK",
      );
    },
  };
}
