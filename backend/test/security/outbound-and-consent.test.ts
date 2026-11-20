import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { InboxService, outboundReady } from "../../src/modules/business-admin/inbox.service.js";
import { PrismaInboxStore } from "../../src/modules/business-admin/inbox.store.js";
import { InboxError } from "../../src/modules/business-admin/inbox.errors.js";
import { getWhatsappConfig } from "../../src/modules/whatsapp/whatsapp.config.js";
import { AdminFakeDb } from "../business-admin/admin-fakes.js";
import { FakeSender, PHONE, readyConfig } from "../business-admin/fakes.js";

const SRC = path.resolve(process.cwd(), "src");
const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".ts") ? [path.join(dir, e.name)] : []));
const files = walk(SRC).map((f) => ({ f: path.relative(SRC, f).replace(/\\/g, "/"), s: fs.readFileSync(f, "utf8") }));

describe("outbound WhatsApp is OFF by default", () => {
  const RECEIVE_ONLY = { WHATSAPP_ENABLED: "true", WHATSAPP_APP_SECRET: "s", WHATSAPP_WEBHOOK_VERIFY_TOKEN: "t", WHATSAPP_ACCESS_TOKEN: "tok", WHATSAPP_PHONE_NUMBER_ID: "123" } as NodeJS.ProcessEnv;

  it("an empty environment, a receive-only environment and a lone OUTBOUND flag are all NOT ready to send", () => {
    assert.equal(outboundReady(getWhatsappConfig({} as NodeJS.ProcessEnv)), false);
    assert.equal(outboundReady(getWhatsappConfig(RECEIVE_ONLY)), false, "a complete receiving setup (token, phone id) still does not send");
    assert.equal(outboundReady(getWhatsappConfig({ WHATSAPP_OUTBOUND_ENABLED: "true" } as NodeJS.ProcessEnv)), false, "the flag alone is not enough");
    assert.equal(outboundReady(getWhatsappConfig({ ...RECEIVE_ONLY, WHATSAPP_OUTBOUND_ENABLED: "yes" })), false, "only the exact string true counts");
    assert.equal(outboundReady(getWhatsappConfig({ ...RECEIVE_ONLY, WHATSAPP_OUTBOUND_ENABLED: "1" })), false);
    assert.equal(outboundReady(getWhatsappConfig({ ...RECEIVE_ONLY, WHATSAPP_OUTBOUND_ENABLED: "true" })), true, "all four together: ready");
  });

  it("every missing ingredient individually blocks sending", () => {
    const full = { ...RECEIVE_ONLY, WHATSAPP_OUTBOUND_ENABLED: "true" };
    for (const drop of ["WHATSAPP_ENABLED", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_OUTBOUND_ENABLED"]) {
      const env = { ...full } as Record<string, string | undefined>;
      delete env[drop];
      assert.equal(outboundReady(getWhatsappConfig(env as NodeJS.ProcessEnv)), false, `without ${drop}`);
    }
  });

  it(".env.example ships with sending off", () => {
    const example = fs.readFileSync(path.resolve(process.cwd(), ".env.example"), "utf8");
    assert.match(example, /^WHATSAPP_OUTBOUND_ENABLED=false\s*$/m);
    assert.match(example, /^WHATSAPP_ENABLED=false\s*$/m);
  });

  it("the service refuses and the sender is never called when only the receiving setup exists", async () => {
    const db = new AdminFakeDb();
    db.inbound(PHONE, "hi", new Date());
    const sender = new FakeSender();
    const service = new InboxService({ store: new PrismaInboxStore(db), sender, getConfig: () => getWhatsappConfig(RECEIVE_ONLY) });
    await assert.rejects(() => service.send({ contactWaId: PHONE, text: "hello", clientRequestId: "req-off-0001", userId: "u" }), (e: any) => e instanceof InboxError && e.code === "NOT_CONFIGURED");
    assert.equal(sender.calls.length, 0);
    assert.equal(db.messages.filter((m) => m.direction === "OUTBOUND").length, 0, "nothing was even saved");
  });

  it("there is exactly ONE code path that can call WhatsApp's send API, and it sits behind the inbox service", () => {
    const callers = files.filter((x) => /sendTextMessage\(|new WhatsappClient\(|graph\.facebook\.com/.test(x.s) && x.f !== "modules/whatsapp/whatsapp.client.ts").map((x) => x.f);
    assert.deepEqual(callers, ["modules/business-admin/business-admin.route.ts"]);
    const route = files.find((x) => x.f === "modules/business-admin/business-admin.route.ts")!.s;
    assert.match(route, /new InboxService\(\{[\s\S]*sender:/, "the real sender is only given to the inbox service");
    // The inbox service is the only user of a sender, and it checks readiness first.
    const senders = files.filter((x) => /\.sendText\(/.test(x.s)).map((x) => x.f);
    assert.deepEqual(senders, ["modules/business-admin/inbox.service.ts"]);
    // Nothing marks inbound messages as read on WhatsApp (that would also be an outbound call).
    assert.ok(!files.some((x) => /markMessageAsRead\(/.test(x.s) && x.f !== "modules/whatsapp/whatsapp.client.ts"));
  });

  it("the webhook and the cron jobs never send: no module outside the inbox imports the WhatsApp client", () => {
    const importers = files.filter((x) => /whatsapp\.client\.js/.test(x.s)).map((x) => x.f).sort();
    assert.deepEqual(importers, ["modules/business-admin/business-admin.route.ts", "modules/business-admin/devtest/devtest.router.ts", "modules/business-admin/inbox.errors.ts", "modules/business-admin/inbox.service.ts", "modules/business-admin/template-manager.service.ts", "modules/business-admin/templates.service.ts", "modules/whatsapp/whatsapp.media.ts"]);
    // Everything except the route may import only error classes / types from the client, never the sending class.
    for (const f of importers.filter((x) => x !== "modules/business-admin/business-admin.route.ts")) {
      const src = files.find((x) => x.f === f)!.s;
      for (const m of src.matchAll(/import\s+(type\s+)?\{([^}]+)\}\s+from\s+"[^"]*whatsapp\.client\.js"/g)) {
        const names = m[2].split(",").map((n) => n.trim()).filter(Boolean);
        assert.ok(m[1] || names.every((n) => /^(WhatsappApiError|type .+|TemplateDefinition|OutboundMediaKind)$/.test(n)), `${f} imports ${names.join(", ")} from the client`);
      }
    }
  });

  it("the dev sandbox sender is offline: it makes no network call", () => {
    const dev = files.find((x) => x.f === "modules/business-admin/devtest/devtest.router.ts")!.s;
    assert.ok(!/fetch\(|axios|https?:\/\//.test(dev.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")), "devtest.router.ts must not make network calls");
  });
});

describe("consent enforcement in the send path (hook; ledger not wired in this branch)", () => {
  let db: AdminFakeDb;
  let sender: FakeSender;
  const build = (consent?: { check(w: string): Promise<"granted" | "withdrawn" | "unknown"> }) => {
    db = new AdminFakeDb();
    db.inbound(PHONE, "hi", new Date());
    sender = new FakeSender();
    return new InboxService({ store: new PrismaInboxStore(db), sender, getConfig: () => readyConfig(), consent });
  };
  const send = (s: InboxService, id = "req-cons-0001") => s.send({ contactWaId: PHONE, text: "hello", clientRequestId: id, userId: "u" });
  const outbound = () => db.messages.filter((m) => m.direction === "OUTBOUND");
  beforeEach(() => void 0);

  it("withdrawn consent blocks the send: 409, nothing saved, nothing sent", async () => {
    const s = build({ check: async () => "withdrawn" });
    await assert.rejects(() => send(s), (e: any) => e instanceof InboxError && e.code === "CONSENT_WITHDRAWN" && e.statusCode === 409);
    assert.equal(sender.calls.length, 0);
    assert.equal(outbound().length, 0);
  });

  it("granted and unknown (no record) are allowed: a customer who wrote first is in a service conversation", async () => {
    for (const state of ["granted", "unknown"] as const) {
      const s = build({ check: async () => state });
      assert.equal((await send(s)).message.state, "accepted", state);
    }
  });

  it("a failing consent lookup refuses the send (fail closed) with a generic error and no leak", async () => {
    const s = build({ check: async () => { throw Object.assign(new Error(`db down for ${PHONE}`), { code: "P1001" }); } });
    const logs: string[] = [];
    const orig = { log: console.log, warn: console.warn, error: console.error };
    console.log = console.warn = console.error = (...a: unknown[]) => void logs.push(a.map(String).join(" "));
    try {
      await assert.rejects(() => send(s), (e: any) => e instanceof InboxError && e.code === "CONSENT_CHECK_FAILED" && !e.message.includes(PHONE));
    } finally {
      Object.assign(console, orig);
    }
    assert.equal(sender.calls.length, 0);
    assert.ok(!logs.join("\n").includes(PHONE));
  });

  it("retry also re-checks consent (consent withdrawn between the failure and the retry)", async () => {
    let state: "granted" | "withdrawn" = "granted";
    const s = build({ check: async () => state });
    sender.behaviour = async () => { throw new (await import("../../src/modules/whatsapp/whatsapp.client.js")).WhatsappApiError("x", 400, 131026); };
    const failed = await send(s);
    assert.equal(failed.message.state, "failed");
    state = "withdrawn";
    await assert.rejects(() => s.retry({ messageId: failed.message.id, userId: "u" }), (e: any) => e.code === "CONSENT_WITHDRAWN");
    assert.equal(sender.calls.length, 1, "no second attempt");
  });

  it("a repeat of an already-recorded request is not blocked or re-sent (idempotent report)", async () => {
    let state: "granted" | "withdrawn" = "granted";
    const s = build({ check: async () => state });
    const first = await send(s);
    state = "withdrawn";
    const again = await send(s);
    assert.equal(again.message.id, first.message.id);
    assert.equal(sender.calls.length, 1);
  });

  it("with no guard configured (this branch) behaviour is unchanged", async () => {
    assert.equal((await send(build())).message.state, "accepted");
  });
});

describe("opt-out handling is wired into the production webhook route", () => {
  it("the webhook route passes an opt-out hook that registers STOP-style replies with the consent register", () => {
    const route = files.find((x) => x.f === "modules/whatsapp/whatsapp.route.ts")!.s;
    assert.match(route, /onInboundCreated/);
    assert.ok(route.includes("isOptOutKeyword(event.textBody)"));
    assert.ok(route.includes("registerOptOut("));
  });

  it("the production inbox service is given the consent register (contacts), so withdrawn consent blocks every send", () => {
    const route = files.find((x) => x.f === "modules/business-admin/business-admin.route.ts")!.s;
    assert.ok(route.includes("consent: { check: (waId) => contacts.consentFor(waId) }"));
  });
});
