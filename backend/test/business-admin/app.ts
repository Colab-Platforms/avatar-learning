import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";
import jwt from "jsonwebtoken";
import sanitizeMiddleware from "../../src/middlewares/sanitize.js";
import { errorHandler } from "../../src/middlewares/errorHandler.js";
import { createBusinessAdminRouter } from "../../src/modules/business-admin/business-admin.router.js";
import { requireBusinessAdmin } from "../../src/modules/business-admin/business-admin.access.js";
import { PrismaBusinessAdminStore, type BusinessDb } from "../../src/modules/business-admin/business-admin.store.js";
import { PrismaInboxStore } from "../../src/modules/business-admin/inbox.store.js";
import { InboxService } from "../../src/modules/business-admin/inbox.service.js";
import { AdminsService, type AdminsDb } from "../../src/modules/business-admin/admins.service.js";
import { ContactsService, type ContactsDb } from "../../src/modules/business-admin/contacts.service.js";
import { TemplatesService } from "../../src/modules/business-admin/templates.service.js";
import type { MediaFetcher } from "../../src/modules/business-admin/whatsapp-extras.controller.js";
import { ClarityService, readClarityConfig, type SnapshotRow } from "../../src/modules/business-admin/clarity.service.js";
import type { IntegrationStatus } from "../../src/modules/business-admin/business-admin.types.js";
import type { WhatsappConfig } from "../../src/modules/whatsapp/whatsapp.types.js";
import { FakeSender, readyConfig } from "./fakes.js";
import { AdminFakeDb, type AdminFakeUser } from "./admin-fakes.js";

export const JWT_SECRET = "test_jwt_secret_for_business_admin";
process.env.JWT_SECRET = JWT_SECRET;

export type Role = "USER" | "ADMIN" | "SUPERADMIN" | "BUSINESS_ADMIN";
export const tokenFor = (role: Role, id = `${role.toLowerCase()}-user-1`) => jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "5m" });

export const integrations: IntegrationStatus = {
  whatsapp: { webhookEnabled: true, webhookConfigured: true, missingVariables: [], accessTokenSet: true, phoneNumberIdSet: true, outboundEnabled: true, outboundSending: "ready" },
  email: { configured: false },
};

export interface InboxApp {
  url: string;
  db: AdminFakeDb;
  sender: FakeSender;
  config: { current: WhatsappConfig };
  env: Record<string, string | undefined>;
  /** Account lookups made by the access check (it runs on every request). */
  emailLookups: string[];
  now: { current: Date };
  /** Hashes passed to the admin service (so tests can prove plaintext is never stored). */
  hashed: string[];
  /** What the media proxy serves; tests replace it. */
  media: { fetcher: MediaFetcher; available: boolean; fail: boolean; bytes: Uint8Array; contentType: string; requested: string[] };
  close(): Promise<void>;
}

export const SUPER: AdminFakeUser = { id: "superadmin-user-1", firstName: "Sam", lastName: "Super", email: "sam@example.com", roles: ["SUPERADMIN"] };
export const ADMIN_OK: AdminFakeUser = { id: "admin-user-1", firstName: "Asha", lastName: "Ops", email: "ops@example.com", roles: ["ADMIN"] };

/** Real Express + real sanitize/auth/access/error handling over the fake database; only WhatsApp itself is faked. */
export async function startInboxApp(opts: { users?: AdminFakeUser[]; env?: Record<string, string | undefined>; hash?: (p: string) => Promise<string>; monitoring?: any } = {}): Promise<InboxApp> {
  const db = new AdminFakeDb();
  db.users = opts.users ?? [SUPER, ADMIN_OK];
  const env: Record<string, string | undefined> = opts.env ?? { BUSINESS_ADMIN_EMAILS: "ops@example.com" };
  const config = { current: readyConfig() };
  const sender = new FakeSender();
  const emailLookups: string[] = [];
  const hashed: string[] = [];
  const now = { current: new Date() };
  db.clock = () => now.current;

  const inbox = new PrismaInboxStore(db, env, () => now.current);
  const contacts = new ContactsService(db as unknown as ContactsDb, () => now.current);
  const templates = new TemplatesService({
    fetchTemplates: async () => [
      { name: "order_update", language: "en", status: "APPROVED", category: "UTILITY", components: [{ type: "BODY", text: "Hi {{1}}, order {{2}} is on its way." }] },
      { name: "welcome", language: "en", status: "APPROVED", category: "MARKETING", components: [{ type: "BODY", text: "Welcome!" }] },
    ],
  });
  const service = new InboxService({ store: inbox, sender, getConfig: () => config.current, now: () => now.current, consent: { check: (w) => contacts.consentFor(w) }, templates });
  const mediaState = { available: true, fail: false, bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]), contentType: "image/jpeg", requested: [] as string[], fetcher: null as unknown as MediaFetcher };
  mediaState.fetcher = {
    available: () => mediaState.available,
    fetch: async (mediaId: string) => {
      mediaState.requested.push(mediaId);
      if (mediaState.fail) throw new Error("expired");
      const bytes = mediaState.bytes;
      return { stream: new ReadableStream<Uint8Array>({ start: (c) => (c.enqueue(bytes), c.close()) }), contentType: mediaState.contentType, contentLength: bytes.byteLength, fileSize: bytes.byteLength };
    },
  };
  // Fast fake hash by default; one test uses real bcrypt through AdminsService directly.
  const hash = opts.hash ?? (async (p: string) => (hashed.push(p), `hash:${p.length}:${Buffer.from(p).toString("base64")}`));
  const admins = new AdminsService({ db: db as unknown as AdminsDb, env, hash });
  const findAccount = async (id: string) => {
    emailLookups.push(id);
    const u = db.users.find((x) => x.id === id) as AdminFakeUser | undefined;
    if (!u) return null;
    const row = db.accessRows.find((r) => r.userId === id);
    return { email: u.email, isActive: u.isActive !== false, isDeleted: !!u.isDeleted, modules: row ? row.modules : null, permissions: row ? row.permissions ?? null : null };
  };

  const app = express();
  // Same body handling as index.ts: raw body kept for exact text, then the global sanitizer.
  app.use(express.json({ verify: (req: any, _res, buf) => void (req.rawBody = buf.toString("utf8")) }));
  app.use(sanitizeMiddleware);
  app.use(
    "/api/business-admin",
    createBusinessAdminRouter({
      store: new PrismaBusinessAdminStore(db as unknown as BusinessDb),
      inbox,
      service,
      extras: { inbox, service, contacts, templates, media: mediaState.fetcher },
      // The network is never reachable from tests: any real Clarity call would fail, so these endpoints are only exercised for access control and validation.
      clarity: new ClarityService({
        store: { latest: async () => null, countSince: async () => 0, save: async () => undefined, history: async (): Promise<SnapshotRow[]> => [] },
        getConfig: () => readClarityConfig(process.env),
        fetchImpl: (async () => { throw new Error("network disabled in tests"); }) as never,
      }),
      getIntegrations: () => integrations,
      findAccount,
      admins,
      ...(opts.monitoring ? { monitoring: opts.monitoring } : {}),
      accessMiddleware: (req, res, next) => requireBusinessAdmin({ findAccount, env })(req, res, next),
      sendLimiter: (_req, _res, next) => next(),
      adminWriteLimiter: (_req, _res, next) => next(),
    }),
  );
  app.use(errorHandler);

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/business-admin`,
    db,
    sender,
    config,
    env,
    emailLookups,
    now,
    hashed,
    media: mediaState,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

export async function call(app: InboxApp, method: string, path: string, opts: { token?: string; body?: unknown; rawBody?: string } = {}) {
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let body: string | undefined;
  if (opts.rawBody !== undefined) body = opts.rawBody;
  else if (opts.body !== undefined) body = JSON.stringify(opts.body);
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(app.url + path, { method, headers, body });
  return { status: res.status, json: (await res.json().catch(() => null)) as any };
}

export const asSuper = (app: InboxApp, method: string, path: string, body?: unknown) => call(app, method, path, { token: tokenFor("SUPERADMIN"), body });
