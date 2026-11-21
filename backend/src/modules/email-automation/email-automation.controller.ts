import type { Request, RequestHandler, Response } from "express";
import prisma from "@root/prisma.js";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { logger } from "@/utils/logger.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { EmailError, type EmailAutomationService } from "./email-automation.service.js";

const ID = /^[A-Za-z0-9_-]{8,64}$/;

/** Raw JSON body: the global sanitizer HTML-escapes text, which would corrupt email HTML. */
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

export function createEmailAutomationController(svc: EmailAutomationService) {
  const adminId = (req: Request) => (req as AuthRequest).user?.id as string | undefined;
  const idOf = (req: Request): string => {
    const id = String(req.params.id ?? "");
    if (!ID.test(id)) throw new EmailError("Invalid id.", 400);
    return id;
  };

  const fail = (res: Response, e: unknown) => {
    if (e instanceof EmailError) return sendResponse(res, false, null, e.message, e.status);
    logger.error(`[EmailAutomation] request failed: ${e instanceof Error ? e.name : "unknown error"}`); // never the message: may contain addresses
    return sendResponse(res, false, null, "Something went wrong. Please try again.", STATUS_CODES.SERVER_ERROR);
  };
  const wrap =
    (fn: (req: Request) => Promise<unknown> | unknown, message = "OK"): RequestHandler =>
    async (req, res) => {
      try {
        sendResponse(res, true, await fn(req), message);
      } catch (e) {
        fail(res, e);
      }
    };

  return {
    status: wrap(() => svc.status()),
    check: wrap(() => svc.checkConnection()),
    stats: wrap(() => svc.stats()),

    listTemplates: wrap((req) => svc.listTemplates(req.query.archived === "true")),
    getTemplate: wrap((req) => svc.getTemplate(idOf(req))),
    createTemplate: wrap((req) => svc.createTemplate(readBody(req), adminId(req)), "Template created."),
    updateTemplate: wrap((req) => svc.updateTemplate(idOf(req), readBody(req)), "Template saved."),
    archiveTemplate: wrap((req) => svc.archiveTemplate(idOf(req)), "Template archived."),
    preview: wrap((req) => {
      const b = readBody(req);
      return svc.preview({ templateId: typeof b.templateId === "string" ? b.templateId : undefined, draft: b.draft as Record<string, unknown> | undefined });
    }),
    sendTest: wrap(async (req) => {
      const id = adminId(req);
      const me = id ? await prisma.user.findUnique({ where: { id }, select: { email: true } }) : null;
      return svc.sendTest(idOf(req), { id, email: me?.email ?? null });
    }, "Test email sent to your own address."),

    listAutomations: wrap(() => svc.listAutomations()),
    createAutomation: wrap((req) => svc.createAutomation(readBody(req), adminId(req)), "Automation created (switched off)."),
    updateAutomation: wrap((req) => svc.updateAutomation(idOf(req), readBody(req)), "Automation saved."),
    setAutomationActive: wrap((req) => svc.setAutomationActive(idOf(req), readBody(req).active === true), "Updated."),
    deleteAutomation: wrap((req) => svc.deleteAutomation(idOf(req)), "Automation deleted."),

    recipients: wrap((req) => svc.searchRecipients(String(req.query.q ?? "").slice(0, 100))),
    manualSend: wrap((req) => {
      const b = readBody(req);
      return svc.manualSend({ templateId: String(b.templateId ?? ""), userIds: Array.isArray(b.userIds) ? (b.userIds as string[]) : [], scheduledFor: typeof b.scheduledFor === "string" ? b.scheduledFor : null }, adminId(req));
    }),

    scheduled: wrap(() => svc.listScheduled()),
    cancelScheduled: wrap((req) => svc.cancelScheduled(idOf(req)), "Cancelled."),
    activity: wrap((req) =>
      svc.activity({
        search: typeof req.query.search === "string" ? req.query.search.slice(0, 100) : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined,
        automationId: typeof req.query.automationId === "string" && ID.test(req.query.automationId) ? req.query.automationId : undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 25,
      }),
    ),
    retry: wrap((req) => svc.retry(idOf(req)), "Queued again."),
    resolve: wrap((req) => svc.resolveUnconfirmed(idOf(req), readBody(req).outcome as "SENT" | "NOT_SENT"), "Resolved."),
  };
}
