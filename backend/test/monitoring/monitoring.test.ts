import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { MonitoringService, type Ctx } from "../../src/modules/monitoring/monitoring.service.js";
import { clearRevocations, isAuthSessionRevoked, setRevocationLookup } from "../../src/modules/monitoring/session-revocation.js";
import { monitoringConfig, parseUserAgent } from "../../src/modules/monitoring/monitoring.util.js";
import { FakeMonitoringDb, nid } from "./fake-db.js";

const CHROME_WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const KEY_A = "visitor-key-aaaaaaaaaaaaaaaa1";
const KEY_B = "visitor-key-bbbbbbbbbbbbbbbb2";
const desktop = { device: parseUserAgent(CHROME_WIN), country: "IN" as string | null };
const phone = { device: parseUserAgent(IPHONE), country: null as string | null };
const fullCtx = (key: string | null, ua = CHROME_WIN): Ctx => ({ ip: "203.0.113.42", device: parseUserAgent(ua), country: null, visitorKey: key });

let db: FakeMonitoringDb;
let svc: MonitoringService;
const cfg = () => ({ ...monitoringConfig({}), enabled: true });
const advance = (ms: number) => (db.now = new Date(db.now.getTime() + ms));

beforeEach(() => {
  db = new FakeMonitoringDb();
  svc = new MonitoringService(db, () => db.now, cfg);
  clearRevocations();
  // The shared-database lookup every backend instance uses (here against the in-memory fake).
  setRevocationLookup(async (sid) => db.sessions.some((s) => s.authSessionId === sid && s.endReason === "TERMINATED"));
  db.users = [
    { id: "u1", firstName: "Asha", lastName: "Rao", email: "asha@example.com", isActive: true, isDeleted: false, isEmailVerified: true, createdAt: new Date("2026-11-24T04:00:00Z"), authProvider: "LOCAL", phoneNo: null },
    { id: "u2", firstName: "Ravi", lastName: "Kumar", email: "ravi@example.com", isActive: true, isDeleted: false, isEmailVerified: true, createdAt: new Date("2026-11-01T04:00:00Z"), authProvider: "LOCAL", phoneNo: null },
    { id: "boss", firstName: "Sam", lastName: "Super", email: "sam@example.com", isActive: true, isDeleted: false, isEmailVerified: true, createdAt: new Date("2026-10-01T04:00:00Z"), authProvider: "LOCAL", phoneNo: null },
  ];
  db.roleMappings = [{ userId: "boss", role: { name: "SUPERADMIN" } }, { userId: "u1", role: { name: "USER" } }];
});

describe("guest visitors and page views", () => {
  it("a guest's first page view creates the visitor, one open session and a PAGE_VIEW event (no personal data)", async () => {
    const r = await svc.pageView({ visitorKey: KEY_A, path: "/courses", referrer: "https://www.google.com/search?q=x", ctx: desktop });
    assert.equal(r.tracked, true);
    assert.equal(db.visitors.length, 1);
    assert.deepEqual([db.visitors[0].userId, db.visitors[0].country, db.visitors[0].browser, db.visitors[0].os, db.visitors[0].deviceType], [null, "IN", "Chrome", "Windows", "desktop"]);
    assert.equal(db.visitors[0].firstReferrer, "www.google.com", "referrer reduced to its host");
    assert.equal(db.sessions.length, 1);
    assert.deepEqual([db.sessions[0].endedAt, db.sessions[0].currentPath, db.sessions[0].userId], [null, "/courses", null]);
    assert.deepEqual([db.events[0].category, db.events[0].type, db.events[0].userId, db.events[0].ip], ["ACTIVITY", "PAGE_VIEW", null, null]);
  });

  it("never stores query strings, hashes or full URLs, and ignores bots, admin screens and bad input", async () => {
    await svc.pageView({ visitorKey: KEY_A, path: "https://avatarindia.com/reset-password?token=SECRET123#frag", ctx: desktop });
    assert.equal(db.sessions[0].currentPath, "/reset-password");
    assert.ok(!JSON.stringify(db).includes("SECRET123"));
    const before = db.events.length;
    for (const bad of [
      { visitorKey: "short", path: "/x", ctx: desktop },
      { visitorKey: KEY_B, path: "/admin/users", ctx: desktop },
      { visitorKey: KEY_B, path: "/admin-adaption/inbox", ctx: desktop },
      { visitorKey: KEY_B, path: "no-slash", ctx: desktop },
      { visitorKey: KEY_B, path: "/x", ctx: { device: parseUserAgent("Googlebot/2.1 (+http://www.google.com/bot.html)"), country: null } },
    ]) assert.equal((await svc.pageView(bad as never)).tracked, false);
    assert.equal(db.events.length, before);
    assert.equal(db.visitors.length, 1);
  });

  it("classifies course and lesson pages", async () => {
    await svc.pageView({ visitorKey: KEY_A, path: "/courses/intro-to-ai", ctx: desktop });
    await svc.pageView({ visitorKey: KEY_A, path: "/courses/intro-to-ai/learn", ctx: desktop });
    await svc.pageView({ visitorKey: KEY_A, path: "/about", ctx: desktop });
    assert.deepEqual(db.events.map((e) => e.type), ["COURSE_VIEW", "LESSON_VIEW", "PAGE_VIEW"]);
  });

  it("navigation keeps ONE open session per visitor and records the path history", async () => {
    for (const p of ["/", "/courses", "/courses/x", "/about"]) { advance(5_000); await svc.pageView({ visitorKey: KEY_A, path: p, ctx: desktop }); }
    assert.equal(db.sessions.length, 1);
    assert.deepEqual([db.sessions[0].pageViews, db.sessions[0].currentPath, db.visitors[0].pageViews], [4, "/about", 4]);
    assert.equal(db.events.filter((e) => e.sessionId === db.sessions[0].id).length, 4);
  });

  it("a visit after the idle limit starts a NEW session (the old one is not reused)", async () => {
    await svc.pageView({ visitorKey: KEY_A, path: "/", ctx: desktop });
    advance(31 * 60_000);
    await svc.pageView({ visitorKey: KEY_A, path: "/", ctx: desktop });
    assert.equal(db.sessions.length, 2);
  });

  it("tracking can be switched off", async () => {
    const off = new MonitoringService(db, () => db.now, () => ({ ...cfg(), enabled: false }));
    assert.equal((await off.pageView({ visitorKey: KEY_A, path: "/", ctx: desktop })).tracked, false);
    assert.equal(db.visitors.length, 0);
  });
});

describe("registered users and guest-to-account association", () => {
  it("a signed-in page view links the visitor and stamps the user on session and event", async () => {
    await svc.pageView({ visitorKey: KEY_A, path: "/dashboard", userId: "u1", ctx: desktop });
    assert.equal(db.visitors[0].userId, "u1");
    assert.deepEqual([db.sessions[0].userId, db.events[0].userId], ["u1", "u1"]);
  });

  it("login attaches the browser's earlier guest history to the account", async () => {
    await svc.pageView({ visitorKey: KEY_A, path: "/", ctx: desktop });
    await svc.pageView({ visitorKey: KEY_A, path: "/courses", ctx: desktop });
    assert.deepEqual(db.events.map((e) => e.userId), [null, null]);
    await svc.onLogin({ userId: "u1", authSessionId: "auth-1", ctx: fullCtx(KEY_A) });
    assert.equal(db.visitors[0].userId, "u1");
    assert.ok(db.events.filter((e) => e.type === "PAGE_VIEW").every((e) => e.userId === "u1"), "pre-login page views now belong to the account");
    assert.equal(db.sessions.length, 1, "the guest session continues as the signed-in session (no duplicate)");
    assert.deepEqual([db.sessions[0].userId, db.sessions[0].authSessionId], ["u1", "auth-1"]);
  });

  it("a browser already linked to another person is NOT re-linked (shared computer), and gets a fresh session for the new person", async () => {
    await svc.pageView({ visitorKey: KEY_A, path: "/", userId: "u1", ctx: desktop });
    await svc.pageView({ visitorKey: KEY_A, path: "/more", userId: "u1", ctx: desktop });
    await svc.onLogin({ userId: "u2", authSessionId: "auth-2", ctx: fullCtx(KEY_A) });
    assert.equal(db.visitors[0].userId, "u1", "history stays with the first owner");
    assert.ok(db.events.filter((e) => e.type === "PAGE_VIEW").every((e) => e.userId === "u1"));
    assert.equal(db.sessions.length, 2);
    assert.equal(db.sessions.find((s) => s.endedAt === null)!.userId, "u2");
  });

  it("a sign-in from a client with no visitor id still creates one session for the account", async () => {
    await svc.onLogin({ userId: "u1", authSessionId: "auth-1", ctx: fullCtx(null) });
    assert.equal(db.sessions.length, 1);
    assert.equal(db.visitors[0].visitorKey, "u_u1");
  });
});

describe("login, logout and failed-login events", () => {
  it("records a successful login with device and IP, and logout ends the session with its reason", async () => {
    await svc.pageView({ visitorKey: KEY_A, path: "/", ctx: desktop });
    await svc.onLogin({ userId: "u1", authSessionId: "auth-1", ctx: fullCtx(KEY_A) });
    const login = db.events.find((e) => e.type === "LOGIN_SUCCESS")!;
    assert.deepEqual([login.category, login.outcome, login.userId, login.ip, login.browser], ["AUTH", "SUCCESS", "u1", "203.0.113.42", "Chrome"]);
    advance(60_000);
    await svc.onLogout({ authSessionId: "auth-1", userId: "u1", ctx: fullCtx(KEY_A) });
    assert.deepEqual([db.sessions[0].endReason, db.sessions[0].endedAt !== null], ["LOGOUT", true]);
    assert.ok(db.events.some((e) => e.type === "LOGOUT" && e.userId === "u1"));
  });

  it("a refreshed sign-in keeps the monitoring session pointing at the live refresh token", async () => {
    await svc.onLogin({ userId: "u1", authSessionId: "auth-1", ctx: fullCtx(KEY_A) });
    await svc.onSessionRotated("auth-1", "auth-2");
    assert.equal(db.sessions[0].authSessionId, "auth-2");
    await svc.onLogout({ authSessionId: "auth-2", userId: "u1", ctx: fullCtx(KEY_A) });
    assert.equal(db.sessions[0].endReason, "LOGOUT");
  });

  it("records a failed login with the typed email (lower-cased) and the reason, and never a password", async () => {
    await svc.onLoginFailed({ identifier: "  Asha@Example.com ".trim(), userId: "u1", reason: "BAD_PASSWORD", ctx: fullCtx(KEY_B) });
    const e = db.events[0];
    assert.deepEqual([e.type, e.outcome, e.reason, e.identifier, e.userId, e.ip], ["LOGIN_FAILED", "FAILURE", "BAD_PASSWORD", "asha@example.com", "u1", "203.0.113.42"]);
    assert.ok(!Object.keys(e).some((k) => /pass|token|secret/i.test(k)));
  });

  it("account events: registration, verification, password change, (de)activation and business events are recorded for the user", async () => {
    for (const t of ["REGISTERED", "EMAIL_VERIFIED", "PASSWORD_CHANGED", "ACCOUNT_DEACTIVATED"] as const) await svc.onAccountEvent(t, { userId: "u1", ctx: fullCtx(null) });
    for (const t of ["ENROLLMENT", "PAYMENT", "LESSON_COMPLETED", "TEST_COMPLETED", "PROFILE_UPDATED"] as const) await svc.onAccountEvent(t, { userId: "u1", module: "x", metadata: { n: 1 } });
    assert.deepEqual(db.events.map((e) => e.type), ["REGISTERED", "EMAIL_VERIFIED", "PASSWORD_CHANGED", "ACCOUNT_DEACTIVATED", "ENROLLMENT", "PAYMENT", "LESSON_COMPLETED", "TEST_COMPLETED", "PROFILE_UPDATED"]);
    assert.deepEqual([db.events[0].category, db.events[4].category], ["AUTH", "ACTIVITY"]);
    await svc.onAccountEvent("NOT_A_TYPE" as never, { userId: "u1" });
    assert.equal(db.events.length, 9, "unknown types are ignored");
  });
});

describe("heartbeat and online/offline", () => {
  it("online only while the last heartbeat is recent; offline after the (configurable) timeout", async () => {
    await svc.pageView({ visitorKey: KEY_A, path: "/", ctx: desktop });
    assert.equal((await svc.stats()).activeNow, 1);
    advance(60_000);
    await svc.heartbeat({ visitorKey: KEY_A, path: "/", ctx: desktop });
    assert.equal((await svc.stats()).activeNow, 1);
    advance(89_000);
    assert.equal((await svc.stats()).activeNow, 1, "just inside the 90s timeout");
    advance(2_000);
    assert.equal((await svc.stats()).activeNow, 0, "just past it");
    const short = new MonitoringService(db, () => db.now, () => ({ ...cfg(), onlineTimeoutSeconds: 20 }));
    await svc.heartbeat({ visitorKey: KEY_A, path: "/", ctx: desktop });
    advance(25_000);
    assert.equal((await short.stats()).activeNow, 0, "the timeout is configurable");
  });

  it("a heartbeat updates last activity and current path, never creates a visitor, and never duplicates the session", async () => {
    assert.equal((await svc.heartbeat({ visitorKey: KEY_A, path: "/", ctx: desktop })).tracked, false);
    assert.equal(db.visitors.length, 0);
    await svc.pageView({ visitorKey: KEY_A, path: "/", ctx: desktop });
    for (let i = 0; i < 5; i++) { advance(30_000); await svc.heartbeat({ visitorKey: KEY_A, path: i === 4 ? "/courses" : "/", ctx: desktop }); }
    assert.equal(db.sessions.length, 1);
    assert.equal(db.sessions[0].currentPath, "/courses");
    assert.equal(db.sessions[0].lastActivityAt.getTime(), db.now.getTime());
  });

  it("not every account is online: a registered user with no heartbeat is offline, and offline sessions are not 'active'", async () => {
    await svc.onLogin({ userId: "u1", authSessionId: "a1", ctx: fullCtx(KEY_A) });
    advance(5 * 60_000);
    const s = await svc.stats();
    assert.deepEqual([s.activeNow, s.activeRegistered, s.totalRegisteredUsers], [0, 0, 3]);
    assert.equal((await svc.people({ kind: "registered", online: "1" })).total, 0);
  });

  it("browser closure and expired sessions: idle sessions are closed as TIMEOUT, or EXPIRED (with an event) when their sign-in is gone", async () => {
    await svc.onLogin({ userId: "u1", authSessionId: "gone", ctx: fullCtx(KEY_A) });
    await svc.onLogin({ userId: "u2", authSessionId: "alive", ctx: fullCtx(KEY_B) });
    await svc.pageView({ visitorKey: "visitor-key-ccccccccccccccccc3", path: "/", ctx: desktop });
    db.authSessions = [{ id: "alive" }];
    advance(31 * 60_000);
    assert.equal(await svc.closeIdleSessions(), 3);
    const by = (uid: string | null) => db.sessions.find((s) => s.userId === uid)!;
    assert.equal(by("u1").endReason, "EXPIRED");
    assert.equal(by("u2").endReason, "TIMEOUT");
    assert.equal(by(null).endReason, "TIMEOUT");
    assert.ok(db.events.some((e) => e.type === "SESSION_EXPIRED" && e.userId === "u1"));
    assert.equal(await svc.closeIdleSessions(), 0, "idempotent");
  });
});

describe("multiple sessions and the live list", () => {
  it("one account on two devices shows two live sessions; guests and registered are counted separately", async () => {
    await svc.pageView({ visitorKey: KEY_A, path: "/dashboard", userId: "u1", ctx: desktop });
    await svc.pageView({ visitorKey: KEY_B, path: "/courses", userId: "u1", ctx: phone });
    await svc.pageView({ visitorKey: "visitor-key-ccccccccccccccccc3", path: "/", ctx: desktop });
    const s = await svc.stats();
    assert.deepEqual([s.activeNow, s.activeRegistered, s.activeGuests], [3, 2, 1]);
    const live = await svc.listSessions({ status: "online" });
    assert.equal(live.total, 3);
    assert.deepEqual(live.items.filter((i: any) => i.userId === "u1").map((i: any) => i.device.type).sort(), ["desktop", "mobile"]);
    assert.ok(live.items.every((i: any) => i.online && i.status === "online"));
    const reg = live.items.find((i: any) => i.userId === "u1")!;
    assert.deepEqual([reg.name, reg.kind, reg.loginStatus, reg.currentPath !== null], ["Asha Rao", "registered", "signed_in", true]);
    assert.deepEqual(live.items.find((i: any) => i.kind === "guest")!.loginStatus, "guest");
  });

  it("filters by kind, status and search, and paginates", async () => {
    for (let i = 0; i < 7; i++) { advance(1000); await svc.pageView({ visitorKey: `visitor-key-guest${i}-xxxxxxxxxxxxx`, path: "/", ctx: desktop }); }
    await svc.pageView({ visitorKey: KEY_A, path: "/dashboard", userId: "u1", ctx: desktop });
    assert.equal((await svc.listSessions({ status: "online", kind: "guest" })).total, 7);
    assert.equal((await svc.listSessions({ status: "online", kind: "registered" })).total, 1);
    assert.equal((await svc.listSessions({ status: "online", search: "asha" })).total, 1, "search by account name");
    assert.equal((await svc.listSessions({ status: "online", search: "visitor-key-guest3" })).total, 1, "search by visitor id");
    const p1 = await svc.listSessions({ status: "online", page: 1, pageSize: 3 });
    const p3 = await svc.listSessions({ status: "online", page: 3, pageSize: 3 });
    assert.deepEqual([p1.items.length, p1.total, p3.items.length, p3.page], [3, 8, 2, 3]);
    assert.equal(new Set([...p1.items, ...p3.items].map((i: any) => i.id)).size, 5, "pages do not overlap");
    advance(10 * 60_000);
    assert.equal((await svc.listSessions({ status: "online" })).total, 0);
    assert.equal((await svc.listSessions({ status: "offline" })).total, 8, "offline sessions from the last 24h are listed");
  });

  it("the 8 dashboard numbers are computed for today (India time)", async () => {
    await svc.pageView({ visitorKey: KEY_A, path: "/", userId: "u1", ctx: desktop });
    await svc.onLogin({ userId: "u1", authSessionId: "a1", ctx: fullCtx(KEY_A) });
    await svc.onLoginFailed({ identifier: "x@example.com", reason: "UNKNOWN_EMAIL", ctx: fullCtx(null) });
    await svc.onLoginFailed({ identifier: "y@example.com", reason: "BAD_PASSWORD", ctx: fullCtx(null) });
    db.events.push({ id: "old", category: "AUTH", type: "LOGIN_FAILED", createdAt: new Date("2026-11-20T10:00:00Z") });
    const s = await svc.stats();
    assert.deepEqual(
      [s.activeNow, s.activeRegistered, s.activeGuests, s.totalRegisteredUsers, s.loginsToday, s.newRegistrationsToday, s.failedLoginsToday, s.sessionsToday],
      [1, 1, 0, 3, 1, 1, 2, 1],
    );
  });
});

describe("people, user detail and activity timeline", () => {
  it("lists guests and registered users with online state; search works", async () => {
    await svc.pageView({ visitorKey: KEY_A, path: "/", userId: "u1", ctx: desktop });
    await svc.pageView({ visitorKey: KEY_B, path: "/", ctx: phone });
    const guests = await svc.people({ kind: "guest" });
    assert.deepEqual([guests.total, guests.items[0].online, (guests.items[0] as any).label.startsWith("Guest ")], [1, true, true]);
    const reg = await svc.people({ kind: "registered" });
    assert.equal(reg.total, 3);
    assert.equal(reg.items.find((u: any) => u.userId === "u1").online, true);
    assert.equal(reg.items.find((u: any) => u.userId === "u2").online, false);
    assert.equal((await svc.people({ kind: "registered", search: "ravi" })).total, 1);
    assert.equal((await svc.people({ kind: "registered", online: "1" })).total, 1);
  });

  it("user detail: account, online/current page, sessions, logins, devices, courses, payments and event counts", async () => {
    await svc.pageView({ visitorKey: KEY_A, path: "/dashboard", userId: "u1", ctx: desktop });
    await svc.onLogin({ userId: "u1", authSessionId: "a1", ctx: fullCtx(KEY_A) });
    await svc.onLoginFailed({ identifier: "asha@example.com", userId: "u1", reason: "BAD_PASSWORD", ctx: fullCtx(KEY_A) });
    db.courseRows = [{ id: "c1", title: "Intro to AI" }];
    db.enrollments = [{ id: "e1", userId: "u1", courseId: "c1", enrolledAt: new Date("2026-11-20T00:00:00Z"), progress: 40, isCompleted: false }];
    db.payments = [{ id: "p1", userId: "u1", status: "PAID", amount: 49900, currency: "INR", productType: "COURSE", createdAt: new Date("2026-11-20T00:00:00Z") }];
    const d = await svc.userDetail("u1");
    assert.deepEqual([d.account.name, d.account.roles, d.online, d.currentPath], ["Asha Rao", ["USER"], true, "/dashboard"]);
    assert.deepEqual([d.sessions.length, d.logins.map((l: any) => l.type).sort(), d.devices[0].browser], [1, ["LOGIN_FAILED", "LOGIN_SUCCESS"], "Chrome"]);
    assert.deepEqual([d.courses[0].title, d.courses[0].progress, d.payments[0].amount, d.registration.provider], ["Intro to AI", 40, 499, "LOCAL"]);
    assert.equal(d.eventCounts.PAGE_VIEW, 1);
    await assert.rejects(svc.userDetail("nope"), /User not found/);
  });

  it("timeline: newest first, filtered by event types, category and date range, and paginated; guest history is separate until linked", async () => {
    await svc.pageView({ visitorKey: KEY_B, path: "/guest-page", ctx: phone });
    const guestVisitor = db.visitors.find((v) => v.visitorKey === KEY_B)!;
    assert.equal((await svc.timeline({ userId: "u1" })).total, 0, "a guest's browsing is not on any account's timeline");
    assert.equal((await svc.timeline({ visitorId: guestVisitor.id })).total, 1);
    for (let i = 0; i < 6; i++) { advance(60_000); await svc.pageView({ visitorKey: KEY_A, path: `/p${i}`, userId: "u1", ctx: desktop }); }
    await svc.onAccountEvent("ENROLLMENT", { userId: "u1" });
    advance(60_000);
    await svc.onLogin({ userId: "u1", authSessionId: "a1", ctx: fullCtx(KEY_A) });
    const all = await svc.timeline({ userId: "u1" });
    assert.equal(all.total, 8);
    assert.deepEqual([all.items[0].type, all.items[0].category], ["LOGIN_SUCCESS", "AUTH"], "newest first");
    assert.equal((await svc.timeline({ userId: "u1", types: "ENROLLMENT,LOGIN_SUCCESS" })).total, 2);
    assert.equal((await svc.timeline({ userId: "u1", types: "bogus,PAGE_VIEW" })).total, 6, "unknown types are ignored");
    assert.equal((await svc.timeline({ userId: "u1", category: "AUTH" })).total, 1);
    const mid = all.items[3].at as Date;
    assert.equal((await svc.timeline({ userId: "u1", from: mid })).total, 4);
    assert.equal((await svc.timeline({ userId: "u1", to: new Date(mid.getTime() - 1) })).total, 4);
    const page = await svc.timeline({ userId: "u1", page: 2, pageSize: 3 });
    assert.deepEqual([page.items.length, page.total, page.page], [3, 8, 2]);
    assert.ok(!JSON.stringify(all).includes("203.0.113.42"), "the activity timeline never exposes IP addresses");
  });
});

describe("login & security logs", () => {
  beforeEach(async () => {
    await svc.onLogin({ userId: "u1", authSessionId: "a1", ctx: fullCtx(KEY_A) });
    advance(1000);
    await svc.onLogin({ userId: "u2", authSessionId: "a2", ctx: { ...fullCtx(KEY_B, IPHONE), ip: "198.51.100.7" } });
    advance(1000);
    await svc.onLoginFailed({ identifier: "ghost@example.com", reason: "UNKNOWN_EMAIL", ctx: fullCtx(null) });
    await svc.onLogout({ authSessionId: "a1", userId: "u1", ctx: fullCtx(KEY_A) });
  });

  it("filters by status, user search, device and date; includes session status and last activity", async () => {
    assert.equal((await svc.security({ status: "success" }, true)).total, 2);
    assert.equal((await svc.security({ status: "failed" }, true)).total, 1);
    assert.equal((await svc.security({ search: "ghost" }, true)).total, 1, "search the typed email");
    assert.equal((await svc.security({ search: "asha" }, true)).total, 2, "search by account (login + logout)");
    assert.equal((await svc.security({ device: "mobile" }, true)).total, 1);
    assert.equal((await svc.security({ type: "LOGOUT" }, true)).total, 1);
    assert.equal((await svc.security({ from: new Date(db.now.getTime() + 60_000) }, true)).total, 0);
    const r = await svc.security({ status: "success" }, true);
    const u1 = r.items.find((i: any) => i.userId === "u1")!;
    const u2 = r.items.find((i: any) => i.userId === "u2")!;
    assert.deepEqual([u1.session?.status, u1.session?.endReason, u2.session?.status, u2.session?.canTerminate], ["ended", "LOGOUT", "active", true]);
    assert.ok(u2.session?.lastActivityAt);
  });

  it("IP addresses are shown in full only to a Super Admin; everyone else gets the masked network", async () => {
    const full = await svc.security({ status: "success" }, true);
    const masked = await svc.security({ status: "success" }, false);
    assert.ok(full.items.some((i: any) => i.ip === "203.0.113.42") && full.items.every((i: any) => i.ipMasked === false));
    assert.ok(masked.items.every((i: any) => i.ipMasked === true && /\.xxx$/.test(i.ip)));
    assert.ok(!JSON.stringify(masked).includes("203.0.113.42") && !JSON.stringify(masked).includes("198.51.100.7"));
  });

  it("paginates", async () => {
    const p = await svc.security({ page: 1, pageSize: 2 }, true);
    assert.deepEqual([p.items.length, p.total], [2, 4]);
  });
});

describe("terminating a session", () => {
  const admin = { id: "admin1", email: "admin@example.com", isSuperAdmin: false };

  it("deletes the refresh token, blocks the access token, ends the session, records an event and an audit entry, and tells the browser", async () => {
    db.authSessions = [{ id: "a1" }, { id: "other" }];
    await svc.pageView({ visitorKey: KEY_A, path: "/dashboard", userId: "u1", ctx: desktop });
    await svc.onLogin({ userId: "u1", authSessionId: "a1", ctx: fullCtx(KEY_A) });
    const sid = db.sessions[0].id;
    assert.equal(await isAuthSessionRevoked("a1"), false);
    assert.deepEqual(await svc.terminateSession(sid, admin), { terminated: true, sessionId: sid });
    assert.deepEqual(db.authSessions.map((s) => s.id), ["other"], "only that sign-in's refresh token is removed");
    assert.equal(await isAuthSessionRevoked("a1"), true);
    assert.deepEqual([db.sessions[0].endReason, db.sessions[0].endedAt !== null], ["TERMINATED", true]);
    assert.ok(db.events.some((e) => e.type === "SESSION_TERMINATED" && e.userId === "u1" && e.metadata.byAdminId === "admin1"));
    assert.deepEqual([db.audit[0].action, db.audit[0].targetUserId, db.audit[0].actorUserId], ["SESSION_TERMINATED", "u1", "admin1"]);
    // the still-running browser: a revoked token, or the next heartbeat after the revocation expired from memory, says "terminated"
    assert.equal((await svc.heartbeat({ visitorKey: KEY_A, userId: "u1", revoked: true, ctx: desktop })).terminated, true);
    clearRevocations();
    assert.equal((await svc.heartbeat({ visitorKey: KEY_A, userId: "u1", ctx: desktop })).terminated, true);
    assert.equal(db.sessions.filter((s) => s.endedAt === null).length, 0, "a terminated browser does not silently open a new session");
    // signing in again later works normally
    await svc.onLogin({ userId: "u1", authSessionId: "a9", ctx: fullCtx(KEY_A) });
    assert.equal((await svc.heartbeat({ visitorKey: KEY_A, userId: "u1", ctx: desktop })).terminated, undefined);
  });

  it("guests, already-ended sessions, unknown ids and your own session cannot be terminated", async () => {
    await svc.pageView({ visitorKey: KEY_B, path: "/", ctx: phone });
    await assert.rejects(svc.terminateSession(db.sessions[0].id, admin), /no sign-in to terminate/);
    await assert.rejects(svc.terminateSession("missing", admin), /not found/);
    await svc.onLogin({ userId: "admin1", authSessionId: "own", ctx: fullCtx("visitor-key-ddddddddddddddddd4") });
    const own = db.sessions.find((s) => s.userId === "admin1")!;
    await assert.rejects(svc.terminateSession(own.id, admin), /your own session/);
    await svc.onLogin({ userId: "u1", authSessionId: "a1", ctx: fullCtx(KEY_A) });
    const s = db.sessions.find((x) => x.userId === "u1")!;
    s.endedAt = new Date();
    await assert.rejects(svc.terminateSession(s.id, admin), /already ended/);
  });

  it("only a Super Admin can terminate a Super Admin's session", async () => {
    await svc.onLogin({ userId: "boss", authSessionId: "b1", ctx: fullCtx(KEY_A) });
    const sid = db.sessions[0].id;
    await assert.rejects(svc.terminateSession(sid, admin), /Only a Super Admin/);
    assert.equal(db.sessions[0].endedAt, null);
    db.authSessions = [{ id: "b1" }];
    await svc.terminateSession(sid, { ...admin, isSuperAdmin: true });
    assert.equal(db.sessions[0].endReason, "TERMINATED");
  });
});

describe("terminated sign-ins are revoked across instances and restarts (shared database, not memory)", () => {
  const admin = { id: "admin1", email: "admin@example.com", isSuperAdmin: false };
  it("another instance (empty memory) learns of the termination from the database", async () => {
    db.authSessions = [{ id: "a1" }];
    await svc.onLogin({ userId: "u1", authSessionId: "a1", ctx: fullCtx(KEY_A) });
    await svc.terminateSession(db.sessions[0].id, admin);
    clearRevocations(); // a different instance, or this one after a restart
    assert.equal(await isAuthSessionRevoked("a1"), true);
    assert.equal(await isAuthSessionRevoked("never-terminated"), false);
  });
  it("termination is ATOMIC: if the refresh token cannot be deleted, NOTHING changes (still active, still refreshable, not revoked) and the admin gets a retryable 503", async () => {
    db.authSessions = [{ id: "a1" }, { id: "other" }];
    await svc.onLogin({ userId: "u1", authSessionId: "a1", ctx: fullCtx(KEY_A) });
    await svc.onLogin({ userId: "u2", authSessionId: "other", ctx: fullCtx(KEY_B) });
    const target = db.sessions.find((s) => s.userId === "u1")!;
    db.failRefreshDelete = new Error("connection lost");
    await assert.rejects(svc.terminateSession(target.id, admin), (e: any) => e.statusCode === 503 && /nothing was changed/.test(e.message));
    const after = () => db.sessions.find((s) => s.id === target.id)!; // re-read: the failed transaction was rolled back
    assert.equal(after().endedAt, null, "the session was NOT marked terminated");
    assert.equal(after().endReason, null);
    assert.deepEqual(db.authSessions.map((s) => s.id).sort(), ["a1", "other"], "the refresh token was NOT deleted");
    assert.equal(await isAuthSessionRevoked("a1"), false, "not revoked: the person keeps their session");
    assert.ok(!db.events.some((e) => e.type === "SESSION_TERMINATED"), "no false audit trail");
    assert.equal(db.audit.length, 0);
    // a retry (database back) completes it in full
    await svc.terminateSession(target.id, admin);
    assert.deepEqual([after().endReason, db.authSessions.map((s) => s.id), await isAuthSessionRevoked("a1")], ["TERMINATED", ["other"], true]);
    assert.equal(db.sessions.find((s) => s.userId === "u2")!.endedAt, null, "an unrelated session is untouched");
  });
  it("two administrators terminating the same session at once: exactly one succeeds, the other gets a clean 409, and there is one event", async () => {
    db.authSessions = [{ id: "a1" }];
    await svc.onLogin({ userId: "u1", authSessionId: "a1", ctx: fullCtx(KEY_A) });
    const sid = db.sessions[0].id;
    const results = await Promise.allSettled([svc.terminateSession(sid, admin), svc.terminateSession(sid, { ...admin, id: "admin2" })]);
    assert.deepEqual(results.map((r) => r.status).sort(), ["fulfilled", "rejected"]);
    assert.equal((results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason.statusCode, 409);
    assert.equal(db.events.filter((e) => e.type === "SESSION_TERMINATED").length, 1);
    assert.equal(db.authSessions.length, 0);
  });
  it("a token whose session ended normally (logout) is not treated as terminated", async () => {
    await svc.onLogin({ userId: "u1", authSessionId: "a1", ctx: fullCtx(KEY_A) });
    await svc.onLogout({ authSessionId: "a1", userId: "u1", ctx: fullCtx(KEY_A) });
    clearRevocations();
    assert.equal(await isAuthSessionRevoked("a1"), false);
  });
});

describe("every sign-in is its own terminable session", () => {
  const admin = { id: "admin1", email: "admin@example.com", isSuperAdmin: false };

  it("two sign-ins on the SAME browser are two sessions with their own refresh tokens; terminating one never leaves the other's behind", async () => {
    db.authSessions = [{ id: "first" }, { id: "second" }];
    await svc.onLogin({ userId: "u1", authSessionId: "first", ctx: fullCtx(KEY_A) });
    advance(60_000);
    await svc.onLogin({ userId: "u1", authSessionId: "second", ctx: fullCtx(KEY_A) });
    assert.equal(db.sessions.length, 2, "not one shared row that forgets the first refresh token");
    assert.deepEqual(db.sessions.map((s) => s.authSessionId).sort(), ["first", "second"]);
    const firstRow = db.sessions.find((s) => s.authSessionId === "first")!;
    await svc.terminateSession(firstRow.id, admin);
    assert.deepEqual(db.authSessions.map((s) => s.id), ["second"], "only the terminated sign-in's refresh token was removed");
    assert.equal(await isAuthSessionRevoked("first"), true);
    assert.equal(await isAuthSessionRevoked("second"), false, "the other sign-in is untouched");
    const secondRow = db.sessions.find((s) => s.authSessionId === "second")!;
    assert.equal(secondRow.endedAt, null);
    await svc.terminateSession(secondRow.id, admin); // and it can be terminated in its own right
    assert.deepEqual([db.authSessions.length, await isAuthSessionRevoked("second")], [0, true]);
  });

  it("repeating the SAME sign-in (same refresh token) does not create another session", async () => {
    await svc.onLogin({ userId: "u1", authSessionId: "same", ctx: fullCtx(KEY_A) });
    await svc.onLogin({ userId: "u1", authSessionId: "same", ctx: fullCtx(KEY_A) });
    assert.equal(db.sessions.length, 1);
  });

  it("a sign-in that merely went IDLE (refresh token still valid) can still be terminated; logout, expiry and a prior termination are final (409)", async () => {
    db.authSessions = [{ id: "idle" }, { id: "gone" }, { id: "out" }];
    await svc.onLogin({ userId: "u1", authSessionId: "idle", ctx: fullCtx(KEY_A) });
    await svc.onLogin({ userId: "u1", authSessionId: "gone", ctx: fullCtx(KEY_B) });
    await svc.onLogin({ userId: "u2", authSessionId: "out", ctx: fullCtx("visitor-key-ddddddddddddddddd4") });
    await svc.onLogout({ authSessionId: "out", userId: "u2", ctx: fullCtx(null) });
    db.authSessions = db.authSessions.filter((s) => s.id !== "gone"); // its refresh token expired
    advance(31 * 60_000);
    await svc.closeIdleSessions();
    const by = (id: string) => db.sessions.find((s) => s.authSessionId === id)!;
    assert.deepEqual([by("idle").endReason, by("gone").endReason, by("out").endReason], ["TIMEOUT", "EXPIRED", "LOGOUT"]);
    const list = await svc.listSessions({ status: "offline" });
    const can = (id: string) => (list.items.find((i: any) => i.id === by(id).id) as any)?.canTerminate;
    assert.deepEqual([can("idle"), can("gone"), can("out")], [true, false, false], "only the idle-but-still-signed-in one offers Terminate");
    const endedAt = by("idle").endedAt;
    await svc.terminateSession(by("idle").id, admin);
    assert.deepEqual([by("idle").endReason, by("idle").endedAt, db.authSessions.some((s) => s.id === "idle"), await isAuthSessionRevoked("idle")], ["TERMINATED", endedAt, false, true]);
    await assert.rejects(svc.terminateSession(by("gone").id, admin), /already ended/);
    await assert.rejects(svc.terminateSession(by("out").id, admin), /already ended/);
    await assert.rejects(svc.terminateSession(by("idle").id, admin), /already ended/);
  });
});

describe("privacy: redaction, feature events and retention", () => {
  it("feature events only accept whitelisted types, and secrets in metadata are dropped before storage", async () => {
    await assert.rejects(svc.feature({ visitorKey: KEY_A, type: "PAYMENT", ctx: desktop }), /Unsupported event type/);
    await assert.rejects(svc.feature({ visitorKey: KEY_A, type: "LOGIN_SUCCESS", ctx: desktop }), /Unsupported event type/);
    await svc.feature({
      visitorKey: KEY_A, type: "FEATURE_USED", path: "/tools", ctx: desktop,
      metadata: { feature: "chatbot", password: "hunter2", access_token: "AAA", nested: { otp: "123456", ok: "yes", cookie: "c=1" }, card_number: "4111", note: "x".repeat(500) },
    });
    const meta = db.events.find((e) => e.type === "FEATURE_USED")!.metadata;
    assert.equal(meta.feature, "chatbot");
    assert.deepEqual(meta.nested, { ok: "yes" });
    assert.ok(meta.note.length <= 201);
    const stored = JSON.stringify(db.events);
    for (const secret of ["hunter2", "AAA", "123456", "c=1", "4111"]) assert.ok(!stored.includes(secret), `${secret} must not be stored`);
  });

  it("retention: old activity and old security records are deleted on their own schedules; guests' stale visitors go, linked users' stay", async () => {
    const old = (days: number) => new Date(db.now.getTime() - days * 86_400_000);
    db.events = [
      { id: "e1", category: "ACTIVITY", type: "PAGE_VIEW", createdAt: old(200) }, { id: "e2", category: "ACTIVITY", type: "PAGE_VIEW", createdAt: old(10) },
      { id: "e3", category: "AUTH", type: "LOGIN_SUCCESS", createdAt: old(200) }, { id: "e4", category: "AUTH", type: "LOGIN_SUCCESS", createdAt: old(400) },
    ];
    db.visitors = [{ id: "v1", visitorKey: "k1", userId: null, lastSeenAt: old(200) }, { id: "v2", visitorKey: "k2", userId: "u1", lastSeenAt: old(200) }, { id: "v3", visitorKey: "k3", userId: null, lastSeenAt: old(1) }];
    db.sessions = [{ id: "s1", endedAt: old(199), startedAt: old(200) }, { id: "s2", endedAt: null, startedAt: old(200) }, { id: "s3", endedAt: old(1), startedAt: old(1) }];
    const r = await svc.purge();
    assert.deepEqual(db.events.map((e) => e.id).sort(), ["e2", "e3"], "activity kept 180d, security kept 365d");
    assert.deepEqual(db.visitors.map((v) => v.id).sort(), ["v2", "v3"]);
    assert.deepEqual(db.sessions.map((s) => s.id).sort(), ["s2", "s3"]);
    assert.deepEqual(r, { events: 2, sessions: 1, visitors: 1 });
  });

  it("the retention periods and online timeout come from the environment", () => {
    const c = monitoringConfig({ MONITORING_RETENTION_DAYS: "30", MONITORING_SECURITY_RETENTION_DAYS: "90", MONITORING_ONLINE_TIMEOUT_SECONDS: "45", MONITORING_SESSION_IDLE_MINUTES: "10" });
    assert.deepEqual([c.retentionDays, c.securityRetentionDays, c.onlineTimeoutSeconds, c.sessionIdleMinutes, c.enabled], [30, 90, 45, 10, true]);
    assert.equal(monitoringConfig({ MONITORING_ENABLED: "false" }).enabled, false);
    assert.equal(monitoringConfig({ MONITORING_RETENTION_DAYS: "garbage" }).retentionDays, 180);
  });
});

void nid;
