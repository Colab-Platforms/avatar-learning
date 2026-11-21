// Proves the development test login cannot reach real data or real admin APIs, using the REAL mounted route table
// (src/routes.ts) with the feature ENABLED. DATABASE_URL points at an unreachable address and no external integration
// is configured, so even a bug here could not read or write any database or send anything.
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";

const REAL_SECRET = "isolation_real_jwt_secret_value";
const DEV_PASSWORD = "isolation-dev-password-1";
Object.assign(process.env, {
  NODE_ENV: "development",
  DEV_TEST_LOGIN: "true",
  DEV_TEST_LOGIN_PASSWORD: DEV_PASSWORD,
  JWT_SECRET: REAL_SECRET,
  DATABASE_URL: "postgresql://nobody:nothing@127.0.0.1:1/none", // unreachable: any real query fails
});
for (const k of ["RESEND_API_KEY", "SMTP_FROM_EMAIL", "WHATSAPP_ENABLED", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_OUTBOUND_ENABLED", "BUSINESS_ADMIN_EMAILS", "RAZORPAY_KEY_ID", "GROQ_API_KEY"]) delete process.env[k];

let server: Server;
let port = 0;
let devToken = "";

const request = (method: string, p: string, opts: { token?: string; body?: unknown; headers?: Record<string, string> } = {}) =>
  new Promise<{ status: number; json: any }>((resolve, reject) => {
    const payload = opts.body === undefined ? undefined : JSON.stringify(opts.body);
    const headers: Record<string, string> = { ...(opts.headers ?? {}) };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
    if (payload !== undefined) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = String(Buffer.byteLength(payload));
    }
    const req = http.request({ host: "127.0.0.1", port, path: p, method, headers }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        let json: any = null;
        try {
          json = JSON.parse(raw);
        } catch {
          /* not JSON */
        }
        resolve({ status: res.statusCode ?? 0, json });
      });
    });
    req.on("error", reject);
    if (payload !== undefined) req.write(payload);
    req.end();
  });

// ─── route table (parsed from source and cross-checked against the live Express router) ─────────────────────────────
const SRC = path.resolve(process.cwd(), "src");
interface Endpoint {
  method: string;
  url: string;
  file: string;
}

function parseRouteTable(): Endpoint[] {
  const routesSrc = fs.readFileSync(path.join(SRC, "routes.ts"), "utf8");
  const out: Endpoint[] = [];
  const param = (u: string) => u.replace(/:[A-Za-z]+/g, "x1234567890abc");

  /** Collects `router.<method>("/x")` routes of a file and follows `router.use("/sub", importedRouter)` mounts. */
  const scan = (file: string, prefix: string, seen: Set<string>) => {
    const key = `${file}|${prefix}`;
    if (seen.has(key) || !fs.existsSync(file)) return;
    seen.add(key);
    const src = fs.readFileSync(file, "utf8");
    const dir = path.dirname(file);
    for (const r of src.matchAll(/\brouter\s*\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g)) {
      out.push({ method: r[1].toUpperCase(), url: param(`/api${prefix}${r[2] === "/" ? "" : r[2]}`), file: path.relative(SRC, file) });
    }
    const imports = new Map<string, string>();
    for (const m of src.matchAll(/import (\w+) from "(\.[^"]+)\.js";/g)) imports.set(m[1], path.join(dir, `${m[2]}.ts`));
    for (const m of src.matchAll(/router\.use\(\s*"([^"]+)"\s*,\s*(\w+)\s*\)/g)) {
      const target = imports.get(m[2]);
      if (target) scan(target, `${prefix}${m[1]}`, seen);
    }
    // route files that only create the router elsewhere (factory pattern): <name>.route.ts -> <name>.router.ts
    const factory = file.replace(/\.route\.ts$/, ".router.ts");
    if (factory !== file) scan(factory, prefix, seen);
  };

  const importFile = new Map<string, string>();
  for (const m of routesSrc.matchAll(/import (\w+) from "\.\/(modules\/[^"]+)\.js";/g)) importFile.set(m[1], path.join(SRC, `${m[2]}.ts`));
  for (const m of routesSrc.matchAll(/router\.(get|post|put|patch|delete)\("([^"]+)"/g)) out.push({ method: m[1].toUpperCase(), url: `/api${m[2]}`, file: "routes.ts" });
  const seen = new Set<string>();
  for (const m of routesSrc.matchAll(/router\.use\("([^"]+)",\s*(\w+)\)/g)) {
    const file = importFile.get(m[2]);
    if (file) scan(file, m[1], seen);
  }
  // Named router exports (the AI Adoption module): alias -> { file, exported variable }. Each export is scanned for its own
  // `<exported>.<method>("/path")` routes under the prefix it is mounted at.
  const named = new Map<string, { file: string; exported: string }>();
  for (const m of routesSrc.matchAll(/import \{([^}]+)\} from "\.\/(modules\/[^"]+)\.js";/g)) {
    for (const part of m[1].split(",")) {
      const [exported, alias] = part.trim().split(/\s+as\s+/);
      if (exported) named.set((alias ?? exported).trim(), { file: path.join(SRC, `${m[2]}.ts`), exported: exported.trim() });
    }
  }
  for (const m of routesSrc.matchAll(/router\.use\("([^"]+)",\s*(\w+)\)/g)) {
    const target = named.get(m[2]);
    if (!target || !fs.existsSync(target.file)) continue;
    const src = fs.readFileSync(target.file, "utf8");
    const re = new RegExp(`\\b${target.exported}\\s*\\.(get|post|put|patch|delete)\\(\\s*["'\`]([^"'\`]+)["'\`]`, "g");
    for (const r of src.matchAll(re)) out.push({ method: r[1].toUpperCase(), url: param(`/api${m[1]}${r[2] === "/" ? "" : r[2]}`), file: path.relative(SRC, target.file) });
  }
  return out;
}

/** Counts route layers in the live router (any depth), so the parser above cannot silently miss routes. */
function countLiveRoutes(stack: any[]): number {
  let n = 0;
  for (const layer of stack) {
    if (layer.route) n += Object.keys(layer.route.methods ?? {}).filter((m) => m !== "_all").length;
    else if (layer.handle?.stack) n += countLiveRoutes(layer.handle.stack);
  }
  return n;
}

let liveCount = 0;
before(async () => {
  const express = (await import("express")).default;
  const sanitize = (await import("../../src/middlewares/sanitize.js")).default;
  const { errorHandler } = await import("../../src/middlewares/errorHandler.js");
  const { notFoundHandler } = await import("../../src/middlewares/notFoundHandler.js");
  const routes = (await import("../../src/routes.js")).default;
  liveCount = countLiveRoutes((routes as any).stack);
  const app = express();
  app.use(express.json({ verify: (req: any, _res, buf) => void (req.rawBody = buf.toString("utf8")) }));
  app.use(sanitize);
  app.use("/api", routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  port = (server.address() as AddressInfo).port;
  const login = await request("POST", "/api/business-admin/dev-login", { body: { email: "adaption.test@localhost.test", password: DEV_PASSWORD } });
  assert.equal(login.status, 200, "the dev login works from loopback in this setup (this is the enabled-state test)");
  devToken = login.json.data.accessToken;
});
after(() => new Promise<void>((resolve) => server.close(() => resolve())));

// Routes that are PUBLIC by design (they answer without a token). Anything else must refuse a dev token with 401/403.
const PUBLIC = [
  /^GET \/api\/health$/,
  /^(GET|POST) \/api\/auth\//,
  /^POST \/api\/contact$/,
  /^POST \/api\/chatbot/,
  /^DELETE \/api\/chatbot\//,
  /^GET \/api\/chatbot\/health$/,
  /^GET \/api\/investors/,
  /^GET \/api\/courses/,
  /^GET \/api\/webinar/,
  /^POST \/api\/webinar/,
  /^GET \/api\/internships/,
  /^GET \/api\/coupons/,
  /^(GET|POST) \/api\/payment\/(webhook|cashfree|razorpay)/,
  /^(GET|POST) \/api\/whatsapp\/webhook$/,
  // Email Automation: Resend delivery webhook (401 unless its Svix signature verifies) and the unsubscribe link (400 unless
  // its HMAC token verifies; GET only shows a confirm page). Neither uses a bearer token.
  /^POST \/api\/email-automation\/webhook$/,
  /^(GET|POST) \/api\/email-automation\/unsubscribe$/,
  /^POST \/api\/business-admin\/dev-login$/,
  // Reviewed (from main): the AI Adoption customer site has its OWN accounts, separate from this platform's users.
  // Sign-up, sign-in (email and Google), email verification and password reset must be public; each is rate limited and
  // none reads or honours this platform's JWTs, so a dev token neither helps nor harms there. The demo form is public too
  // (customers are not signed in); it only validates and saves a request, and links an account solely via a valid
  // adoption session.
  /^POST \/api\/adoption\/auth\/(register|verify-email|resend-verification|login|google|forgot-password|reset-password)$/,
  /^POST \/api\/adoption\/demo-requests$/,
  // Reviewed: public by design in the existing code. POST /api/users creates a plain USER only (no role field in its
  // schema); /api/payment/config returns only the payment provider name. Neither is affected by the dev token.
  /^POST \/api\/users$/,
  /^GET \/api\/payment\/config$/,
];
const isPublic = (e: Endpoint) => PUBLIC.some((re) => re.test(`${e.method} ${e.url}`));

describe("dev test login vs the real route table (feature ENABLED)", () => {
  it("the route table parser sees every route in the live router (nothing is silently skipped)", () => {
    const parsed = parseRouteTable();
    assert.ok(parsed.length > 100, `parsed ${parsed.length} routes`);
    // routes.ts mounts sub-routers; the live count includes the same set. A mismatch means the parser missed a pattern.
    const outsideBusinessAdmin = parsed.filter((e) => !e.url.startsWith("/api/business-admin")).length;
    // The live router hides /business-admin behind the dev dispatcher closure and exposes only its dev-login route;
    // every other route must match exactly, so the table used below is complete.
    assert.equal(outsideBusinessAdmin + 1, liveCount, `parsed ${outsideBusinessAdmin} (+dev-login) vs live ${liveCount}`);
  });

  it("EVERY /api/admin/* (Learning Admin) route refuses the dev token with 401", async () => {
    const admin = parseRouteTable().filter((e) => e.url.startsWith("/api/admin/") || e.url === "/api/admin");
    assert.ok(admin.length > 40, `expected many admin routes, found ${admin.length}`);
    const wrong: string[] = [];
    for (const e of admin) {
      const r = await request(e.method, e.url, { token: devToken, body: e.method === "GET" || e.method === "DELETE" ? undefined : {} });
      if (r.status !== 401) wrong.push(`${e.method} ${e.url} -> ${r.status}`);
    }
    assert.deepEqual(wrong, []);
  });

  it("every non-public route in the whole API refuses the dev token (401/403), and nothing unexpected is open", async () => {
    const all = parseRouteTable().filter((e) => !e.url.startsWith("/api/business-admin"));
    const unexpectedlyOpen: string[] = [];
    let refused = 0;
    for (const e of all) {
      const r = await request(e.method, e.url, { token: devToken, body: e.method === "GET" || e.method === "DELETE" ? undefined : {} });
      if (r.status === 401 || r.status === 403) refused++;
      else if (!isPublic(e)) unexpectedlyOpen.push(`${e.method} ${e.url} -> ${r.status}`);
    }
    assert.deepEqual(unexpectedlyOpen, [], "a route answered a dev token but is not on the reviewed public list");
    assert.ok(refused > 80, `only ${refused} protected routes refused the dev token`);
  });

  it("the dev token is NOT valid for the real verifier: jwt.verify with the real secret rejects it", () => {
    assert.throws(() => jwt.verify(devToken, REAL_SECRET));
    assert.throws(() => jwt.verify(devToken, REAL_SECRET, { algorithms: ["HS256"], audience: "adaption-devtest" }));
  });

  it("on /api/business-admin the dev token is served by the IN-MEMORY sandbox, never the real store", async () => {
    const ov = await request("GET", "/api/business-admin/overview", { token: devToken });
    assert.equal(ov.status, 200);
    // Only the sandbox claims sending is 'ready'; the real config here has no WhatsApp variables at all.
    assert.equal(ov.json.data.integrations.whatsapp.outboundSending, "ready");
    const list = await request("GET", "/api/business-admin/whatsapp/conversations", { token: devToken });
    assert.equal(list.status, 200);
    assert.ok(list.json.data.items.length > 0 && list.json.data.items.every((c: any) => /^1555555010\d$/.test(c.contactWaId)), "only fictional 555-01xx contacts");
    const me = await request("GET", "/api/business-admin/me", { token: devToken });
    assert.equal(me.json.data.isSuperAdmin, false);
    assert.ok(!me.json.data.modules.includes("admins"), "the sandbox never has Admin Management");
  });

  it("the dev token cannot reach Admin Management or any real-account feature", async () => {
    for (const [m, p, body] of [
      ["GET", "/api/business-admin/admins", undefined],
      ["GET", "/api/business-admin/admins/meta", undefined],
      ["POST", "/api/business-admin/admins", { name: "Evil Admin", email: "evil@example.com", password: "Violet!Marble#8472Orbit", roleKey: "MANAGER" }],
      ["PATCH", "/api/business-admin/admins/x1234567890abc", { isActive: false }],
      ["POST", "/api/business-admin/admins/x1234567890abc/reset-password", { password: "Violet!Marble#8472Orbit" }],
    ] as const) {
      const r = await request(m, p, { token: devToken, body });
      assert.equal(r.status, 404, `${m} ${p} -> ${r.status}`);
    }
  });

  it("real tokens are never served by the sandbox: they reach the real store (unreachable here, so a generic error)", async () => {
    for (const role of ["SUPERADMIN", "ADMIN"] as const) {
      const real = jwt.sign({ id: "real-user-1", role }, REAL_SECRET, { expiresIn: "5m" });
      const r = await request("GET", "/api/business-admin/whatsapp/conversations", { token: real });
      assert.notEqual(r.status, 200, "a real token must not be answered with sandbox data");
      assert.ok(!JSON.stringify(r.json).includes("1555555010"), "no sandbox contacts for real tokens");
    }
  });

  it("a token forged with the REAL secret that claims to be the dev identity is not treated as a dev token", async () => {
    const forged = jwt.sign({ id: "devtest-adaption-0001", role: "ADMIN", devTest: true }, REAL_SECRET, { audience: "adaption-devtest", issuer: "avatar-adaption-devtest", expiresIn: "5m" });
    const r = await request("GET", "/api/business-admin/whatsapp/conversations", { token: forged });
    assert.notEqual(r.status, 200);
    assert.ok(!JSON.stringify(r.json).includes("1555555010"));
  });

  it("sandbox actions stay in the sandbox: sending 'works' offline, notes and assignment do not touch the real store", async () => {
    const t = { token: devToken };
    const send = await request("POST", "/api/business-admin/whatsapp/conversations/15555550101/messages", { ...t, body: { text: "sandbox only", clientRequestId: "iso-req-0001" } });
    assert.equal(send.status, 201);
    assert.ok(String(send.json.data.message.id).length > 0);
    // The unreachable real database was never needed, which proves nothing was sent through a real client either.
    const note = await request("POST", "/api/business-admin/whatsapp/conversations/15555550101/notes", { ...t, body: { body: "note" } });
    assert.equal(note.status, 201);
  });
});

describe("dev login is only reachable by a direct local connection", () => {
  const body = { email: "adaption.test@localhost.test", password: DEV_PASSWORD };
  const login = (headers: Record<string, string>) => request("POST", "/api/business-admin/dev-login", { body, headers });

  it("accepts a plain local request", async () => {
    assert.equal((await login({})).status, 200);
  });

  for (const header of ["X-Forwarded-For", "X-Forwarded-Host", "X-Forwarded-Proto", "X-Real-IP", "Forwarded", "Via", "CF-Connecting-IP", "CF-Ray", "True-Client-IP"]) {
    it(`refuses (404) a request carrying ${header}, as a proxy or tunnel would add`, async () => {
      assert.equal((await login({ [header]: "203.0.113.9" })).status, 404);
    });
  }

  it("refuses (404) a request whose Host is a public name (tunnel that forwards from localhost without proxy headers)", async () => {
    assert.equal((await login({ Host: "my-dev-box.ngrok.app" })).status, 404);
    assert.equal((await login({ Host: "avatar-learning-whatsapp-dev.onrender.com" })).status, 404);
  });

  it("accepts localhost / 127.0.0.1 Host values with a port", async () => {
    assert.equal((await login({ Host: `localhost:${port}` })).status, 200);
    assert.equal((await login({ Host: `127.0.0.1:${port}` })).status, 200);
  });
});
