import prisma from "@root/prisma.js";
import { getWhatsappConfig, missingWebhookConfig } from "@/modules/whatsapp/whatsapp.config.js";
import { WhatsappClient } from "@/modules/whatsapp/whatsapp.client.js";
import { ContactsService, type ContactsDb } from "./contacts.service.js";
import { TemplatesService } from "./templates.service.js";
import { ClarityService, PrismaSnapshotStore, readClarityConfig, type ClarityDb } from "./clarity.service.js";
import { isMailConfigured } from "@/utils/mailer.js";
import { createBusinessAdminRouter } from "./business-admin.router.js";
import { PrismaBusinessAdminStore, type BusinessDb } from "./business-admin.store.js";
import { PrismaInboxStore, type InboxDb } from "./inbox.store.js";
import { InboxService, outboundReady } from "./inbox.service.js";
import type { IntegrationStatus } from "./business-admin.types.js";
import { AdminsService, type AdminsDb } from "./admins.service.js";
import { AutomationService } from "./automation.service.js";
import { PrismaAutomationStore, type AutomationDb } from "./automation.store.js";
import { TemplateManagerService } from "./template-manager.service.js";
import { PrismaTemplateStore, type TemplateDb } from "./template-manager.store.js";
import { withDevTestLogin } from "./devtest/devtest.router.js";
import { emailAutomation } from "../email-automation/email-automation.runtime.js";

const getIntegrations = (): IntegrationStatus => {
  const c = getWhatsappConfig();
  const missing = missingWebhookConfig(c);
  return {
    whatsapp: {
      webhookEnabled: c.enabled,
      webhookConfigured: c.enabled && missing.length === 0,
      missingVariables: c.enabled ? missing : [],
      accessTokenSet: Boolean(c.accessToken),
      phoneNumberIdSet: Boolean(c.phoneNumberId),
      outboundEnabled: c.outboundEnabled === true,
      outboundSending: outboundReady(c) ? "ready" : "inactive",
    },
    email: { configured: isMailConfigured },
  };
};

const inbox = new PrismaInboxStore(prisma as unknown as InboxDb);
const contacts = new ContactsService(prisma as unknown as ContactsDb);
// Config is read on every call, so enabling/disabling WhatsApp never needs a restart.
const client = () => new WhatsappClient({ config: getWhatsappConfig() });
const templates = new TemplatesService({ fetchTemplates: () => client().listTemplates() });
const service = new InboxService({
  store: inbox,
  sender: {
    sendText: (to, text, opts) => client().sendTextMessage(to, text, opts),
    uploadMedia: (file) => client().uploadMedia(file),
    sendMedia: (to, media, opts) => client().sendMediaMessage(to, media, opts),
    sendTemplate: (to, template, opts) => client().sendTemplateMessage(to, template, opts),
  },
  getConfig: () => getWhatsappConfig(),
  // The contacts' opt-in register: WITHDRAWN blocks every send, business-initiated templates need GRANTED.
  consent: { check: (waId) => contacts.consentFor(waId) },
  templates,
});
const media = {
  available: () => {
    const c = getWhatsappConfig();
    return c.enabled && Boolean(c.accessToken) && Boolean(c.phoneNumberId);
  },
  fetch: async (mediaId: string) => {
    const c = client();
    const info = await c.getMediaInfo(mediaId);
    const file = await c.openMedia(info.url);
    return { stream: file.stream, contentType: info.mimeType, contentLength: file.contentLength, fileSize: info.fileSize };
  },
};

// Template Manager: drafts live in our database; Meta is the only source of a template's status.
const templateManager = new TemplateManagerService({
  store: new PrismaTemplateStore(prisma as unknown as TemplateDb),
  meta: {
    list: () => client().listTemplates(),
    get: (id) => client().getTemplate(id),
    create: (t) => client().createTemplate(t),
    edit: (id, t) => client().editTemplate(id, t),
    uploadExample: (f) => client().uploadTemplateExample(f),
  },
  // The send path caches Meta's list for a few minutes; refresh it after any change so a status never lags.
  onChanged: () => void templates.list(true).catch(() => undefined),
});

/** Master switch for automatic sending. Off unless WHATSAPP_AUTOMATION_ENABLED=true (and outbound is itself enabled). */
export const automationEnabled = (): boolean => process.env.WHATSAPP_AUTOMATION_ENABLED?.trim().toLowerCase() === "true";
export const automation = new AutomationService({
  store: new PrismaAutomationStore(prisma as unknown as AutomationDb),
  templates,
  inbox: service,
  inboxStore: inbox,
  isEnabled: automationEnabled,
});

// Mounted at /api/business-admin in src/routes.ts.
// withDevTestLogin returns the router below UNCHANGED unless NODE_ENV=development and DEV_TEST_LOGIN=true (see devtest/).
const realRouter = createBusinessAdminRouter({
  store: new PrismaBusinessAdminStore(prisma as unknown as BusinessDb),
  inbox,
  service,
  extras: { inbox, service, contacts, templates, media },
  automation: { automation, templates: templateManager, approved: templates },
  email: emailAutomation,
  // Read per request so the token can be set or rotated without a restart.
  clarity: new ClarityService({ store: new PrismaSnapshotStore(prisma as unknown as ClarityDb), getConfig: () => readClarityConfig() }),
  getIntegrations,
  // Looked up on every request, so deactivating an admin or changing permissions takes effect immediately.
  findAccount: async (id) => {
    const [user, access] = await Promise.all([
      prisma.user.findUnique({ where: { id }, select: { email: true, isActive: true, isDeleted: true } }),
      prisma.businessAdminAccess.findUnique({ where: { userId: id }, select: { modules: true } }),
    ]);
    return user ? { email: user.email, isActive: user.isActive, isDeleted: user.isDeleted, modules: access ? access.modules : null } : null;
  },
  admins: new AdminsService({ db: prisma as unknown as AdminsDb }),
});

export default withDevTestLogin(realRouter);
