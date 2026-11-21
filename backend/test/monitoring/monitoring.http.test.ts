import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import jwt from "jsonwebtoken";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { ADMIN_OK, SUPER, call, startInboxApp, tokenFor, JWT_SECRET, type InboxApp } from "../business-admin/app.js";
import { MonitoringService } from "../../src/modules/monitoring/monitoring.service.js";
import { createMonitoringAdminRouter } from "../../src/modules/monitoring/monitoring.admin.js";
import { createTrackRouter } from "../../src/modules/monitoring/monitoring.route.js";
import { requestContext } from "../../src/modules/monitoring/request-context.js";
import { clearRevocations, revokeAuthSession, setRevocationLookup } from "../../src/modules/monitoring/session-revocation.js";
import { monitoringConfig } from "../../src/modules/monitoring/monitoring.util.js";
import { FakeMonitoringDb } from "./fake-db.js";

const KEY_A = "visitor-key-aaaaaaaaaaaaaaaa1";
const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
process.env.JWT_SECRET = JWT_SECRET; // the public tracker reads a real token to link a visit to an account

let db: FakeMonitoringDb;
let svc: MonitoringService;
let app: InboxApp;
const cfg = () => ({ ...monitoringConfig({}), enabled: true });

const staff = (id: string, permissions: Record<string, string[]> | null, modules: string[] = ["monitoring"]) => {
  app.db.users.push({ id, firstName: "Staff", lastName: id, email: `${id}@example.com`, roles: ["BUSINESS_ADMIN"] } as never);
  if (permissions !== undefined) app.db.accessRows.push({ id: `row-${id}`, userId: id, roleKey: "CUSTOM", modules, permissions } as never);
  return tokenFor("BUSINESS_ADMIN", id);
};

before(async () => {
  db = new FakeMonitoringDb();
  svc = new MonitoringService(db, () => db.now, cfg);
  app = await startInboxApp({ monitoring: svc });
});
after(() => app.close());
beforeEach(() => {
  db.visitors = []; db.sessions = []; db.events = []; db.authSessions = []; db.audit = []; db.roleMappings = [{ userId: "boss", role: { name: "SUPERADMIN" } }];
  db.users = [{ id: "u1", firstName: "Asha", lastName: "Rao", email: "asha@example.com", isActive: true, isDeleted: false, isEmailVerified: true, createdAt: new Date(), authProvider: "LOCAL", phoneNo: null }];
  app.db.users = [{ ...SUPER }, { ...ADMIN_OK }];
  app.db.accessRows = [];
  app.env.BUSINESS_ADMIN_EMAILS = "";
  clearRevocations();
  setRevocationLookup(async (sid) => db.sessions.some((s) => s.authSessionId === sid && s.endReason === "TERMINATED"));
});

const seed = async () => {
  await svc.pageView({ visitorKey: KEY_A, path: "/dashboard", userId: "u1", ctx: { device: { deviceType: "desktop", browser: "Chrome", os: "Windows" }, country: null } });
  await svc.onLogin({ userId: "u1", authSessionId: "auth-1", ctx: { ip: "203.0.113.42", device: { deviceType: "desktop", browser: "Chrome", os: "Windows" }, country: null, visitorKey: KEY_A } });
};
const ENDPOINTS = ["/monitoring/stats", "/monitoring/sessions", "/monitoring/people?kind=guest", "/monitoring/people", "/monitoring/security", "/monitoring/analytics", "/monitoring/users/u1", "/monitoring/users/u1/timeline"];

describe("Monitoring API: who may call it (enforced on the server)", () => {
  it("no token: 401 on every endpoint", async () => {
    for (const p of [...ENDPOINTS, "/monitoring/stream"]) assert.equal((await call(app, "GET", p)).status, 401, p);
    assert.equal((await call(app, "POST", "/monitoring/sessions/x/terminate")).status, 401);
  });

  it("an ordinary USER is refused on every endpoint (cannot read anyone's activity)", async () => {
    await seed();
    const t = tokenFor("USER", "u1");
    for (const p of [...ENDPOINTS, "/monitoring/stream"]) assert.equal((await call(app, "GET", p, { token: t })).status, 403, p);
    assert.equal((await call(app, "POST", "/monitoring/sessions/x/terminate", { token: t })).status, 403);
  });

  it("a Learning Admin who is not a Business Admin is refused (Business Admin is separate from /admin)", async () => {
    for (const p of ENDPOINTS) assert.equal((await call(app, "GET", p, { token: tokenFor("ADMIN", ADMIN_OK.id) })).status, 403, p);
  });

  it("SUPERADMIN can read everything", async () => {
    await seed();
    const t = tokenFor("SUPERADMIN", SUPER.id);
    for (const p of ENDPOINTS) assert.equal((await call(app, "GET", p, { token: t })).status, 200, p);
    const stats = (await call(app, "GET", "/monitoring/stats", { token: t })).json.data;
    assert.equal(stats.activeNow, 1);
    const live = (await call(app, "GET", "/monitoring/sessions?status=online", { token: t })).json.data;
    assert.deepEqual([live.total, live.items[0].name, live.items[0].canTerminate], [1, "Asha Rao", true]);
  });

  it("BUSINESS_ADMIN with the Monitoring module can read; one without it is refused", async () => {
    await seed();
    const ok = staff("viewer", { monitoring: ["view"] });
    const noModule = staff("other", { inbox: ["view"] }, ["inbox"]);
    for (const p of ENDPOINTS) {
      assert.equal((await call(app, "GET", p, { token: ok })).status, 200, `${p} (with module)`);
      assert.equal((await call(app, "GET", p, { token: noModule })).status, 403, `${p} (without module)`);
    }
  });

  it("only someone with the manage action (or a Super Admin) can terminate; a view-only admin gets 403 and nothing changes", async () => {
    await seed();
    db.authSessions = [{ id: "auth-1" }];
    const sid = db.sessions[0].id;
    const viewer = staff("viewer", { monitoring: ["view"] });
    assert.equal((await call(app, "POST", `/monitoring/sessions/${sid}/terminate`, { token: viewer })).status, 403);
    assert.equal(db.sessions[0].endedAt, null);
    assert.equal(db.authSessions.length, 1);
    const manager = staff("manager", { monitoring: ["view", "manage"] });
    const r = await call(app, "POST", `/monitoring/sessions/${sid}/terminate`, { token: manager });
    assert.equal(r.status, 200);
    assert.deepEqual([db.sessions[0].endReason, db.authSessions.length, db.audit[0].actorUserId], ["TERMINATED", 0, "manager"]);
  });

  it("a manager cannot end a Super Admin's session, and a repeat terminate is a clean 409", async () => {
    await svc.onLogin({ userId: "boss", authSessionId: "b1", ctx: { ip: null, device: { deviceType: "desktop", browser: "Chrome", os: "Windows" }, country: null, visitorKey: KEY_A } });
    const sid = db.sessions[0].id;
    const manager = staff("manager", { monitoring: ["view", "manage"] });
    assert.equal((await call(app, "POST", `/monitoring/sessions/${sid}/terminate`, { token: manager })).status, 403);
    db.authSessions = [{ id: "b1" }];
    const superT = tokenFor("SUPERADMIN", SUPER.id);
    assert.equal((await call(app, "POST", `/monitoring/sessions/${sid}/terminate`, { token: superT })).status, 200);
    assert.equal((await call(app, "POST", `/monitoring/sessions/${sid}/terminate`, { token: superT })).status, 409);
  });

  it("IP addresses: full for a Super Admin, masked for a Business Admin", async () => {
    await seed();
    const full = (await call(app, "GET", "/monitoring/security?status=success", { token: tokenFor("SUPERADMIN", SUPER.id) })).json.data;
    const masked = (await call(app, "GET", "/monitoring/security?status=success", { token: staff("viewer", { monitoring: ["view"] }) })).json.data;
    assert.equal(full.items[0].ip, "203.0.113.42");
    assert.equal(masked.items[0].ip, "203.0.113.xxx");
    assert.ok(!JSON.stringify(masked).includes("203.0.113.42"));
  });

  it("validation: unknown users are 404, junk filters never crash, paging is clamped", async () => {
    const t = tokenFor("SUPERADMIN", SUPER.id);
    assert.equal((await call(app, "GET", "/monitoring/users/nope", { token: t })).status, 404);
    assert.equal((await call(app, "GET", "/monitoring/visitors/nope", { token: t })).status, 404);
    assert.equal((await call(app, "GET", "/monitoring/sessions?status=%27%3B--&kind=x&page=-5&pageSize=99999&from=garbage", { token: t })).status, 200);
    assert.equal((await call(app, "GET", "/monitoring/security?device=<script>&type=zzz&to=nonsense", { token: t })).status, 200);
    assert.ok((await call(app, "GET", "/monitoring/sessions?pageSize=99999", { token: t })).json.data.pageSize <= 100);
  });
});

describe("access rules for Live Monitoring", () => {
  it("the legacy BUSINESS_ADMIN_EMAILS allowlist does NOT grant monitoring (explicit grant only), though it still grants other modules", async () => {
    app.env.BUSINESS_ADMIN_EMAILS = "ops@example.com";
    const t = tokenFor("ADMIN", ADMIN_OK.id);
    assert.equal((await call(app, "GET", "/overview", { token: t })).status, 200, "the allowlist still works for the modules it always granted");
    for (const p of ENDPOINTS) assert.equal((await call(app, "GET", p, { token: t })).status, 403, p);
    assert.equal((await call(app, "POST", "/monitoring/sessions/x/terminate", { token: t })).status, 403);
    const me = (await call(app, "GET", "/me", { token: t })).json.data;
    assert.ok(!me.modules.includes("monitoring"));
  });

  it("/me for a Super Admin lists monitoring; for staff only what was granted", async () => {
    assert.ok((await call(app, "GET", "/me", { token: tokenFor("SUPERADMIN", SUPER.id) })).json.data.modules.includes("monitoring"));
    const t = staff("viewer", { monitoring: ["view"] });
    const me = (await call(app, "GET", "/me", { token: t })).json.data;
    assert.deepEqual([me.modules, me.permissions.monitoring], [["monitoring"], ["view"]]);
  });

  it("a staff account that was never given the module cannot use it, even with other powerful permissions", async () => {
    const t = staff("ops", { inbox: ["view", "create", "edit", "delete", "manage"], customers: ["view", "manage"], settings: ["view", "edit", "manage"] }, ["inbox", "customers", "settings"]);
    for (const p of ENDPOINTS) assert.equal((await call(app, "GET", p, { token: t })).status, 403, p);
  });

  it("view and manage are separate: view cannot terminate; manage alone (view is implied) can", async () => {
    await seed();
    db.authSessions = [{ id: "auth-1" }];
    const sid = db.sessions[0].id;
    assert.equal((await call(app, "POST", `/monitoring/sessions/${sid}/terminate`, { token: staff("v", { monitoring: ["view", "create", "edit", "delete"] }) })).status, 403);
    assert.equal((await call(app, "POST", `/monitoring/sessions/${sid}/terminate`, { token: staff("m", { monitoring: ["manage"] }) })).status, 200, "manage implies view");
  });

  it("a deactivated staff account loses access immediately, whatever its token says", async () => {
    const t = staff("gone", { monitoring: ["view", "manage"] });
    assert.equal((await call(app, "GET", "/monitoring/stats", { token: t })).status, 200);
    (app.db.users.find((u) => u.id === "gone") as any).isActive = false;
    assert.equal((await call(app, "GET", "/monitoring/stats", { token: t })).status, 403);
  });
});

describe("a terminated sign-in is refused on EVERY instance (token carries the session id)", () => {
  it("a different instance (empty memory) refuses the still-unexpired access token, for admin and public routes alike", async () => {
    await seed();
    db.authSessions = [{ id: "auth-1" }];
    const sid = db.sessions[0].id;
    const userTok = jwt.sign({ id: "u1", role: "USER", sid: "auth-1" }, JWT_SECRET, { expiresIn: "1h" });
    const adminWithSid = jwt.sign({ id: SUPER.id, role: "SUPERADMIN", sid: "auth-1" }, JWT_SECRET, { expiresIn: "1h" });
    assert.equal((await call(app, "GET", "/monitoring/stats", { token: adminWithSid })).status, 200, "before termination the token works");
    await svc.terminateSession(sid, { id: SUPER.id, email: "sam@example.com", isSuperAdmin: true });
    clearRevocations(); // another instance / a restart: only the database remembers
    assert.equal((await call(app, "GET", "/monitoring/stats", { token: adminWithSid })).status, 401);
    const heartbeat = softAuthLike(userTok);
    assert.equal(await heartbeat, true);
  });

  it("tokens without a sid (issued before this feature) and tokens of other sessions are not affected", async () => {
    await seed();
    db.authSessions = [{ id: "auth-1" }];
    await svc.terminateSession(db.sessions[0].id, { id: SUPER.id, email: null, isSuperAdmin: true });
    clearRevocations();
    assert.equal((await call(app, "GET", "/monitoring/stats", { token: tokenFor("SUPERADMIN", SUPER.id) })).status, 200);
    const other = jwt.sign({ id: SUPER.id, role: "SUPERADMIN", sid: "some-other-session" }, JWT_SECRET, { expiresIn: "1h" });
    assert.equal((await call(app, "GET", "/monitoring/stats", { token: other })).status, 200);
  });
});

const softAuthLike = async (token: string) => {
  const { softAuth } = await import("../../src/modules/monitoring/monitoring.route.js");
  return (await softAuth({ headers: { authorization: `Bearer ${token}` } } as never)).revoked;
};

describe("public collection endpoints (/api/track)", () => {
  let server: Server;
  let base: string;
  before(async () => {
    const a = express();
    a.use(express.json());
    a.use(requestContext);
    a.use("/track", createTrackRouter(svc, (_req, _res, next) => next()));
    server = await new Promise<Server>((r) => { const s = a.listen(0, "127.0.0.1", () => r(s)); });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/track`;
  });
  after(() => new Promise<void>((r) => server.close(() => r())));
  const post = async (p: string, body: unknown, token?: string) => {
    const r = await fetch(base + p, { method: "POST", headers: { "content-type": "application/json", "user-agent": CHROME, ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
    return { status: r.status, json: (await r.json()) as any };
  };

  it("works for a guest with no token, and never needs one", async () => {
    const r = await post("/pageview", { visitorId: KEY_A, path: "/courses?utm=1", referrer: "https://google.com/" });
    assert.deepEqual([r.status, r.json.data.tracked], [200, true]);
    assert.deepEqual([db.visitors.length, db.sessions[0].currentPath, db.sessions[0].userId], [1, "/courses", null]);
    assert.equal((await post("/heartbeat", { visitorId: KEY_A, path: "/courses" })).json.data.tracked, true);
  });

  it("a valid access token links the visit to the account (guest-to-user association over HTTP)", async () => {
    await post("/pageview", { visitorId: KEY_A, path: "/" });
    assert.equal(db.visitors[0].userId, null);
    await post("/pageview", { visitorId: KEY_A, path: "/dashboard" }, tokenFor("USER", "u1"));
    assert.equal(db.visitors[0].userId, "u1");
    assert.ok(db.events.every((e) => e.userId === "u1"));
  });

  it("junk input is answered as 'not tracked', never as an error, and unsupported event types are a 400", async () => {
    for (const body of [{}, { visitorId: "x", path: "/" }, { visitorId: KEY_A }, { visitorId: KEY_A, path: 12345 }]) {
      const r = await post("/pageview", body);
      assert.deepEqual([r.status, r.json.data.tracked], [200, false]);
    }
    assert.equal((await post("/event", { visitorId: KEY_A, type: "PAYMENT" })).status, 400);
    assert.equal((await post("/event", { visitorId: KEY_A, type: "FEATURE_USED", path: "/tools", metadata: { feature: "chat", password: "x" } })).json.data.tracked, true);
    assert.ok(!JSON.stringify(db.events).includes("\"x\""));
  });

  it("a terminated sign-in's heartbeat says 'terminated' so the browser can sign out", async () => {
    await post("/pageview", { visitorId: KEY_A, path: "/" });
    const sidToken = jwt.sign({ id: "u1", role: "USER", sid: "auth-7" }, JWT_SECRET, { expiresIn: "5m" });
    assert.equal((await post("/heartbeat", { visitorId: KEY_A }, sidToken)).json.data.terminated, undefined);
    revokeAuthSession("auth-7"); // (the in-memory fast path; the database path is covered in monitoring.test.ts)
    assert.equal((await post("/heartbeat", { visitorId: KEY_A }, sidToken)).json.data.terminated, true);
  });

  it("a database failure never breaks the website (answered as not tracked)", async () => {
    const broken = new MonitoringService({ monitoringVisitor: { findUnique: async () => { throw new Error("db down"); } } }, () => new Date(), cfg);
    const a = express();
    a.use(express.json());
    a.use("/t", createTrackRouter(broken, (_q, _s, n) => n()));
    const s: Server = await new Promise((r) => { const x = a.listen(0, "127.0.0.1", () => r(x)); });
    const r = await fetch(`http://127.0.0.1:${(s.address() as AddressInfo).port}/t/pageview`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ visitorId: KEY_A, path: "/" }) });
    assert.deepEqual([r.status, ((await r.json()) as any).data.tracked], [200, false]);
    await new Promise<void>((x) => s.close(() => x()));
  });
});

describe("real-time dashboard (server-sent events)", () => {
  it("sends an immediate snapshot and then fresh ones as visitors arrive, without a page reload", async () => {
    const a = express();
    a.use((req, _res, next) => { (req as any).user = { id: "x" }; next(); });
    a.use("/m", createMonitoringAdminRouter({ service: svc, view: (_q, _s, n) => n(), manage: (_q, _s, n) => n(), streamIntervalMs: 40 }));
    const server: Server = await new Promise((r) => { const s = a.listen(0, "127.0.0.1", () => r(s)); });
    const ctl = new AbortController();
    try {
    const res = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/m/stream`, { signal: ctl.signal });
    assert.match(res.headers.get("content-type") ?? "", /^text\/event-stream/);
    assert.match(res.headers.get("cache-control") ?? "", /no-transform/);
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = "";
    const snapshots = () => [...buf.matchAll(/event: snapshot\ndata: (.*)\n\n/g)].map((m) => JSON.parse(m[1]));
    const until = async (pred: () => boolean) => {
      const t = Date.now();
      while (!pred() && Date.now() - t < 3000) {
        const { value } = await Promise.race([reader.read(), new Promise<{ value: undefined }>((r) => setTimeout(() => r({ value: undefined }), 100))]);
        if (value) buf += dec.decode(value);
      }
    };
    await until(() => snapshots().length >= 1);
    assert.equal(snapshots()[0].stats.activeNow, 0);
    await svc.pageView({ visitorKey: KEY_A, path: "/courses", ctx: { device: { deviceType: "desktop", browser: "Chrome", os: "Windows" }, country: null } });
    await until(() => snapshots().some((s) => s.stats.activeNow === 1));
    const live = snapshots().find((s) => s.stats.activeNow === 1);
    assert.ok(live, "a later snapshot shows the new visitor");
    assert.equal(live.live[0].currentPath, "/courses");
    } finally {
      ctl.abort();
      server.closeAllConnections?.();
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});
