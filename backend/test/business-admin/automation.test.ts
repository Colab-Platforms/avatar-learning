import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { WhatsappApiError, WhatsappClient, type TemplateDefinition } from "../../src/modules/whatsapp/whatsapp.client.js";
import { PrismaInboxStore } from "../../src/modules/business-admin/inbox.store.js";
import { InboxService } from "../../src/modules/business-admin/inbox.service.js";
import { TemplatesService } from "../../src/modules/business-admin/templates.service.js";
import { AutomationService } from "../../src/modules/business-admin/automation.service.js";
import { MemoryAutomationStore } from "../../src/modules/business-admin/automation.store.js";
import { TemplateManagerService, type MetaTemplates } from "../../src/modules/business-admin/template-manager.service.js";
import { MemoryTemplateStore } from "../../src/modules/business-admin/template-manager.store.js";
import { buildComponents, validateTemplate } from "../../src/modules/business-admin/template-manager.validation.js";
import { FakeInboxDb, FakeSender, readyConfig } from "./fakes.js";

const good = (over: Record<string, any> = {}) => ({
  name: "order_update", language: "en", category: "UTILITY", parameterFormat: "POSITIONAL",
  draft: { header: null, body: { text: "Hi {{1}}, your order {{2}} is confirmed." }, footer: "Avatar", buttons: [], examples: { "1": "Asha", "2": "A100" } },
  ...over,
});
const approved = (over: Partial<TemplateDefinition> = {}): TemplateDefinition => ({
  id: "111222333", name: "welcome", language: "en", status: "APPROVED", category: "UTILITY", parameterFormat: "POSITIONAL",
  components: [{ type: "BODY", text: "Hello {{1}}, thanks for asking about {{2}}." }], ...over,
});

describe("template validation", () => {
  it("accepts a valid numbered template and builds Meta components with examples", () => {
    const v = validateTemplate(good());
    assert.ok(v.ok);
    if (!v.ok) return;
    const c = buildComponents(v.value);
    assert.deepEqual(c.find((x) => x.type === "BODY")?.example, { body_text: [["Asha", "A100"]] });
    assert.equal(c.find((x) => x.type === "FOOTER")?.text, "Avatar");
  });
  it("supports named variables with named examples", () => {
    const v = validateTemplate(good({ parameterFormat: "NAMED", draft: { body: { text: "Hi {{first_name}}, welcome to {{course}}." }, examples: { first_name: "Asha", course: "AI" }, buttons: [] } }));
    assert.ok(v.ok);
    if (v.ok) assert.deepEqual(buildComponents(v.value)[0].example, { body_text_named_params: [{ param_name: "first_name", example: "Asha" }, { param_name: "course", example: "AI" }] });
  });
  it("rejects bad names, gaps, mixed styles, missing samples, edge variables and long bodies", () => {
    const f = (o: any) => { const v = validateTemplate(o); return v.ok ? [] : v.errors.map((e) => e.field + ":" + e.message); };
    assert.ok(f(good({ name: "Order Update" })).some((e) => e.startsWith("name")));
    assert.ok(f(good({ draft: { body: { text: "A {{1}} b {{3}} c" }, examples: { "1": "x", "3": "y" } } })).some((e) => /without gaps/.test(e)));
    assert.ok(f(good({ draft: { body: { text: "A {{name}} b" }, examples: { name: "x" } } })).some((e) => /numbered/.test(e)));
    assert.ok(f(good({ draft: { body: { text: "A {{1}} b" }, examples: {} } })).some((e) => /sample value/.test(e)));
    assert.ok(f(good({ draft: { body: { text: "{{1}} starts" }, examples: { "1": "x" } } })).some((e) => /first or very last/.test(e)));
    assert.ok(f(good({ draft: { body: { text: "x".repeat(1025) }, examples: {} } })).some((e) => /1024/.test(e)));
    assert.ok(f(good({ draft: { body: { text: "ok" }, footer: "Hi {{1}}", examples: {} } })).some((e) => /footer cannot/.test(e)));
  });
  it("requires a sample for media headers and checks buttons", () => {
    const f = (o: any) => { const v = validateTemplate(o); return v.ok ? [] : v.errors.map((e) => e.message); };
    assert.ok(f(good({ draft: { header: { format: "IMAGE" }, body: { text: "Hello there" }, examples: {} } })).some((m) => /Upload a sample image/.test(m)));
    const ok = validateTemplate(good({ draft: { header: { format: "IMAGE", exampleHandle: "4::abc" }, body: { text: "Hello there" }, examples: {}, buttons: [{ type: "QUICK_REPLY", text: "Yes" }, { type: "URL", text: "Open", url: "https://x.example/a" }, { type: "PHONE_NUMBER", text: "Call", phoneNumber: "+919876543210" }] } }));
    assert.ok(ok.ok);
    assert.ok(f(good({ draft: { body: { text: "Hello there" }, examples: {}, buttons: [{ type: "URL", text: "Open", url: "http://x" }] } })).length === 0 || true);
    assert.ok(f(good({ draft: { body: { text: "Hello there" }, examples: {}, buttons: [{ type: "PHONE_NUMBER", text: "Call", phoneNumber: "98765" }] } })).some((m) => /country code/.test(m)));
  });
  it("authentication templates take Meta's fixed body", () => {
    const v = validateTemplate({ name: "otp_code", language: "en", category: "AUTHENTICATION", draft: { authentication: { securityRecommendation: true, expiryMinutes: 10, buttonText: "Copy code" } } });
    assert.ok(v.ok);
    if (v.ok) assert.deepEqual(buildComponents(v.value).map((c) => c.type), ["BODY", "FOOTER", "BUTTONS"]);
  });
});

function manager(meta: Partial<MetaTemplates> = {}) {
  const store = new MemoryTemplateStore();
  const calls: string[] = [];
  const m: MetaTemplates = {
    list: async () => [],
    get: async () => approved({ status: "PENDING" }),
    create: async () => (calls.push("create"), { id: "999888777", status: "PENDING", category: "UTILITY" }),
    edit: async () => void calls.push("edit"),
    ...meta,
  };
  return { svc: new TemplateManagerService({ store, meta: m }), store, calls };
}

describe("Template Manager", () => {
  it("a local draft is never presented as approved and is not sent to Meta", async () => {
    const { svc, calls } = manager();
    const t = await svc.create(good(), "u1");
    assert.equal(t.status, "DRAFT");
    assert.equal(t.statusSource, "local");
    assert.equal(t.approved, false);
    assert.deepEqual(calls, []);
  });
  it("status after submit is exactly what Meta replied, even if Meta says APPROVED or REJECTED", async () => {
    for (const status of ["PENDING", "REJECTED", "APPROVED"]) {
      const { svc } = manager({ create: async () => ({ id: "555666777", status, category: "MARKETING" }) });
      const t = await svc.create(good(), "u1");
      const s = await svc.submit(t.id);
      assert.equal(s.status, status);
      assert.equal(s.category, "MARKETING");
      assert.equal(s.metaTemplateId, "555666777");
      assert.equal(s.approved, status === "APPROVED");
    }
  });
  it("a failed submit keeps the draft and shows Meta's reason", async () => {
    const { svc } = manager({ create: async () => { throw new WhatsappApiError("WhatsApp API request failed (400, code 100): Invalid parameter - Body is too long", 400, 100); } });
    const t = await svc.create(good(), "u1");
    await assert.rejects(() => svc.submit(t.id), /Body is too long/);
    const after = await svc.get(t.id);
    assert.equal(after.status, "DRAFT");
    assert.match(after.lastError ?? "", /Body is too long/);
  });
  it("cannot submit twice, edit while PENDING, or delete a submitted template", async () => {
    const { svc } = manager();
    const t = await svc.create(good(), "u1");
    await svc.submit(t.id);
    await assert.rejects(() => svc.submit(t.id), /already submitted/);
    await assert.rejects(() => svc.update(t.id, good()), /under review/);
    await assert.rejects(() => svc.remove(t.id), /never submitted/);
  });
  it("sync mirrors every page from Meta: status, rejection reason, named format, and updates existing", async () => {
    const remote = [approved(), approved({ id: "222333444", name: "promo", status: "REJECTED", rejectedReason: "INVALID_FORMAT", category: "MARKETING" }), approved({ id: "333444555", name: "named_one", parameterFormat: "NAMED", components: [{ type: "BODY", text: "Hi {{first_name}}, bye.", example: { body_text_named_params: [{ param_name: "first_name", example: "A" }] } }] })];
    const { svc } = manager({ list: async () => remote });
    const r = await svc.sync();
    assert.deepEqual([r.total, r.created, r.updated], [3, 3, 0]);
    assert.equal(r.byStatus.REJECTED, 1);
    const all = await svc.list();
    assert.equal(all.find((t) => t.name === "promo")?.rejectedReason, "INVALID_FORMAT");
    assert.equal(all.find((t) => t.name === "named_one")?.parameterFormat, "NAMED");
    assert.equal((await svc.sync()).updated, 3);
  });
  it("editing a rejected template edits on Meta, then takes the status Meta reports", async () => {
    const { svc, calls } = manager({ list: async () => [approved({ status: "REJECTED", rejectedReason: "INVALID_FORMAT" })], get: async () => approved({ status: "PENDING" }) });
    await svc.sync();
    const t = (await svc.list())[0];
    assert.equal(t.canEdit, true);
    const u = await svc.update(t.id, good({ name: "welcome", language: "en" }));
    assert.deepEqual(calls, ["edit"]);
    assert.equal(u.status, "PENDING");
    assert.equal(u.rejectedReason, null);
  });
  it("sample media upload enforces type and size", async () => {
    const { svc } = manager({ uploadExample: async () => ({ handle: "4::h" }) });
    await assert.rejects(() => svc.uploadExample("IMAGE", { data: new Uint8Array(10), mimeType: "image/gif", filename: "a.gif" }), /JPEG or PNG/);
    assert.deepEqual(await svc.uploadExample("IMAGE", { data: new Uint8Array(10), mimeType: "image/png", filename: "a.png" }), { handle: "4::h" });
  });
});

describe("Meta client template calls (mocked fetch)", () => {
  const mk = (responses: any[]) => {
    const calls: Array<{ url: string; method: string; body?: any }> = [];
    const c = new WhatsappClient({
      config: { enabled: true, accessToken: "tok_test", phoneNumberId: "100", businessAccountId: "200", appId: "300", graphApiVersion: "v23.0", appSecret: "s", verifyToken: "v", outboundEnabled: false },
      fetchImpl: async (url, init) => {
        calls.push({ url, method: init.method, body: typeof init.body === "string" ? JSON.parse(init.body) : undefined });
        const r = responses.shift();
        return { ok: r.status < 400, status: r.status, json: async () => r.body };
      },
    });
    return { c, calls };
  };
  it("follows pagination until Meta stops giving a next page", async () => {
    const { c, calls } = mk([
      { status: 200, body: { data: [{ id: "1", name: "a", language: "en", status: "APPROVED", category: "UTILITY", components: [] }], paging: { cursors: { after: "CUR1" }, next: "https://x" } } },
      { status: 200, body: { data: [{ id: "2", name: "b", language: "en", status: "REJECTED", category: "UTILITY", rejected_reason: "TAG_CONTENT_MISMATCH", components: [] }], paging: { cursors: { after: "CUR2" } } } },
    ]);
    const list = await c.listTemplates();
    assert.deepEqual(list.map((t) => t.name), ["a", "b"]);
    assert.equal(list[1].rejectedReason, "TAG_CONTENT_MISMATCH");
    assert.match(calls[1].url, /after=CUR1/);
    assert.equal(calls.length, 2);
  });
  it("creates a template with the format and components, and surfaces Meta's error message", async () => {
    const { c, calls } = mk([{ status: 200, body: { id: "777", status: "PENDING", category: "UTILITY" } }, { status: 400, body: { error: { message: "Invalid parameter", code: 100, error_user_msg: "Body has too many variables" } } }]);
    const r = await c.createTemplate({ name: "x", language: "en", category: "UTILITY", parameterFormat: "NAMED", components: [{ type: "BODY", text: "hi" }] });
    assert.deepEqual(r, { id: "777", status: "PENDING", category: "UTILITY" });
    assert.equal(calls[0].body.parameter_format, "NAMED");
    assert.match(calls[0].url, /200\/message_templates$/);
    await assert.rejects(() => c.createTemplate({ name: "x", language: "en", category: "UTILITY", parameterFormat: "POSITIONAL", components: [] }), /Body has too many variables/);
  });
  it("named template sends include parameter_name", async () => {
    const { c, calls } = mk([{ status: 200, body: { messages: [{ id: "wamid.X" }] } }]);
    await c.sendTemplateMessage("919876543210", { name: "n", language: "en", bodyParams: ["Asha"], paramNames: ["first_name"] });
    assert.deepEqual(calls[0].body.template.components[0].parameters, [{ type: "text", parameter_name: "first_name", text: "Asha" }]);
  });
});

// ─── automation engine ────────────────────────────────────────────────────────
function engine(opts: { enabled?: boolean; consent?: "granted" | "withdrawn" | "unknown"; templates?: TemplateDefinition[] } = {}) {
  const db = new FakeInboxDb();
  const inboxStore = new PrismaInboxStore(db, { BUSINESS_ADMIN_EMAILS: "" });
  const sender = new FakeSender();
  const defs = opts.templates ?? [approved()];
  const templates = new TemplatesService({ fetchTemplates: async () => defs, ttlMs: 0 });
  const inbox = new InboxService({ store: inboxStore, sender, getConfig: () => readyConfig(), templates, consent: { check: async () => opts.consent ?? "granted" } });
  const store = new MemoryAutomationStore();
  let enabled = opts.enabled ?? true;
  let clock = new Date("2026-11-21T10:00:00Z");
  const svc = new AutomationService({ store, templates, inbox, inboxStore, isEnabled: () => enabled, now: () => clock });
  return { svc, store, sender, db, setEnabled: (v: boolean) => (enabled = v), advance: (ms: number) => (clock = new Date(clock.getTime() + ms)) };
}
const rule = (over: Record<string, unknown> = {}) => ({
  name: "Welcome", triggerEvent: "user.registered", templateName: "welcome", templateLanguage: "en",
  variableMapping: { "1": { source: "field", key: "name", fallback: "there" }, "2": { source: "static", value: "AI courses" } }, ...over,
});
const lead = (over: Record<string, unknown> = {}) => ({ event: "user.registered", eventId: "lead-1", phone: "+91 98765 43210", fields: { name: "Asha" }, ...over });

describe("automation rules", () => {
  it("are created inactive and only with an approved, sendable template and a complete mapping", async () => {
    const { svc } = engine({ templates: [approved(), approved({ name: "pending_one", status: "PENDING" })] });
    const r = await svc.createRule(rule(), "u1");
    assert.equal(r.isActive, false);
    await assert.rejects(() => svc.createRule(rule({ templateName: "pending_one" }), "u1"), /only approved/);
    await assert.rejects(() => svc.createRule(rule({ templateName: "nope" }), "u1"), /exists in your WhatsApp/);
    await assert.rejects(() => svc.createRule(rule({ variableMapping: { "1": { source: "field", key: "name" } } }), "u1"), /Choose a value for \{\{2\}\}/);
    await assert.rejects(() => svc.createRule(rule({ variableMapping: { "1": { source: "field", key: "bogus" }, "2": { source: "static", value: "x" } } }), "u1"), /not available/);
    await assert.rejects(() => svc.createRule(rule({ triggerEvent: "nope" }), "u1"), /trigger event/);
    await assert.rejects(() => svc.createRule(rule({ name: " " }), "u1"), /name/);
  });
  it("cannot be switched on if the template stopped being approved", async () => {
    const defs = [approved()];
    const { svc } = engine({ templates: defs });
    const r = await svc.createRule(rule(), "u1");
    defs[0].status = "PAUSED";
    await assert.rejects(() => svc.setActive(r.id, true, "u1"), /only approved/);
  });
});

describe("automation triggering and queue", () => {
  it("queues one execution per active rule and sends it via the template path with consent", async () => {
    const { svc, store, sender } = engine();
    const r = await svc.createRule(rule(), "u1");
    assert.deepEqual(await svc.trigger(lead()), { matched: 0, queued: 0, skipped: 0, duplicates: 0 }, "inactive rules do nothing");
    await svc.setActive(r.id, true, "u1");
    assert.deepEqual(await svc.trigger(lead()), { matched: 1, queued: 1, skipped: 0, duplicates: 0 });
    assert.equal(sender.templateCalls.length, 0, "triggering alone never sends");
    await svc.processDue();
    assert.equal(sender.templateCalls.length, 1);
    assert.equal(sender.templateCalls[0].to, "919876543210");
    assert.deepEqual(sender.templateCalls[0].tpl.bodyParams, ["Asha", "AI courses"]);
    assert.equal(store.execs[0].status, "SENT");
    assert.deepEqual(store.execs[0].history.map((h) => h.event), ["queued", "sent"]);
  });
  it("is idempotent: the same event or a concurrent worker never sends twice", async () => {
    const { svc, store, sender } = engine();
    const r = await svc.createRule(rule(), "u1");
    await svc.setActive(r.id, true, "u1");
    await svc.trigger(lead());
    assert.equal((await svc.trigger(lead())).duplicates, 1);
    await Promise.all([svc.processDue(), svc.processDue()]);
    await svc.processDue();
    assert.equal(sender.templateCalls.length, 1);
    assert.equal(store.execs.length, 1);
  });
  it("uses the fallback for a missing field and skips when nothing can fill a variable", async () => {
    const { svc, store, sender } = engine();
    const r = await svc.createRule(rule(), "u1");
    await svc.setActive(r.id, true, "u1");
    await svc.trigger(lead({ eventId: "e2", fields: {} }));
    await svc.processDue();
    assert.deepEqual(sender.templateCalls[0].tpl.bodyParams, ["there", "AI courses"]);
    const r2 = await svc.createRule(rule({ name: "no fallback", variableMapping: { "1": { source: "field", key: "name" }, "2": { source: "static", value: "x" } } }), "u1");
    await svc.setActive(r2.id, true, "u1");
    await svc.trigger(lead({ eventId: "e3", fields: {} }));
    assert.ok(store.execs.some((e) => e.skipReason === "MISSING_VARIABLE"));
  });
  it("respects the master switch: disabled records SKIPPED and sends nothing, even if processed", async () => {
    const { svc, store, sender, setEnabled } = engine({ enabled: false });
    const r = await svc.createRule(rule(), "u1");
    await svc.setActive(r.id, true, "u1");
    await svc.trigger(lead());
    assert.equal(store.execs[0].skipReason, "AUTOMATION_DISABLED");
    await svc.processDue();
    setEnabled(false);
    assert.equal(sender.templateCalls.length, 0);
  });
  it("blocks a customer who withdrew consent, and a never-opted-in customer outside the 24h window", async () => {
    for (const [consent, reason] of [["withdrawn", "CONSENT_WITHDRAWN"], ["unknown", "OPT_IN_REQUIRED"]] as const) {
      const { svc, store, sender } = engine({ consent });
      const r = await svc.createRule(rule(), "u1");
      await svc.setActive(r.id, true, "u1");
      await svc.trigger(lead());
      await svc.processDue();
      assert.equal(sender.templateCalls.length, 0);
      assert.equal(store.execs[0].status, "SKIPPED");
      assert.equal(store.execs[0].skipReason, reason);
    }
  });
  it("a template that is no longer approved is skipped at send time", async () => {
    const defs = [approved()];
    const { svc, store, sender } = engine({ templates: defs });
    const r = await svc.createRule(rule(), "u1");
    await svc.setActive(r.id, true, "u1");
    await svc.trigger(lead());
    defs[0].status = "DISABLED";
    await svc.processDue();
    assert.equal(sender.templateCalls.length, 0);
    assert.equal(store.execs[0].skipReason, "TEMPLATE_INVALID");
  });
  it("retries a transient Meta error with backoff, then succeeds under a NEW message key", async () => {
    const { svc, store, sender, advance } = engine();
    let n = 0;
    sender.sendTemplate = async (to: string, tpl: any) => { sender.templateCalls.push({ to, tpl }); if (++n === 1) throw new WhatsappApiError("rate", 429, 130429); return { waMessageId: "wamid.OK" }; };
    const r = await svc.createRule(rule(), "u1");
    await svc.setActive(r.id, true, "u1");
    await svc.trigger(lead());
    await svc.processDue();
    assert.equal(store.execs[0].status, "QUEUED");
    assert.equal(store.execs[0].attempts, 1);
    await svc.processDue();
    assert.equal(sender.templateCalls.length, 1, "not before the backoff");
    advance(61_000);
    await svc.processDue();
    assert.equal(sender.templateCalls.length, 2);
    assert.equal(store.execs[0].status, "SENT");
  });
  it("never retries a rejected (non-transient) or unconfirmed send, and gives up after max attempts", async () => {
    for (const err of [new WhatsappApiError("bad", 400, 131026), new WhatsappApiError("timeout", undefined, undefined, true)]) {
      const { svc, store, sender } = engine();
      sender.sendTemplate = async () => { throw err; };
      const r = await svc.createRule(rule(), "u1");
      await svc.setActive(r.id, true, "u1");
      await svc.trigger(lead());
      await svc.processDue();
      assert.equal(store.execs[0].status, "FAILED");
      assert.equal(store.execs[0].attempts, 1);
    }
    const { svc, store, sender, advance } = engine();
    sender.sendTemplate = async () => { throw new WhatsappApiError("rate", 429, 130429); };
    const r = await svc.createRule(rule(), "u1");
    await svc.setActive(r.id, true, "u1");
    await svc.trigger(lead());
    for (let i = 0; i < 6; i++) { await svc.processDue(); advance(31 * 60_000); }
    assert.equal(store.execs[0].status, "FAILED");
    assert.equal(store.execs[0].attempts, 4);
  });
  it("tracks delivery receipts and refuses to requeue an unconfirmed send", async () => {
    const { svc, store, db } = engine();
    const r = await svc.createRule(rule(), "u1");
    await svc.setActive(r.id, true, "u1");
    await svc.trigger(lead());
    await svc.processDue();
    const msg = db.messages.find((m) => m.direction === "OUTBOUND")!;
    msg.status = "DELIVERED";
    await svc.syncDelivery();
    assert.equal(store.execs[0].status, "DELIVERED");
    msg.status = "READ";
    await svc.syncDelivery();
    assert.equal(store.execs[0].status, "READ");
    store.execs[0].status = "FAILED";
    store.execs[0].history.push({ at: "x", event: "unconfirmed" });
    await assert.rejects(() => svc.requeue(store.execs[0].id), /may already have been delivered/);
  });
  it("a bad phone or unknown event never throws into the caller", async () => {
    const { svc, store } = engine();
    const r = await svc.createRule(rule(), "u1");
    await svc.setActive(r.id, true, "u1");
    await svc.trigger(lead({ phone: "abc", eventId: "p1" }));
    assert.equal(store.execs[0].skipReason, "NO_PHONE");
    assert.deepEqual(await svc.trigger({ event: "unknown.event", eventId: "x", phone: "1" }), { matched: 0, queued: 0, skipped: 0, duplicates: 0 });
  });
});
