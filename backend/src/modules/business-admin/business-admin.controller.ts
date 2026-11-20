import type { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { logger } from "@/utils/logger.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import type { BusinessRequest } from "./business-admin.access.js";
import type { BusinessAdminStore, IntegrationStatus } from "./business-admin.types.js";
import { InboxError } from "./inbox.errors.js";
import { MAX_TEXT_LENGTH, type InboxService } from "./inbox.service.js";
import type { InboxFilter, InboxStore } from "./inbox.types.js";

const MAX_PAGE_SIZE = 50;
const MAX_MESSAGES = 100;
const MAX_NOTE_LENGTH = 2000;
const FILTERS: InboxFilter[] = ["all", "unread", "mine", "unassigned"];

const ID = /^[A-Za-z0-9_-]{8,64}$/;
const WA_ID = /^\d{5,20}$/;
// NUL (and other control characters except tab/newline/CR) break Postgres text columns and are never typed by a person.
const CONTROL = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]", "g");

const int = (v: unknown, def: number, min: number, max: number): number | null => {
  if (v === undefined || v === "") return def;
  if (typeof v !== "string" || !/^\d{1,6}$/.test(v)) return null;
  const n = Number(v);
  return n >= min && n <= max ? n : null;
};

/**
 * The global sanitize middleware HTML-escapes every body string (so "a < b & c" would become "a &lt; b &amp; c").
 * That is right for HTML forms but wrong for WhatsApp text, so message and note bodies are read from the raw JSON.
 * React escapes on display, so storing the original text is safe.
 */
function readBody(req: Request): Record<string, unknown> {
  const raw = (req as Request & { rawBody?: string }).rawBody;
  if (typeof raw === "string" && raw.length > 0) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      /* fall through to the parsed body */
    }
  }
  return req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};
}

export interface ControllerDeps {
  store: BusinessAdminStore;
  inbox: InboxStore;
  service: InboxService;
  getIntegrations: () => IntegrationStatus;
}

export function createBusinessAdminController({ store, inbox, service, getIntegrations }: ControllerDeps) {
  // Log only the error type/code: ORM errors can embed query arguments (phone numbers, message text).
  const fail = (res: Response, what: string, err: unknown) => {
    if (err instanceof InboxError) {
      sendResponse(res, false, { code: err.code }, err.message, err.statusCode);
      return;
    }
    const kind =
      err instanceof Error
        ? `${err.name}${(err as { code?: string }).code ? ` (${(err as { code?: string }).code})` : ""}`
        : "unknown error";
    logger.error(`[BusinessAdmin] ${what} failed: ${kind}`);
    sendResponse(res, false, null, "Something went wrong. Please try again.", STATUS_CODES.SERVER_ERROR);
  };
  const bad = (res: Response, message: string) => sendResponse(res, false, null, message, STATUS_CODES.BAD_REQUEST);
  const userId = (req: Request) => (req as AuthRequest).user?.id as string;
  const waIdOf = (req: Request, res: Response): string | null => {
    const waId = String(req.params.waId ?? "");
    if (!WA_ID.test(waId)) {
      bad(res, "Invalid conversation id.");
      return null;
    }
    return waId;
  };
  const run = (what: string, fn: (req: Request, res: Response) => Promise<void>) => async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (err) {
      fail(res, what, err);
    }
  };

  return {
    me(req: Request, res: Response) {
      const a = req as BusinessRequest;
      sendResponse(
        res,
        true,
        { role: a.user?.role, access: a.businessAccess ?? null, userId: a.user?.id, modules: a.businessModules ?? [], isSuperAdmin: a.businessIsSuper === true },
        "OK",
      );
    },

    overview: run("overview", async (_req, res) => {
      sendResponse(res, true, { whatsapp: await store.overview(), integrations: getIntegrations() }, "OK");
    }),

    team: run("team", async (_req, res) => {
      sendResponse(res, true, { items: await inbox.teamMembers() }, "OK");
    }),

    conversations: run("conversations", async (req, res) => {
      const page = int(req.query.page, 1, 1, 100000);
      const pageSize = int(req.query.pageSize, 25, 1, MAX_PAGE_SIZE);
      if (page === null || pageSize === null) return void bad(res, `page must be a positive integer and pageSize between 1 and ${MAX_PAGE_SIZE}.`);
      const filter = (req.query.filter === undefined || req.query.filter === "" ? "all" : req.query.filter) as InboxFilter;
      if (!FILTERS.includes(filter)) return void bad(res, `filter must be one of ${FILTERS.join(", ")}.`);
      const assignee = req.query.assignee === undefined || req.query.assignee === "" ? undefined : String(req.query.assignee);
      if (assignee !== undefined && !ID.test(assignee)) return void bad(res, "Invalid assignee.");
      const q = req.query.q === undefined ? undefined : String(req.query.q).slice(0, 100);
      const list = await inbox.listConversations({ filter, assignee, q, page, pageSize, meId: userId(req) });
      sendResponse(res, true, { ...list, page, pageSize }, "OK");
    }),

    contact: run("contact", async (req, res) => {
      const waId = waIdOf(req, res);
      if (!waId) return;
      const contact = await inbox.getContact(waId);
      if (!contact) return void sendResponse(res, false, { code: "NOT_FOUND" }, "Conversation not found.", STATUS_CODES.NOT_FOUND);
      sendResponse(res, true, contact, "OK");
    }),

    messages: run("messages", async (req, res) => {
      const waId = waIdOf(req, res);
      if (!waId) return;
      const limit = int(req.query.limit, 50, 1, MAX_MESSAGES);
      if (limit === null) return void bad(res, `limit must be between 1 and ${MAX_MESSAGES}.`);
      const until = req.query.until === undefined || req.query.until === "" ? undefined : String(req.query.until);
      if (until !== undefined && !ID.test(until)) return void bad(res, "Invalid message id.");
      const before = req.query.before === undefined || req.query.before === "" ? undefined : String(req.query.before);
      if (before !== undefined && !/^\d{10,15}_[A-Za-z0-9_-]{5,64}$/.test(before)) return void bad(res, "Invalid cursor.");
      const page = await inbox.listMessages(waId, { limit, before, until });
      sendResponse(res, true, { contactWaId: waId, ...page }, "OK");
    }),

    send: run("send", async (req, res) => {
      const waId = waIdOf(req, res);
      if (!waId) return;
      const body = readBody(req);
      const text = typeof body.text === "string" ? body.text.replace(CONTROL, "").replace(/\r\n/g, "\n").trim() : "";
      if (!text) return void bad(res, "Write a message before sending.");
      if (text.length > MAX_TEXT_LENGTH) return void bad(res, `Messages can be at most ${MAX_TEXT_LENGTH} characters.`);
      const clientRequestId = typeof body.clientRequestId === "string" ? body.clientRequestId : "";
      if (!ID.test(clientRequestId)) return void bad(res, "clientRequestId is required (8-64 letters, numbers, - or _).");
      const replyToMessageId = typeof body.replyToMessageId === "string" && body.replyToMessageId ? body.replyToMessageId : undefined;
      if (replyToMessageId && !ID.test(replyToMessageId)) return void bad(res, "Invalid reply target.");
      const result = await service.send({ contactWaId: waId, text, clientRequestId, userId: userId(req), replyToMessageId });
      sendResponse(res, true, result, result.created ? "Message recorded." : "Message already recorded.", result.created ? STATUS_CODES.CREATED : STATUS_CODES.OK);
    }),

    retry: run("retry", async (req, res) => {
      const messageId = String(req.params.messageId ?? "");
      if (!ID.test(messageId)) return void bad(res, "Invalid message id.");
      const result = await service.retry({ messageId, userId: userId(req) });
      sendResponse(res, true, result, result.created ? "Retry recorded." : "Retry already recorded.", result.created ? STATUS_CODES.CREATED : STATUS_CODES.OK);
    }),

    markRead: run("markRead", async (req, res) => {
      const waId = waIdOf(req, res);
      if (!waId) return;
      const body = readBody(req);
      let upTo: Date | undefined;
      if (body.upTo !== undefined) {
        const d = typeof body.upTo === "string" ? new Date(body.upTo) : null;
        if (!d || Number.isNaN(d.getTime())) return void bad(res, "upTo must be an ISO date.");
        upTo = d;
      }
      if (!(await inbox.getContact(waId))) return void sendResponse(res, false, { code: "NOT_FOUND" }, "Conversation not found.", STATUS_CODES.NOT_FOUND);
      sendResponse(res, true, await inbox.markRead(waId, userId(req), upTo), "OK");
    }),

    assign: run("assign", async (req, res) => {
      const waId = waIdOf(req, res);
      if (!waId) return;
      const body = readBody(req);
      if (!("assigneeId" in body)) return void bad(res, "assigneeId is required (a team member id, or null to unassign).");
      const assigneeId = body.assigneeId === null ? null : typeof body.assigneeId === "string" ? body.assigneeId : undefined;
      if (assigneeId === undefined || (assigneeId !== null && !ID.test(assigneeId))) return void bad(res, "Invalid assigneeId.");
      if (!(await inbox.getContact(waId))) return void sendResponse(res, false, { code: "NOT_FOUND" }, "Conversation not found.", STATUS_CODES.NOT_FOUND);
      if (assigneeId !== null) {
        // Only people who can actually open Business Admin may be assigned conversations.
        const team = await inbox.teamMembers();
        if (!team.some((m) => m.id === assigneeId)) {
          return void sendResponse(res, false, { code: "INVALID_ASSIGNEE" }, "That person does not have Business Admin access.", STATUS_CODES.UNPROCESSIBLE_ENTITY);
        }
      }
      const { changed } = await inbox.assign(waId, assigneeId, userId(req));
      sendResponse(res, true, { changed, contact: await inbox.getContact(waId) }, "OK");
    }),

    events: run("events", async (req, res) => {
      const waId = waIdOf(req, res);
      if (!waId) return;
      sendResponse(res, true, { items: await inbox.listEvents(waId) }, "OK");
    }),

    addNote: run("addNote", async (req, res) => {
      const waId = waIdOf(req, res);
      if (!waId) return;
      const raw = readBody(req).body;
      const body = typeof raw === "string" ? raw.replace(CONTROL, "").trim() : "";
      if (!body) return void bad(res, "Write a note before saving.");
      if (body.length > MAX_NOTE_LENGTH) return void bad(res, `Notes can be at most ${MAX_NOTE_LENGTH} characters.`);
      if (!(await inbox.getContact(waId))) return void sendResponse(res, false, { code: "NOT_FOUND" }, "Conversation not found.", STATUS_CODES.NOT_FOUND);
      sendResponse(res, true, await inbox.addNote(waId, userId(req), body), "Note saved.", STATUS_CODES.CREATED);
    }),
  };
}
