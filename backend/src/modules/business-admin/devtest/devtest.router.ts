import { Router, type NextFunction, type Request, type RequestHandler, type Response } from "express";
import { createLimiter } from "@/middlewares/rateLimiter.js";
import { createBusinessAdminRouter } from "../business-admin.router.js";
import { PrismaBusinessAdminStore, type BusinessDb } from "../business-admin.store.js";
import { PrismaInboxStore } from "../inbox.store.js";
import { InboxService } from "../inbox.service.js";
import { SIMULATED_WAMID_PREFIX } from "../inbox.plan.js";
import { ContactsService, type ContactsDb } from "../contacts.service.js";
import { TemplatesService } from "../templates.service.js";
import { AutomationService } from "../automation.service.js";
import { MemoryAutomationStore } from "../automation.store.js";
import { EVENTS, eventByKey } from "../automation.events.js";
import { TemplateManagerService } from "../template-manager.service.js";
import { MemoryTemplateStore } from "../template-manager.store.js";
import type { TemplateDefinition } from "../../whatsapp/whatsapp.client.js";
import { ClarityService, type SnapshotRow } from "../clarity.service.js";
import type { IntegrationStatus } from "../business-admin.types.js";
import type { WhatsappSender } from "../inbox.types.js";
import type { WhatsappConfig } from "../../whatsapp/whatsapp.types.js";
import { MemoryInboxDb } from "./memory.db.js";
import { MemoryDemoBookings } from "./demo.memory.js";
import { setSandboxDemoDb } from "../../demo/demo.service.js";
import { setSandboxAutomationTrigger } from "../automation.emit.js";
import { DEV_TEST_EMAIL, DEV_TEST_USER_ID, devAuth, devLogin, devTestEnabled, hasValidDevToken } from "./devtest.auth.js";

type Env = Record<string, string | undefined>;

/** Fake WhatsApp "sender": records nothing, calls no network. Messages composed in dev mode never leave the process. */
const fakeWamid = (): string => `${SIMULATED_WAMID_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const offlineSender: WhatsappSender = {
  sendText: async () => ({ waMessageId: fakeWamid() }),
  // Templates were missing here, so the inbox answered NOT_SUPPORTED (HTTP 503, "This feature is not available right now.").
  // The template is still validated against the approved list and consent BEFORE this is reached; nothing leaves the process.
  sendTemplate: async () => ({ waMessageId: fakeWamid() }),
};

/** Not real credentials: just enough for the in-memory service to treat outbound as "ready". */
const sandboxConfig = (): WhatsappConfig => ({
  enabled: true,
  appSecret: "devtest-not-a-secret",
  verifyToken: "devtest-not-a-secret",
  accessToken: "devtest-not-a-token",
  phoneNumberId: "000000000000000",
  graphApiVersion: "v23.0",
  outboundEnabled: true,
});

const sandboxIntegrations: IntegrationStatus = {
  whatsapp: {
    webhookEnabled: true,
    webhookConfigured: true,
    missingVariables: [],
    accessTokenSet: true,
    phoneNumberIdSet: true,
    outboundEnabled: true,
    outboundSending: "ready",
  },
  email: { configured: false },
};

/** Fictional contacts (555-01xx numbers) so the inbox has something to show. Seeded fresh on every server start. */
function seed(db: MemoryInboxDb, now: Date) {
  const ago = (min: number) => new Date(now.getTime() - min * 60_000);
  db.inbound("15555550101", "Hi, I'd like to know about the AI course fees.", ago(12), { contactName: "Test Contact One" });
  db.inbound("15555550101", "Also, is there a weekend batch?", ago(10), { contactName: "Test Contact One" });
  db.inbound("15555550102", "Can you share the Direct2Hire details?", ago(95), { contactName: "Test Contact Two" });
  db.inbound("15555550103", null, ago(240), { contactName: "Test Contact Three" });
  // Last wrote 30h ago: the 24-hour window is closed, so only an approved template (and recorded opt-in) can message them.
  db.inbound("15555550104", "Please call me back about the course.", ago(30 * 60), { contactName: "Test Contact Four (window closed)" });
}

/** Dev-only Business Admin over an in-memory store. Same router/controller code as production, different (fake) deps. */
export function createDevTestRouter(env: Env = process.env): Router {
  const db = new MemoryInboxDb();
  const now = new Date();
  db.users = [{ id: DEV_TEST_USER_ID, firstName: "Adaption", lastName: "Test", email: DEV_TEST_EMAIL, roles: ["ADMIN"] }];
  seed(db, now);
  const memEnv = { BUSINESS_ADMIN_EMAILS: DEV_TEST_EMAIL };
  // sandbox: true => every outbound message here is reported as "Simulated", never as sent/delivered/read.
  const inbox = new PrismaInboxStore(db, memEnv, undefined, { sandbox: true });
  const contacts = new ContactsService(db as unknown as ContactsDb);
  // Sandbox "Meta": one in-memory template list shared by the inbox's template picker and the Template Manager.
  // Nothing is ever sent (offlineSender) and Meta is never called.
  const fakeMeta: TemplateDefinition[] = [
    { id: "900000001", name: "welcome_sandbox", language: "en", status: "APPROVED", category: "UTILITY", components: [{ type: "BODY", text: "Hello {{1}}, thanks for your interest in Avatar." }] },
    { id: "900000002", name: "old_promo", language: "en", status: "REJECTED", category: "MARKETING", rejectedReason: "INVALID_FORMAT", components: [{ type: "BODY", text: "Big sale today, do not miss out!" }] },
    // The suggested templates, "approved" in the sandbox so every activity can be exercised end to end.
    ...EVENTS.map((e, i): TemplateDefinition => ({ id: String(900000010 + i), name: e.suggested.name, language: "en", status: "APPROVED", category: e.suggested.category, components: [{ type: "BODY", text: e.suggested.body }] })),
    { id: "900000003", name: "pending_sandbox", language: "en", status: "PENDING", category: "UTILITY", components: [{ type: "BODY", text: "Hi {{1}}, this template is still in review." }] },
  ];
  const templates = new TemplatesService({ fetchTemplates: async () => fakeMeta.map((t) => structuredClone(t)) });
  const service = new InboxService({ store: inbox, sender: offlineSender, getConfig: sandboxConfig, consent: { check: (w) => contacts.consentFor(w) }, templates });
  // Every template submitted in the sandbox stays PENDING.
  const templateManager = new TemplateManagerService({
    store: new MemoryTemplateStore(),
    onChanged: () => void templates.list(true).catch(() => undefined),
    meta: {
      list: async () => fakeMeta.map((t) => structuredClone(t)),
      get: async (id) => structuredClone(fakeMeta.find((t) => t.id === id) ?? fakeMeta[0]),
      create: async (t) => {
        const id = String(900000100 + fakeMeta.length);
        fakeMeta.push({ id, name: t.name, language: t.language, status: "PENDING", category: t.category, parameterFormat: t.parameterFormat, components: t.components });
        return { id, status: "PENDING", category: t.category };
      },
      edit: async (id, t) => {
        const m = fakeMeta.find((x) => x.id === id);
        if (m) Object.assign(m, { status: "PENDING", rejectedReason: null, components: t.components });
      },
    },
  });
  // Sandbox automation: real engine over in-memory stores. The master switch is OFF, so triggers are only recorded.
  // Sandbox engine: real rules/queue/consent code, mock sender, in-memory. Its switch is ON only here because nothing can leave the process.
  const autoStore = new MemoryAutomationStore();
  for (const e of EVENTS) {
    autoStore.rules.push({
      id: `rule_${e.key.replace(".", "_")}`, name: e.activity, triggerEvent: e.key, templateName: e.suggested.name, templateLanguage: "en", isActive: true,
      variableMapping: Object.fromEntries(e.suggested.mapping.map((k, i) => [String(i + 1), { source: "field" as const, key: k, ...(k === "name" ? { fallback: "there" } : {}) }])),
      createdByUserId: null, updatedByUserId: null, createdAt: now, updatedAt: null,
    });
  }
  const automation = new AutomationService({ store: autoStore, templates, inbox: service, inboxStore: inbox, isEnabled: () => true });
  // The public Book a demo form, in the sandbox: the booking and the contact's consent are kept in memory, and the
  // demo.requested event goes to THIS engine (mock sender), so the confirmation appears in the inbox as "Simulated".
  setSandboxDemoDb({ demoBooking: new MemoryDemoBookings(), whatsappContact: db.whatsappContact as never });
  setSandboxAutomationTrigger(async (i) => {
    const r = await automation.trigger(i);
    await automation.processDue();
    await automation.syncDelivery();
    return r;
  });
  const SAMPLE: Record<string, string> = { name: "Asha", email: "asha@example.com", demo_date: "25 Nov", demo_time: "4:00 PM", subject: "Course question", webinar_title: "AI for Beginners", webinar_date: "28 Nov 2026", amount: "499", product_name: "AI Foundations", payment_id: "pay_sandbox", course_name: "AI Foundations" };
  const simulate = async (i: { event: string; phone: string; eventId?: string; fields?: Record<string, unknown> }) => {
    if (!eventByKey(i.event)) throw new Error("unknown event");
    const result = await automation.trigger({ event: i.event, eventId: i.eventId ?? `sim-${Date.now().toString(36)}`, phone: i.phone, fields: { ...SAMPLE, ...(i.fields ?? {}) } });
    await automation.processDue();
    await automation.syncDelivery();
    return result;
  };
  return createBusinessAdminRouter({
    store: new PrismaBusinessAdminStore(db as unknown as BusinessDb),
    inbox,
    service,
    // Same extra routes as production (profile, tags, templates, search, contacts, groups status) over the in-memory data.
    extras: {
      inbox,
      service,
      contacts,
      templates,
      media: { available: () => false, fetch: async () => { throw new Error("Media is not available in the sandbox."); } },
    },
    automation: { automation, templates: templateManager, approved: templates, simulate },
    // Sandbox analytics: never calls Microsoft Clarity (no token, no network), so the page shows its honest "not connected" state.
    clarity: new ClarityService({
      store: { latest: async () => null, countSince: async () => 0, save: async () => undefined, history: async (): Promise<SnapshotRow[]> => [] },
      getConfig: () => ({}),
      fetchImpl: (async () => { throw new Error("Clarity is not called from the sandbox."); }) as never,
    }),
    getIntegrations: () => sandboxIntegrations,
    findEmail: async () => DEV_TEST_EMAIL,
    authMiddleware: devAuth(env),
    accessMiddleware: (_req, _res, next) => next(), // devAuth already restricts to the one dev principal
  });
}

/**
 * Wraps the real Business Admin router. When the dev test login is NOT enabled this returns `real` itself,
 * so production behaviour (and the router object) is exactly what it was. When enabled:
 *  - POST /dev-login issues a dev token (loopback + correct credentials only);
 *  - requests carrying a valid dev token go to the in-memory router;
 *  - every other request (real tokens, no token, bad token) goes to the real router untouched.
 */
export function withDevTestLogin(real: Router, env: Env = process.env): Router {
  if (!devTestEnabled(env)) return real;
  const router = Router();
  const limiter: RequestHandler = createLimiter({ windowMs: 15 * 60_000, max: 20, message: "Too many attempts. Try again later." });
  router.post("/dev-login", limiter, devLogin(env));
  const dev = createDevTestRouter(env);
  router.use((req: Request, res: Response, next: NextFunction) => (hasValidDevToken(req, env) ? dev(req, res, next) : real(req, res, next)));
  return router;
}
