import type { Request, RequestHandler, Response } from "express";
import multer from "multer";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { logger } from "@/utils/logger.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { endpointFor } from "./automation.endpoints.js";
import { EVENTS, eventByKey } from "./automation.events.js";
import { AutomationError, type AutomationService } from "./automation.service.js";
import type { TemplatesService } from "./templates.service.js";
import { TemplateError, type TemplateManagerService } from "./template-manager.service.js";
import { HEADER_FORMATS, type HeaderFormat } from "./template-manager.validation.js";

const ID = /^[A-Za-z0-9_-]{8,64}$/;

/** Raw JSON body (the global sanitizer HTML-escapes text, which would corrupt template wording). */
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

export interface AutomationControllerDeps {
  automation: AutomationService;
  templates: TemplateManagerService;
  /** Live Meta list used to offer only sendable (approved) templates to rules. */
  approved: TemplatesService;
  /** DEV SANDBOX ONLY. When present, exposes POST /automations/simulate (a stand-in for a customer action). Never passed in production. */
  simulate?: (input: { event: string; phone: string; eventId?: string; fields?: Record<string, unknown> }) => Promise<unknown>;
}

export function createAutomationController({ automation, templates, approved, simulate }: AutomationControllerDeps) {
  const userId = (req: Request) => (req as AuthRequest).user?.id as string;
  const fail = (res: Response, what: string, err: unknown) => {
    if (err instanceof TemplateError) return void sendResponse(res, false, { code: err.code, errors: err.errors }, err.message, err.statusCode);
    if (err instanceof AutomationError) return void sendResponse(res, false, { code: err.code, field: err.field }, err.message, err.statusCode);
    logger.error(`[BusinessAdmin] ${what} failed: ${err instanceof Error ? err.name : "unknown error"}`);
    sendResponse(res, false, null, "Something went wrong. Please try again.", STATUS_CODES.SERVER_ERROR);
  };
  const run = (what: string, fn: (req: Request, res: Response) => Promise<void>): RequestHandler => async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      fail(res, what, err);
    }
  };
  const idOf = (req: Request, res: Response): string | null => {
    const id = String(req.params.id ?? "");
    if (!ID.test(id)) return void sendResponse(res, false, null, "Invalid id.", STATUS_CODES.BAD_REQUEST), null;
    return id;
  };
  const num = (v: unknown, d: number, max: number) => Math.min(max, Math.max(1, Number.parseInt(String(v ?? ""), 10) || d));

  const uploader = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024, files: 1, fields: 4 } }).single("file");
  const upload: RequestHandler = (req, res, next) =>
    uploader(req, res, (err: unknown) => {
      if (!err) return next();
      sendResponse(res, false, { code: "VALIDATION" }, "The sample file is too large or could not be read.", STATUS_CODES.BAD_REQUEST);
    });

  return {
    upload,

    // ── Template Manager ──
    listTemplates: run("listTemplates", async (_req, res) => {
      sendResponse(res, true, { items: await templates.list() }, "OK");
    }),
    getTemplate: run("getTemplate", async (req, res) => {
      const id = idOf(req, res);
      if (id) sendResponse(res, true, await templates.get(id), "OK");
    }),
    createTemplate: run("createTemplate", async (req, res) => {
      sendResponse(res, true, await templates.create(readBody(req), userId(req)), "Draft saved. It has not been sent to Meta.", STATUS_CODES.CREATED);
    }),
    updateTemplate: run("updateTemplate", async (req, res) => {
      const id = idOf(req, res);
      if (id) sendResponse(res, true, await templates.update(id, readBody(req)), "OK");
    }),
    submitTemplate: run("submitTemplate", async (req, res) => {
      const id = idOf(req, res);
      if (id) sendResponse(res, true, await templates.submit(id), "Submitted to Meta. Its status is whatever Meta reports.");
    }),
    deleteTemplate: run("deleteTemplate", async (req, res) => {
      const id = idOf(req, res);
      if (!id) return;
      await templates.remove(id);
      sendResponse(res, true, { deleted: true }, "OK");
    }),
    syncTemplates: run("syncTemplates", async (_req, res) => {
      sendResponse(res, true, await templates.sync(), "Synced from Meta.");
    }),
    uploadTemplateExample: run("uploadTemplateExample", async (req, res) => {
      const file = (req as Request & { file?: { buffer: Buffer; mimetype: string; originalname: string } }).file;
      const format = String(req.body?.format ?? "").toUpperCase() as HeaderFormat;
      if (!file || !(HEADER_FORMATS as readonly string[]).includes(format)) return void sendResponse(res, false, { code: "VALIDATION" }, "Send one file and the header type.", STATUS_CODES.BAD_REQUEST);
      sendResponse(res, true, await templates.uploadExample(format, { data: file.buffer, mimeType: file.mimetype, filename: file.originalname.slice(0, 120) }), "OK");
    }),

    // ── Automation rules ──
    meta: run("automationMeta", async (_req, res) => {
      sendResponse(res, true, { events: automation.events().map((e) => ({ ...e, endpoint: endpointFor(e.key) ?? null })), ...(await automation.summary()), sandbox: Boolean(simulate) }, "OK");
    }),
    /** Creates LOCAL template drafts from the suggested wording (never submitted to Meta; the admin edits and submits them). */
    seedTemplates: run("seedTemplates", async (req, res) => {
      const wanted = readBody(req).events;
      const keys = Array.isArray(wanted) ? wanted.map(String) : EVENTS.map((e) => e.key);
      const created: string[] = [];
      const skipped: string[] = [];
      for (const key of keys) {
        const s = eventByKey(key)?.suggested;
        if (!s) continue;
        const examples = Object.fromEntries(s.examples.map((v, i) => [String(i + 1), v]));
        try {
          await templates.create({ name: s.name, language: "en", category: s.category, parameterFormat: "POSITIONAL", draft: { header: null, body: { text: s.body }, footer: null, buttons: [], examples } }, userId(req));
          created.push(s.name);
        } catch (err) {
          if (err instanceof TemplateError && err.code === "CONFLICT") skipped.push(s.name);
          else throw err;
        }
      }
      sendResponse(res, true, { created, skipped }, "Drafts saved. Nothing was sent to Meta.");
    }),
    simulate: run("simulate", async (req, res) => {
      const b = readBody(req);
      const event = String(b.event ?? "");
      const phone = String(b.phone ?? "").replace(/D/g, "");
      if (!eventByKey(event)) return void sendResponse(res, false, { code: "VALIDATION", field: "event" }, "Unknown event.", STATUS_CODES.BAD_REQUEST);
      if (phone.length < 8 || phone.length > 15) return void sendResponse(res, false, { code: "VALIDATION", field: "phone" }, "Enter a phone number with country code.", STATUS_CODES.BAD_REQUEST);
      const fields = b.fields && typeof b.fields === "object" && !Array.isArray(b.fields) ? (b.fields as Record<string, unknown>) : undefined;
      sendResponse(res, true, await simulate!({ event, phone, eventId: typeof b.eventId === "string" && b.eventId ? b.eventId.slice(0, 100) : undefined, fields }), "Simulated.");
    }),
    approvedTemplates: run("approvedTemplates", async (_req, res) => {
      try {
        sendResponse(res, true, { items: (await approved.list()).filter((t) => t.sendable) }, "OK");
      } catch {
        sendResponse(res, false, { code: "TEMPLATES_UNAVAILABLE" }, "Could not load approved templates from WhatsApp.", STATUS_CODES.SERVICE_UNAVAILABLE);
      }
    }),
    listRules: run("listRules", async (_req, res) => {
      sendResponse(res, true, { items: await automation.listRules() }, "OK");
    }),
    createRule: run("createRule", async (req, res) => {
      sendResponse(res, true, await automation.createRule(readBody(req) as never, userId(req)), "Automation saved (inactive).", STATUS_CODES.CREATED);
    }),
    updateRule: run("updateRule", async (req, res) => {
      const id = idOf(req, res);
      if (id) sendResponse(res, true, await automation.updateRule(id, readBody(req) as never, userId(req)), "OK");
    }),
    setRuleActive: run("setRuleActive", async (req, res) => {
      const id = idOf(req, res);
      if (!id) return;
      const active = readBody(req).active;
      if (typeof active !== "boolean") return void sendResponse(res, false, null, "Send active: true or false.", STATUS_CODES.BAD_REQUEST);
      sendResponse(res, true, await automation.setActive(id, active, userId(req)), "OK");
    }),
    deleteRule: run("deleteRule", async (req, res) => {
      const id = idOf(req, res);
      if (!id) return;
      await automation.deleteRule(id);
      sendResponse(res, true, { deleted: true }, "OK");
    }),
    executions: run("executions", async (req, res) => {
      const ruleId = typeof req.query.ruleId === "string" && ID.test(req.query.ruleId) ? req.query.ruleId : undefined;
      const data = await automation.executions({ status: typeof req.query.status === "string" ? req.query.status : undefined, ruleId, page: num(req.query.page, 1, 10_000), pageSize: num(req.query.pageSize, 25, 100) });
      sendResponse(res, true, data, "OK");
    }),
    retryExecution: run("retryExecution", async (req, res) => {
      const id = idOf(req, res);
      if (id) sendResponse(res, true, await automation.requeue(id), "Queued again.");
    }),
  };
}
