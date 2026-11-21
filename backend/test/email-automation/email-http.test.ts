// HTTP-level checks of the real route table: admin email routes need Business Admin access, public routes reject bad input.
// DATABASE_URL points at an unreachable address and no Resend key is set, so nothing real can be read, written or sent.
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";

const SECRET = "email_http_test_jwt_secret";
const WEBHOOK_SECRET = `whsec_${crypto.randomBytes(24).toString("base64")}`;
Object.assign(process.env, {
  NODE_ENV: "test",
  JWT_SECRET: SECRET,
  RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET,
  DATABASE_URL: "postgresql://nobody:nothing@127.0.0.1:1/none",
});
for (const k of ["RESEND_API_KEY", "SMTP_FROM_EMAIL", "BUSINESS_ADMIN_EMAILS", "DEV_TEST_LOGIN", "EMAIL_AUTOMATION_ENABLED"]) delete process.env[k];

let server: Server;
let port = 0;

const request = (method: string, path: string, opts: { headers?: Record<string, string>; body?: string } = {}) =>
  new Promise<{ status: number; text: string }>((resolve, reject) => {
    const headers: Record<string, string> = { ...(opts.headers ?? {}) };
    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = String(Buffer.byteLength(opts.body));
    }
    const req = http.request({ host: "127.0.0.1", port, path, method, headers }, (res) => {
      let text = "";
      res.on("data", (c) => (text += c));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, text }));
    });
    req.on("error", reject);
    if (opts.body !== undefined) req.write(opts.body);
    req.end();
  });

before(async () => {
  const express = (await import("express")).default;
  const { errorHandler } = await import("../../src/middlewares/errorHandler.js");
  const { notFoundHandler } = await import("../../src/middlewares/notFoundHandler.js");
  const routes = (await import("../../src/routes.js")).default;
  const app = express();
  app.use(express.json({ verify: (req: any, _res, buf) => void (req.rawBody = buf.toString("utf8")) }));
  app.use("/api", routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  port = (server.address() as AddressInfo).port;
});
after(() => server?.close());

describe("admin email routes are protected", () => {
  const routes: [string, string][] = [
    ["GET", "/api/business-admin/email/status"],
    ["POST", "/api/business-admin/email/check"],
    ["GET", "/api/business-admin/email/stats"],
    ["GET", "/api/business-admin/email/templates"],
    ["POST", "/api/business-admin/email/templates"],
    ["PUT", "/api/business-admin/email/templates/abcdefgh1"],
    ["DELETE", "/api/business-admin/email/templates/abcdefgh1"],
    ["POST", "/api/business-admin/email/templates/abcdefgh1/test"],
    ["POST", "/api/business-admin/email/preview"],
    ["GET", "/api/business-admin/email/automations"],
    ["POST", "/api/business-admin/email/automations"],
    ["PUT", "/api/business-admin/email/automations/abcdefgh1/active"],
    ["GET", "/api/business-admin/email/recipients"],
    ["POST", "/api/business-admin/email/send"],
    ["GET", "/api/business-admin/email/scheduled"],
    ["POST", "/api/business-admin/email/messages/abcdefgh1/cancel"],
    ["POST", "/api/business-admin/email/messages/abcdefgh1/retry"],
    ["GET", "/api/business-admin/email/activity"],
    ["GET", "/api/business-admin/email/templates/abcdefgh1"],
    ["PUT", "/api/business-admin/email/automations/abcdefgh1"],
    ["DELETE", "/api/business-admin/email/automations/abcdefgh1"],
    ["POST", "/api/business-admin/email/messages/abcdefgh1/resolve"],
  ];
  it("covers every email route the router registers", async () => {
    const src = fs.readFileSync("src/modules/business-admin/business-admin.router.ts", "utf8");
    const registered = [...src.matchAll(/router\.(?:get|post|put|delete|patch)\("\/email[^"]*"/g)].length;
    assert.equal(routes.length, registered, "add any new email route to this list so its protection is tested");
  });
  it("refuses requests with no token (401)", async () => {
    for (const [m, p] of routes) assert.equal((await request(m, p, m === "GET" ? {} : { body: "{}" })).status, 401, `${m} ${p}`);
  });
  it("refuses a plain USER token and a garbage token", async () => {
    const user = jwt.sign({ id: "u1", role: "USER" }, SECRET, { expiresIn: "5m" });
    for (const t of [user, "garbage"]) for (const [m, p] of routes) assert.ok([401, 403].includes((await request(m, p, { headers: { Authorization: `Bearer ${t}` }, ...(m === "GET" ? {} : { body: "{}" }) })).status), `${m} ${p}`);
  });
});

describe("Resend webhook endpoint", () => {
  const body = JSON.stringify({ type: "email.delivered", data: { email_id: "x" } });
  const ts = String(Math.floor(Date.now() / 1000));
  it("rejects a missing or wrong signature before touching anything", async () => {
    assert.equal((await request("POST", "/api/email-automation/webhook", { body })).status, 401);
    const bad = { "svix-id": "m1", "svix-timestamp": ts, "svix-signature": "v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" };
    assert.equal((await request("POST", "/api/email-automation/webhook", { body, headers: bad })).status, 401);
  });
  it("rejects a signature made with a different secret", async () => {
    const other = crypto.randomBytes(24);
    const sig = `v1,${crypto.createHmac("sha256", other).update(`m1.${ts}.${body}`).digest("base64")}`;
    assert.equal((await request("POST", "/api/email-automation/webhook", { body, headers: { "svix-id": "m1", "svix-timestamp": ts, "svix-signature": sig } })).status, 401);
  });
  it("answers 503 when no webhook secret is configured", async () => {
    const saved = process.env.RESEND_WEBHOOK_SECRET;
    delete process.env.RESEND_WEBHOOK_SECRET;
    assert.equal((await request("POST", "/api/email-automation/webhook", { body })).status, 503);
    process.env.RESEND_WEBHOOK_SECRET = saved;
  });
});

describe("unsubscribe endpoint", () => {
  it("GET and POST reject a missing or forged token and never change anything", async () => {
    assert.equal((await request("GET", "/api/email-automation/unsubscribe")).status, 400);
    assert.equal((await request("GET", "/api/email-automation/unsubscribe?u=abc&t=forged")).status, 400);
    assert.equal((await request("POST", "/api/email-automation/unsubscribe?u=abc&t=forged")).status, 400);
  });
  it("GET with a valid token only shows a confirm page (mail scanners prefetch links)", async () => {
    const { unsubscribeToken } = await import("../../src/modules/email-automation/email.lib.js");
    const r = await request("GET", `/api/email-automation/unsubscribe?u=user1&t=${unsubscribeToken("user1", SECRET)}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /<form method="post"/);
    assert.match(r.text, /Unsubscribe/);
  });
});
