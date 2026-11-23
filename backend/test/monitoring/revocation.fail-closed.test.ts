import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import jwt from "jsonwebtoken";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

// The REAL auth middleware (and the real revocation module) behind a tiny app, over a controllable "shared database".
process.env.JWT_SECRET = "test_jwt_secret_for_revocation_tests";
const SECRET = process.env.JWT_SECRET;
const { auth } = await import("../../src/middlewares/authMiddleware.js");
const { errorHandler } = await import("../../src/middlewares/errorHandler.js");
const { cacheSizes, clearRevocations, setRevocationLookup, setRevocationTimeout } = await import("../../src/modules/monitoring/session-revocation.js");
const { createTrackRouter } = await import("../../src/modules/monitoring/monitoring.route.js");
const { MonitoringService } = await import("../../src/modules/monitoring/monitoring.service.js");
const { monitoringConfig } = await import("../../src/modules/monitoring/monitoring.util.js");
const { FakeMonitoringDb } = await import("./fake-db.js");

/** The database every backend instance shares. */
const sharedDb = { terminated: new Set<string>(), down: false, hang: false, calls: [] as string[] };
const lookup = async (sid: string): Promise<boolean> => {
  sharedDb.calls.push(sid);
  if (sharedDb.hang) return new Promise<boolean>(() => undefined);
  if (sharedDb.down) throw new Error("connection refused");
  return sharedDb.terminated.has(sid);
};

let server: Server;
let base: string;
const tok = (o: { id?: string; role?: string; sid?: string; secret?: string; expiresIn?: string | number } = {}) =>
  jwt.sign({ id: o.id ?? "u1", role: o.role ?? "USER", ...(o.sid ? { sid: o.sid } : {}) }, o.secret ?? SECRET, { expiresIn: (o.expiresIn ?? "1h") as never });
const get = async (token?: string, path = "/me") => {
  const r = await fetch(base + path, { headers: token ? { authorization: `Bearer ${token}` } : {} });
  return { status: r.status, body: (await r.json().catch(() => ({}))) as any };
};

before(async () => {
  const app = express();
  app.use(express.json());
  app.get("/me", auth("USER"), (req, res) => res.json({ ok: true, id: (req as any).user.id }));
  app.get("/admin-only", auth("ADMIN"), (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  server = await new Promise<Server>((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => { setRevocationLookup(null); setRevocationTimeout(null); clearRevocations(); return new Promise<void>((r) => server.close(() => r())); });
beforeEach(() => {
  sharedDb.terminated.clear(); sharedDb.down = false; sharedDb.hang = false; sharedDb.calls.length = 0;
  clearRevocations();
  setRevocationTimeout(150);
  setRevocationLookup(lookup);
});

describe("session-bound tokens: fail closed when the database cannot verify", () => {
  it("database unavailable -> a temporary 503 (never 200), with a clear retryable message", async () => {
    sharedDb.down = true;
    const r = await get(tok({ sid: "s1" }));
    assert.equal(r.status, 503);
    assert.match(r.body.message, /could not verify your session.*try again/i);
    assert.ok(!/connection refused|ECONN|prisma|postgres/i.test(JSON.stringify(r.body)), "no internal detail leaks to the client");
  });

  it("database timeout (a hung database) -> 503 within the timeout, not a hung request", async () => {
    sharedDb.hang = true;
    const t0 = Date.now();
    const r = await get(tok({ sid: "s1" }));
    assert.equal(r.status, 503);
    assert.ok(Date.now() - t0 < 2000, `answered in ${Date.now() - t0}ms`);
  });

  it("the failure is NOT cached: the very next request asks again, and works the moment the database is back", async () => {
    sharedDb.down = true;
    assert.equal((await get(tok({ sid: "s1" }))).status, 503);
    assert.equal((await get(tok({ sid: "s1" }))).status, 503);
    assert.equal(sharedDb.calls.length, 2, "each request re-asked the database");
    assert.deepEqual(cacheSizes(), { revoked: 0, notRevoked: 0 });
    sharedDb.down = false;
    assert.equal((await get(tok({ sid: "s1" }))).status, 200, "recovered immediately, no waiting for a cache to expire");
  });

  it("a session that was TERMINATED is refused even if the database fails later (positive state is remembered)", async () => {
    sharedDb.terminated.add("dead");
    assert.equal((await get(tok({ sid: "dead" }))).status, 401);
    sharedDb.down = true;
    assert.equal((await get(tok({ sid: "dead" }))).status, 401, "still 401, not 503 and certainly not 200");
  });

  it("an unverifiable session cannot reach role-protected routes either", async () => {
    sharedDb.down = true;
    assert.equal((await get(tok({ sid: "s1", role: "ADMIN" }), "/admin-only")).status, 503);
  });
});

describe("terminated, active and unrelated sessions", () => {
  it("a terminated session is 401; an active one is 200; neither affects the other (same user, two devices)", async () => {
    sharedDb.terminated.add("phone");
    assert.equal((await get(tok({ sid: "phone" }))).status, 401);
    assert.equal((await get(tok({ sid: "laptop" }))).status, 200);
    assert.equal((await get(tok({ sid: "laptop", id: "someone-else" }))).status, 200);
  });

  it("during an outage, sessions verified moments ago keep working (inside the 10s window) while only UNVERIFIED ones get 503 - and nothing is revoked", async () => {
    assert.equal((await get(tok({ sid: "verified" }))).status, 200);
    sharedDb.down = true;
    assert.equal((await get(tok({ sid: "verified" }))).status, 200, "served from the verified cache");
    assert.equal((await get(tok({ sid: "never-seen" }))).status, 503, "unverifiable: temporary refusal");
    sharedDb.down = false;
    assert.equal((await get(tok({ sid: "never-seen" }))).status, 200, "and it was never revoked or blocked");
    assert.equal(sharedDb.terminated.size, 0);
  });
});

describe("multiple backend instances sharing one database", () => {
  it("a termination recorded by another instance is enforced here (fresh memory) as soon as this instance asks the database", async () => {
    assert.equal((await get(tok({ sid: "s9" }))).status, 200);
    sharedDb.terminated.add("s9"); // instance A terminated it
    clearRevocations(); // this is instance B with its own empty memory (or B after A's 10s window elapsed)
    assert.equal((await get(tok({ sid: "s9" }))).status, 401);
    assert.equal((await get(tok({ sid: "s9" }))).status, 401, "and remembered");
    assert.equal((await get(tok({ sid: "other-session" }))).status, 200, "unrelated sessions are unaffected");
  });
  it("two instances never disagree about a terminated session once both have asked the database", async () => {
    sharedDb.terminated.add("s7");
    for (const instance of ["A", "B", "C"]) {
      clearRevocations();
      assert.equal((await get(tok({ sid: "s7" }))).status, 401, `instance ${instance}`);
    }
  });
});

describe("legacy tokens (no session id) and forged tokens", () => {
  it("a token WITHOUT a sid never touches the revocation lookup and keeps its normal expiry behaviour, even while the database is down", async () => {
    sharedDb.down = true;
    assert.equal((await get(tok())).status, 200);
    assert.equal(sharedDb.calls.length, 0, "no lookup for tokens issued before this feature");
  });
  it("legacy tokens still go through every other check: role, expiry, signature, presence", async () => {
    assert.equal((await get(tok({ role: "USER" }), "/admin-only")).status, 403, "wrong role");
    assert.equal((await get(tok({ expiresIn: -10 }))).status, 401, "expired");
    assert.equal((await get(tok({ secret: "not-the-real-secret" }))).status, 401, "forged signature");
    assert.equal((await get(undefined)).status, 401, "no token");
    assert.equal((await get("garbage.token.value")).status, 401, "malformed");
    assert.equal(sharedDb.calls.length, 0);
  });
  it("a FORGED token claiming a sid is rejected on its signature BEFORE any database lookup (cannot be used to probe or to bypass)", async () => {
    sharedDb.down = true;
    assert.equal((await get(tok({ sid: "s1", secret: "attacker-secret" }))).status, 401, "401 (bad signature), not 503");
    assert.equal(sharedDb.calls.length, 0);
  });
  it("a legacy token is not revocable individually: it stays valid until it expires (the documented 1-day bound)", async () => {
    sharedDb.terminated.add("anything");
    assert.equal((await get(tok({ expiresIn: "23h" }))).status, 200);
  });
});

describe("the public tracker never breaks the website when verification is unavailable", () => {
  it("a heartbeat with a session-bound token during an outage answers 200 'not tracked' (no error page, no false 'terminated', nothing linked)", async () => {
    const db = new FakeMonitoringDb();
    const svc = new MonitoringService(db as never, () => db.now, () => ({ ...monitoringConfig({}), enabled: true }));
    const a = express();
    a.use(express.json());
    a.use("/t", createTrackRouter(svc, (_q, _s, n) => n()));
    const s: Server = await new Promise((r) => { const x = a.listen(0, "127.0.0.1", () => r(x)); });
    sharedDb.down = true;
    const r = await fetch(`http://127.0.0.1:${(s.address() as AddressInfo).port}/t/heartbeat`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${tok({ sid: "s1" })}` }, body: JSON.stringify({ visitorId: "visitor-key-aaaaaaaaaaaaaaaa1", path: "/" }) });
    const body = (await r.json()) as any;
    assert.deepEqual([r.status, body.data.tracked, body.data.terminated], [200, false, undefined]);
    assert.equal(db.visitors.length, 0);
    await new Promise<void>((x) => s.close(() => x()));
  });
});
