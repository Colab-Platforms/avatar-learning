import { Router, type NextFunction, type Request, type RequestHandler, type Response } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { createLimiter } from "@/middlewares/rateLimiter.js";
import { createBusinessAdminController } from "./business-admin.controller.js";
import { requireAccess, requireBusinessAdmin, requireModule, type BusinessAccount, type BusinessRequest } from "./business-admin.access.js";
import { ACTIONS, MODULE_KEYS } from "./business-admin.modules.js";
import { createAdminsController } from "./admins.controller.js";
import type { AdminsService } from "./admins.service.js";
import { createExtrasController, type ExtrasDeps } from "./whatsapp-extras.controller.js";
import { createAnalyticsController } from "./analytics.controller.js";
import type { ClarityService } from "./clarity.service.js";
import type { BusinessAdminStore, IntegrationStatus } from "./business-admin.types.js";
import { createAutomationController, type AutomationControllerDeps } from "./automation.controller.js";
import type { InboxService } from "./inbox.service.js";
import type { InboxStore } from "./inbox.types.js";

export interface BusinessAdminRouterDeps {
  store: BusinessAdminStore;
  inbox: InboxStore;
  service: InboxService;
  getIntegrations: () => IntegrationStatus;
  /** Account state (active, permissions) looked up on every request. Preferred. */
  findAccount?: (userId: string) => Promise<BusinessAccount | null>;
  /** Email only; older callers (the dev test login). */
  findEmail?: (userId: string) => Promise<string | null>;
  /** Website analytics (Microsoft Clarity). When absent those routes do not exist. */
  clarity?: ClarityService;
  /** Media, templates, contacts, search, groups status. When absent those routes do not exist. */
  extras?: ExtrasDeps;
  /** Template Manager + automation rules/history. When absent those routes do not exist. */
  automation?: AutomationControllerDeps;
  /** Admin Management (Super Admin only). When absent the /admins routes do not exist. */
  admins?: AdminsService;
  /** Defaults to auth("ADMIN") (an ADMIN or SUPERADMIN token). Injectable for tests. */
  authMiddleware?: RequestHandler;
  /** Defaults to requireBusinessAdmin(...). Injectable for tests. */
  accessMiddleware?: RequestHandler;
  /** Defaults to 60 sends per minute per client IP. Injectable for tests. */
  sendLimiter?: RequestHandler;
  /** Defaults to 30 admin changes per minute per client IP. Injectable for tests. */
  adminWriteLimiter?: RequestHandler;
}

/**
 * Mounted at /api/business-admin. Deliberately NOT under /api/admin: the Learning Admin routers apply their own
 * auth there, and Business Admin has its own, stricter access rule (see business-admin.access.ts).
 * Every route sits behind login + Business Admin access, and each group also needs its own module permission.
 */
export function createBusinessAdminRouter(deps: BusinessAdminRouterDeps): Router {
  const c = createBusinessAdminController(deps);
  const router = Router();
  // ADMIN and SUPERADMIN (as before) plus BUSINESS_ADMIN staff. Learning Admin routes never list BUSINESS_ADMIN.
  router.use(deps.authMiddleware ?? auth("ADMIN", "BUSINESS_ADMIN"));

  if (deps.accessMiddleware) {
    // An injected access check (tests / dev sandbox) may not compute modules; treat that as every delegable module
    // (never Admin Management). The default path below always computes them and fails closed.
    const injected = deps.accessMiddleware;
    router.use((req: Request, res: Response, next: NextFunction) =>
      injected(req, res, (err?: unknown) => {
        const r = req as BusinessRequest;
        if (!err && !r.businessModules) {
          r.businessModules = [...MODULE_KEYS];
          r.businessPermissions = Object.fromEntries(MODULE_KEYS.map((m) => [m, [...ACTIONS]]));
          r.businessAccess ??= "allowlist";
        }
        next(err as never);
      }),
    );
  } else {
    router.use(requireBusinessAdmin({ findAccount: deps.findAccount, findEmail: deps.findEmail }));
  }

  const sendLimiter = deps.sendLimiter ?? createLimiter({ windowMs: 60_000, max: 60, message: "You are sending too fast. Wait a moment and try again." });
  const inbox = requireModule("inbox");

  router.get("/me", c.me);
  // The overview feeds the dashboard, integrations and analytics pages and the inbox composer's "ready" state.
  router.get("/overview", requireModule("dashboard", "integrations", "analytics", "inbox"), c.overview);

  router.get("/whatsapp/team", inbox, c.team);
  router.get("/whatsapp/conversations", inbox, c.conversations);
  router.get("/whatsapp/conversations/:waId", inbox, c.contact);
  router.get("/whatsapp/conversations/:waId/messages", inbox, c.messages);
  router.post("/whatsapp/conversations/:waId/messages", inbox, sendLimiter, c.send);
  router.post("/whatsapp/messages/:messageId/retry", inbox, sendLimiter, c.retry);
  // Marking read is part of viewing, whatever the HTTP method says.
  router.post("/whatsapp/conversations/:waId/read", requireAccess("view", "inbox"), c.markRead);
  router.put("/whatsapp/conversations/:waId/assignment", requireAccess("manage", "inbox"), c.assign);
  router.get("/whatsapp/conversations/:waId/events", inbox, c.events);
  router.post("/whatsapp/conversations/:waId/notes", inbox, c.addNote);

  if (deps.extras) {
    const x = createExtrasController(deps.extras);
    router.get("/whatsapp/search", inbox, x.search);
    router.get("/whatsapp/groups/status", inbox, x.groupsStatus);
    router.get("/whatsapp/templates", inbox, x.listTemplates);
    router.post("/whatsapp/conversations/:waId/templates", inbox, sendLimiter, x.sendTemplate);
    router.post("/whatsapp/conversations/:waId/media", inbox, sendLimiter, x.upload, x.sendMedia);
    router.get("/whatsapp/messages/:messageId/media", inbox, x.downloadMedia);
    router.get("/whatsapp/conversations/:waId/profile", inbox, x.conversationProfile);
    router.get("/whatsapp/tags", inbox, x.tags);
    router.get("/whatsapp/contacts", inbox, x.listContacts);
    router.post("/whatsapp/contacts", inbox, x.createContact);
    router.post("/whatsapp/contacts/import", inbox, x.importContacts);
    router.get("/whatsapp/contacts/:id", inbox, x.getContact);
    router.patch("/whatsapp/contacts/:id", inbox, x.updateContact);
    router.delete("/whatsapp/contacts/:id", inbox, x.deleteContact);
    router.put("/whatsapp/contacts/:id/opt-in", requireAccess("manage", "inbox"), x.setOptIn);
  }

  if (deps.clarity) {
    const a = createAnalyticsController(deps.clarity);
    const analytics = requireModule("analytics");
    router.get("/analytics/status", analytics, a.status);
    router.get("/analytics/overview", analytics, a.overview);
    router.get("/analytics/breakdown", analytics, a.breakdown);
    router.get("/analytics/history", analytics, a.history);
  }

  if (deps.automation) {
    const a = createAutomationController(deps.automation);
    const auto = requireModule("automations");
    // The Template Manager lives in the WhatsApp Inbox (Templates tab), so inbox users may use it too.
    const tpl = requireModule("automations", "inbox");
    const writeLimiter = deps.adminWriteLimiter ?? createLimiter({ windowMs: 60_000, max: 30, message: "Too many changes. Wait a moment and try again." });
    router.get("/automations/meta", auto, a.meta);
    router.get("/automations/templates", auto, a.approvedTemplates);
    router.post("/automations/suggested-templates", auto, writeLimiter, a.seedTemplates);
    // Only exists when the dev sandbox supplies a simulator.
    if (deps.automation.simulate) router.post("/automations/simulate", auto, writeLimiter, a.simulate);
    router.get("/automations/rules", auto, a.listRules);
    router.post("/automations/rules", auto, writeLimiter, a.createRule);
    router.put("/automations/rules/:id", auto, writeLimiter, a.updateRule);
    router.put("/automations/rules/:id/active", auto, writeLimiter, a.setRuleActive);
    router.delete("/automations/rules/:id", auto, writeLimiter, a.deleteRule);
    router.get("/automations/executions", auto, a.executions);
    router.post("/automations/executions/:id/retry", auto, writeLimiter, a.retryExecution);
    // Template Manager (static routes before /:id)
    router.get("/template-manager/templates", tpl, a.listTemplates);
    router.post("/template-manager/templates", tpl, writeLimiter, a.createTemplate);
    router.post("/template-manager/sync", tpl, writeLimiter, a.syncTemplates);
    router.post("/template-manager/example", tpl, writeLimiter, a.upload, a.uploadTemplateExample);
    router.get("/template-manager/templates/:id", tpl, a.getTemplate);
    router.put("/template-manager/templates/:id", tpl, writeLimiter, a.updateTemplate);
    router.post("/template-manager/templates/:id/submit", requireAccess("manage", "automations", "inbox"), writeLimiter, a.submitTemplate);
    router.delete("/template-manager/templates/:id", tpl, writeLimiter, a.deleteTemplate);
  }

  if (deps.admins) {
    // Admin Management: the "admins" module is only ever held by a SUPERADMIN, so ordinary admins get 403 here.
    const a = createAdminsController(deps.admins);
    const adminsOnly = requireModule("admins");
    const writeLimiter = deps.adminWriteLimiter ?? createLimiter({ windowMs: 60_000, max: 30, message: "Too many changes. Wait a moment and try again." });
    router.get("/admins/meta", adminsOnly, a.meta);
    router.get("/admins", adminsOnly, a.list);
    router.get("/admins/audit-log", adminsOnly, a.auditLog);
    router.post("/admins", adminsOnly, writeLimiter, a.create);
    router.patch("/admins/:id", adminsOnly, writeLimiter, a.update);
    router.post("/admins/:id/reset-password", adminsOnly, writeLimiter, a.resetPassword);
  }
  return router;
}
