import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { ADMIN_OK, asSuper, call, startInboxApp, SUPER, tokenFor, type InboxApp } from "./app.js";
import { PHONE } from "./fakes.js";
import { normalizeWaId } from "../../src/modules/business-admin/contacts.service.js";
import { WINDOW_MS } from "../../src/modules/business-admin/inbox.plan.js";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
let app: InboxApp;
const base = () => `/whatsapp/conversations/${PHONE}`;
const ago = (ms: number) => new Date(app.now.current.getTime() - ms);

before(async () => {
  app = await startInboxApp({ env: {} });
});
after(() => app.close());
beforeEach(() => {
  app.now.current = new Date("2026-11-19T12:00:00Z");
  app.db.messages = [];
  app.db.conversations = [];
  app.db.events = [];
  app.db.contactRows = [];
  app.sender.calls.length = 0;
  app.sender.mediaCalls.length = 0;
  app.sender.templateCalls.length = 0;
  app.sender.uploadCalls.length = 0;
  app.media.available = true;
  app.media.fail = false;
  app.media.requested.length = 0;
  app.db.inbound(PHONE, "Hello", ago(600_000), { contactName: "Asha Verma" });
});

async function upload(path: string, token: string | undefined, fields: Record<string, string>, file?: { data: Uint8Array; type: string; name: string }) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  if (file) form.append("file", new Blob([Buffer.from(file.data)], { type: file.type }), file.name);
  const res = await fetch(app.url + path, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
  return { status: res.status, json: (await res.json().catch(() => null)) as any };
}
const SUPER_TOKEN = () => tokenFor("SUPERADMIN");

describe("permissions on the new endpoints", () => {
  const routes: Array<[string, string, unknown?]> = [
    ["GET", "/whatsapp/search?q=hello"],
    ["GET", "/whatsapp/groups/status"],
    ["GET", "/whatsapp/templates"],
    ["POST", `${"/whatsapp/conversations/" + PHONE}/templates`, { clientRequestId: "req-perm-0001", name: "welcome", language: "en", params: [] }],
    ["GET", "/whatsapp/messages/cabcdefghij1234567890/media"],
    ["GET", `${"/whatsapp/conversations/" + PHONE}/profile`],
    ["GET", "/whatsapp/tags"],
    ["GET", "/whatsapp/contacts"],
    ["POST", "/whatsapp/contacts", { name: "X Y", phone: "+919800000009" }],
    ["POST", "/whatsapp/contacts/import", { rows: [] }],
    ["GET", "/whatsapp/contacts/cabcdefghij1234567890"],
    ["PATCH", "/whatsapp/contacts/cabcdefghij1234567890", { name: "Z" }],
    ["DELETE", "/whatsapp/contacts/cabcdefghij1234567890"],
    ["PUT", "/whatsapp/contacts/cabcdefghij1234567890/opt-in", { status: "WITHDRAWN" }],
  ];
  for (const [m, p, body] of routes) {
    it(`${m} ${p.split("?")[0].replace(PHONE, ":waId")}: 401 without token, 403 for a user or an admin without the Inbox module, never reachable otherwise`, async () => {
      assert.equal((await call(app, m, p, { body })).status, 401);
      assert.equal((await call(app, m, p, { token: tokenFor("USER"), body })).status, 403);
      app.db.users = app.db.users.map((u) => u);
      app.db.accessRows = [{ id: "a1", userId: ADMIN_OK.id, roleKey: "ANALYST", modules: ["dashboard", "analytics"] }];
      assert.equal((await call(app, m, p, { token: tokenFor("ADMIN", ADMIN_OK.id), body })).status, 403, "analyst has no inbox module");
      app.db.accessRows = [];
    });
  }

  it("the upload endpoint is protected too, and a refused upload reaches neither the uploader nor WhatsApp", async () => {
    const f = { data: JPEG, type: "image/jpeg", name: "a.jpg" };
    assert.equal((await upload(`${base()}/media`, undefined, { clientRequestId: "req-perm-0002" }, f)).status, 401);
    assert.equal((await upload(`${base()}/media`, tokenFor("USER"), { clientRequestId: "req-perm-0002" }, f)).status, 403);
    assert.equal(app.sender.uploadCalls.length, 0);
  });
});

describe("sending media over HTTP (multipart)", () => {
  it("201: uploads, sends and returns the message with media metadata; a repeat is 200 and sends nothing", async () => {
    const f = { data: JPEG, type: "image/jpeg", name: "site visit.jpg" };
    const first = await upload(`${base()}/media`, SUPER_TOKEN(), { clientRequestId: "req-http-media1", caption: "Price < 500 & free" }, f);
    assert.equal(first.status, 201);
    const m = first.json.data.message;
    assert.equal(m.kind, "image");
    assert.equal(m.state, "accepted");
    assert.equal(m.media.caption, "Price < 500 & free", "caption stored exactly as typed (no HTML escaping)");
    assert.equal(m.media.filename, "site visit.jpg");
    assert.deepEqual(app.sender.uploadCalls, [{ mimeType: "image/jpeg", filename: "site visit.jpg", size: JPEG.byteLength }]);
    const again = await upload(`${base()}/media`, SUPER_TOKEN(), { clientRequestId: "req-http-media1" }, f);
    assert.equal(again.status, 200);
    assert.equal(again.json.data.created, false);
    assert.equal(app.sender.mediaCalls.length, 1);
  });

  it("400 with a clear reason: no file, bad request id, unsupported type, disguised file, oversize, long caption", async () => {
    const t = SUPER_TOKEN();
    assert.equal((await upload(`${base()}/media`, t, { clientRequestId: "req-http-media2" })).status, 400);
    assert.equal((await upload(`${base()}/media`, t, {}, { data: JPEG, type: "image/jpeg", name: "a.jpg" })).status, 400);
    const exe = await upload(`${base()}/media`, t, { clientRequestId: "req-http-media3" }, { data: new Uint8Array([0x4d, 0x5a, 0, 0]), type: "application/x-msdownload", name: "x.exe" });
    assert.equal(exe.status, 400);
    assert.match(exe.json.message, /not supported/);
    const fake = await upload(`${base()}/media`, t, { clientRequestId: "req-http-media4" }, { data: new Uint8Array([0x4d, 0x5a, 0, 0]), type: "image/jpeg", name: "x.jpg" });
    assert.equal(fake.status, 400);
    assert.match(fake.json.message, /do not match/);
    const big = new Uint8Array(26 * 1024 * 1024);
    big.set(JPEG);
    const huge = await upload(`${base()}/media`, t, { clientRequestId: "req-http-media5" }, { data: big, type: "image/jpeg", name: "big.jpg" });
    assert.equal(huge.status, 400);
    assert.match(huge.json.message, /at most/);
    assert.equal((await upload(`${base()}/media`, t, { clientRequestId: "req-http-media6", caption: "x".repeat(1025) }, { data: JPEG, type: "image/jpeg", name: "a.jpg" })).status, 400);
    assert.equal(app.sender.uploadCalls.length, 0, "nothing reached WhatsApp");
    assert.equal(app.db.messages.filter((m) => m.direction === "OUTBOUND").length, 0, "nothing was saved");
  });

  it("409 when the 24h window is closed and 503 when sending is not enabled", async () => {
    const f = { data: JPEG, type: "image/jpeg", name: "a.jpg" };
    app.config.current = { ...app.config.current, outboundEnabled: false };
    const off = await upload(`${base()}/media`, SUPER_TOKEN(), { clientRequestId: "req-http-media7" }, f);
    assert.equal(off.status, 503);
    assert.equal(off.json.data.code, "NOT_CONFIGURED");
    app.config.current = { ...app.config.current, outboundEnabled: true };
    app.db.messages = [];
    app.db.inbound(PHONE, "ancient", ago(WINDOW_MS + 60_000));
    const closed = await upload(`${base()}/media`, SUPER_TOKEN(), { clientRequestId: "req-http-media8" }, f);
    assert.equal(closed.status, 409);
    assert.equal(closed.json.data.code, "WINDOW_CLOSED");
  });
});

describe("media download proxy", () => {
  const withMedia = (over: Record<string, unknown> = {}) => app.db.inbound(PHONE, null, ago(1000), { messageType: "image", payload: { image: { id: "555001", mime_type: "image/jpeg" } }, ...over });

  it("streams the file with safe headers, never exposing the access token or a WhatsApp URL", async () => {
    const msg = withMedia();
    const res = await fetch(`${app.url}/whatsapp/messages/${msg.id}/media`, { headers: { Authorization: `Bearer ${SUPER_TOKEN()}` } });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "image/jpeg");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.match(res.headers.get("content-security-policy") ?? "", /sandbox/);
    assert.match(res.headers.get("content-disposition") ?? "", /^inline; filename\*=UTF-8''image-/);
    assert.equal(res.headers.get("cache-control"), "private, max-age=600");
    assert.equal(new Uint8Array(await res.arrayBuffer()).byteLength, 7);
    assert.deepEqual(app.media.requested, ["555001"]);
    for (const [k, v] of res.headers) assert.ok(!/test_access_token|graph\.facebook|fbsbx/i.test(`${k}${v}`));
  });

  it("documents and unknown types are served as attachments (never rendered), voice notes inline", async () => {
    const doc = withMedia({ messageType: "document", payload: { document: { id: "555002", mime_type: "text/html", filename: "<script>.html" } } });
    app.media.contentType = "text/html";
    const d = await fetch(`${app.url}/whatsapp/messages/${doc.id}/media`, { headers: { Authorization: `Bearer ${SUPER_TOKEN()}` } });
    assert.equal(d.headers.get("content-type"), "application/octet-stream");
    assert.match(d.headers.get("content-disposition") ?? "", /^attachment; filename\*=UTF-8''/);
    assert.ok(!(d.headers.get("content-disposition") ?? "").includes("<script>"));
    const voice = withMedia({ messageType: "audio", payload: { audio: { id: "555003", mime_type: "audio/ogg; codecs=opus", voice: true } } });
    const v = await fetch(`${app.url}/whatsapp/messages/${voice.id}/media`, { headers: { Authorization: `Bearer ${SUPER_TOKEN()}` } });
    assert.equal(v.headers.get("content-type"), "audio/ogg");
    assert.match(v.headers.get("content-disposition") ?? "", /^inline/);
  });

  it("404 for text messages, unknown ids and uploads that never completed; 404 with a clear reason when WhatsApp no longer has the file", async () => {
    const t = { token: SUPER_TOKEN() };
    const text = app.db.messages.find((m) => m.direction === "INBOUND")!;
    assert.equal((await call(app, "GET", `/whatsapp/messages/${text.id}/media`, t)).status, 404);
    assert.equal((await call(app, "GET", "/whatsapp/messages/cdoesnotexist12345/media", t)).status, 404);
    const never = withMedia({ messageType: "image", payload: { media: { kind: "image", id: null } } });
    assert.equal((await call(app, "GET", `/whatsapp/messages/${never.id}/media`, t)).status, 404);
    const msg = withMedia();
    app.media.fail = true;
    const gone = await call(app, "GET", `/whatsapp/messages/${msg.id}/media`, t);
    assert.equal(gone.status, 404);
    assert.equal(gone.json.data.code, "MEDIA_UNAVAILABLE");
    assert.match(gone.json.message, /30 days/);
    assert.equal((await call(app, "GET", "/whatsapp/messages/x/media", t)).status, 400);
  });

  it("503 when WhatsApp is not configured, and the thread API exposes media metadata but never ids or URLs", async () => {
    const msg = withMedia({ textBody: "the invoice" });
    app.media.available = false;
    assert.equal((await call(app, "GET", `/whatsapp/messages/${msg.id}/media`, { token: SUPER_TOKEN() })).status, 503);
    const thread = await asSuper(app, "GET", `${base()}/messages`);
    const m = thread.json.data.items.find((x: any) => x.id === msg.id);
    assert.equal(m.kind, "image");
    assert.deepEqual(m.media, { kind: "image", mimeType: "image/jpeg", filename: null, sizeBytes: null, caption: "the invoice", voice: false, available: true });
    assert.ok(!JSON.stringify(thread.json).includes("555001"), "the WhatsApp media id is not sent to the browser");
  });
});

describe("templates over HTTP", () => {
  it("lists live templates and sends one outside the window only with recorded opt-in", async () => {
    const list = await asSuper(app, "GET", "/whatsapp/templates");
    assert.equal(list.status, 200);
    assert.deepEqual(list.json.data.items.map((t: any) => t.name), ["order_update", "welcome"]);
    app.db.messages = [];
    app.db.inbound(PHONE, "ancient", ago(WINDOW_MS + 60_000));
    const body = { clientRequestId: "req-http-tpl-01", name: "order_update", language: "en", params: ["Asha", "A-1"] };
    const refused = await asSuper(app, "POST", `${base()}/templates`, body);
    assert.equal(refused.status, 409);
    assert.equal(refused.json.data.code, "OPT_IN_REQUIRED");
    assert.equal(app.sender.templateCalls.length, 0);
    const c = await asSuper(app, "POST", "/whatsapp/contacts", { name: "Asha Verma", phone: `+${PHONE}` });
    await asSuper(app, "PUT", `/whatsapp/contacts/${c.json.data.id}/opt-in`, { status: "GRANTED", evidence: "website_form", note: "Demo form 10 Nov" });
    const ok = await asSuper(app, "POST", `${base()}/templates`, body);
    assert.equal(ok.status, 201);
    assert.equal(ok.json.data.message.text, "Hi Asha, order A-1 is on its way.");
    assert.equal(ok.json.data.message.kind, "template");
    assert.equal((await asSuper(app, "POST", `${base()}/templates`, body)).status, 200, "repeat is idempotent");
    assert.equal(app.sender.templateCalls.length, 1);
  });

  it("validates the request: name, language, request id, value count", async () => {
    const t = (b: any) => asSuper(app, "POST", `${base()}/templates`, b);
    assert.equal((await t({ clientRequestId: "req-http-tpl-02", name: "Bad Name!", language: "en", params: [] })).status, 400);
    assert.equal((await t({ clientRequestId: "req-http-tpl-02", name: "welcome", language: "??", params: [] })).status, 400);
    assert.equal((await t({ name: "welcome", language: "en", params: [] })).status, 400);
    const wrong = await t({ clientRequestId: "req-http-tpl-03", name: "order_update", language: "en", params: ["only one"] });
    assert.equal(wrong.status, 400);
    assert.equal(wrong.json.data.code, "TEMPLATE_INVALID");
  });
});

describe("contacts over HTTP", () => {
  it("normalises phone numbers like staff type them", () => {
    for (const [input, expected] of [["98765 43210", "919876543210"], ["+91 98765-43210", "919876543210"], ["09876543210", "919876543210"], ["0091 98765 43210", "919876543210"], ["+44 7700 900123", "447700900123"], ["(415) 555-0132", null], ["12345", null], ["abc", null], ["+1", null], ["", null]] as const) {
      const r = normalizeWaId(input);
      assert.equal(r.ok ? r.waId : null, expected, input);
    }
  });

  it("creates, reads, updates and deletes a contact; messages survive deletion", async () => {
    const c = await asSuper(app, "POST", "/whatsapp/contacts", { name: "Asha Verma", phone: "98765 43210", email: "Asha@Example.com", company: "Verma & Sons", tags: ["VIP", "demo", "vip"], notes: "Prefers calls\nafter 5pm" });
    assert.equal(c.status, 201);
    const d = c.json.data;
    assert.deepEqual([d.waId, d.email, d.tags, d.optIn.status, d.source], [PHONE, "asha@example.com", ["vip", "demo"], "UNKNOWN", "manual"]);
    assert.equal(d.notes, "Prefers calls\nafter 5pm");
    assert.equal((await asSuper(app, "GET", `/whatsapp/contacts/${d.id}`)).json.data.name, "Asha Verma");
    const upd = await asSuper(app, "PATCH", `/whatsapp/contacts/${d.id}`, { name: "Asha V. Verma", tags: ["lead"], company: "" });
    assert.deepEqual([upd.json.data.name, upd.json.data.tags, upd.json.data.company], ["Asha V. Verma", ["lead"], null]);
    assert.equal(app.db.messages.length, 1);
    const del = await asSuper(app, "DELETE", `/whatsapp/contacts/${d.id}`);
    assert.equal(del.status, 200);
    assert.equal((await asSuper(app, "GET", `/whatsapp/contacts/${d.id}`)).status, 404);
    assert.equal(app.db.messages.length, 1, "deleting a contact keeps the conversation history");
    assert.equal((await asSuper(app, "DELETE", `/whatsapp/contacts/${d.id}`)).status, 404);
  });

  it("validation and duplicates: bad phone, name and email (no HTML), 409 for the same number written differently", async () => {
    const post = (b: any) => asSuper(app, "POST", "/whatsapp/contacts", b);
    for (const [over, field] of [[{ phone: "12345" }, "phone"], [{ phone: "" }, "phone"], [{ name: "" }, "name"], [{ name: "<script>x</script>" }, "name"], [{ email: "nope" }, "email"], [{ tags: ["<b>"] }, "tags"], [{ tags: Array.from({ length: 16 }, (_, i) => `t${i}`) }, "tags"], [{ notes: "x".repeat(2001) }, "notes"]] as const) {
      const r = await post({ ...{ name: "Ok Name", phone: "+919800000001" }, ...(over as Record<string, unknown>) });
      assert.equal(r.status, 400, JSON.stringify(over));
      assert.equal(r.json.data.field, field, JSON.stringify(over));
    }
    assert.equal((await post({ name: "A B", phone: "+91 98000 00002" })).status, 201);
    const dup = await post({ name: "Other", phone: "09800000002" });
    assert.equal(dup.status, 409);
    assert.equal(dup.json.data.code, "PHONE_EXISTS");
    assert.equal((await asSuper(app, "PATCH", "/whatsapp/contacts/cabcdefghij1234567890", {})).status, 400);
  });

  it("lists with search by name, email, company or phone digits, filters by tag and consent, and pages", async () => {
    for (const [name, phone, tags, company] of [["Asha Verma", "+919800000001", ["vip"], "Verma Textiles"], ["Ravi Kumar", "+919800000002", ["lead"], "Kumar Exports"], ["Chloe Brown", "+447700900123", ["vip", "uk"], ""]] as const) {
      await asSuper(app, "POST", "/whatsapp/contacts", { name, phone, tags, company });
    }
    const names = async (q: string) => (await asSuper(app, "GET", `/whatsapp/contacts?${q}`)).json.data.items.map((c: any) => c.name);
    assert.deepEqual(await names("q=verma"), ["Asha Verma"]);
    assert.deepEqual(await names("q=kumar%20exports"), ["Ravi Kumar"]);
    assert.deepEqual(await names(`q=${encodeURIComponent("+44 7700 900123")}`), ["Chloe Brown"]);
    assert.deepEqual(await names("tag=vip"), ["Asha Verma", "Chloe Brown"]);
    assert.deepEqual(await names("tag=uk"), ["Chloe Brown"]);
    assert.deepEqual(await names("optIn=GRANTED"), []);
    const p = (await asSuper(app, "GET", "/whatsapp/contacts?pageSize=2&page=2")).json.data;
    assert.deepEqual([p.items.length, p.total], [1, 3]);
    assert.deepEqual((await asSuper(app, "GET", "/whatsapp/tags")).json.data.items, ["lead", "uk", "vip"]);
    for (const q of ["?page=0", "?pageSize=101", "?optIn=MAYBE", "?page=x"]) assert.equal((await asSuper(app, "GET", `/whatsapp/contacts${q}`)).status, 400, q);
  });

  it("import: creates, fills blanks and merges tags on existing contacts, reports every bad row, and can NEVER change consent", async () => {
    const existing = await asSuper(app, "POST", "/whatsapp/contacts", { name: "Asha Verma", phone: "+919800000001", tags: ["vip"] });
    await asSuper(app, "PUT", `/whatsapp/contacts/${existing.json.data.id}/opt-in`, { status: "WITHDRAWN" });
    const rows = [
      { name: "New Person", phone: "98000 00003", email: "new@example.com", tags: "lead, demo" },
      { name: "Asha Again", phone: "+919800000001", email: "asha@example.com", company: "Verma Textiles", tags: ["imported"], optIn: "GRANTED", optInStatus: "GRANTED" },
      { name: "Bad Phone", phone: "123" },
      { name: "", phone: "+919800000004" },
      { name: "Dup In File", phone: "+91 98000 00003" },
      { name: "Bad Email", phone: "+919800000005", email: "nope" },
    ];
    const r = await asSuper(app, "POST", "/whatsapp/contacts/import", { rows });
    assert.equal(r.status, 200);
    assert.deepEqual([r.json.data.created, r.json.data.updated, r.json.data.skipped], [1, 1, 4]);
    assert.deepEqual(r.json.data.errors.map((e: any) => e.row), [3, 4, 5, 6]);
    const asha = (await asSuper(app, "GET", `/whatsapp/contacts/${existing.json.data.id}`)).json.data;
    assert.equal(asha.optIn.status, "WITHDRAWN", "an import file cannot grant or reset consent");
    assert.equal(asha.email, "asha@example.com", "blank fields are filled");
    assert.equal(asha.name, "Asha Verma", "existing names are kept");
    assert.deepEqual(asha.tags, ["vip", "imported"]);
    const fresh = app.db.contactRows.find((c) => c.waId === "919800000003")!;
    assert.deepEqual([fresh.optInStatus, fresh.source, fresh.tags], ["UNKNOWN", "import", ["lead", "demo"]]);
    for (const bad of [{}, { rows: [] }, { rows: "x" }, { rows: Array.from({ length: 501 }, () => ({ name: "A", phone: "+919800000009" })) }]) assert.equal((await asSuper(app, "POST", "/whatsapp/contacts/import", bad)).status, 400);
  });

  it("consent endpoint: granting needs evidence and a reference, is attributed, and withdrawal blocks sending immediately", async () => {
    const c = (await asSuper(app, "POST", "/whatsapp/contacts", { name: "Asha Verma", phone: `+${PHONE}` })).json.data;
    const put = (b: any) => asSuper(app, "PUT", `/whatsapp/contacts/${c.id}/opt-in`, b);
    assert.equal((await put({ status: "GRANTED" })).status, 400);
    assert.equal((await put({ status: "GRANTED", evidence: "i_said_so", note: "trust me" })).status, 400);
    assert.equal((await put({ status: "MAYBE" })).status, 400);
    const ok = await put({ status: "GRANTED", evidence: "written", note: "Signed form #12" });
    assert.equal(ok.json.data.optIn.status, "GRANTED");
    assert.equal(ok.json.data.optIn.bySomeoneElse, true);
    assert.ok(ok.json.data.optIn.at);
    assert.equal((await asSuper(app, "POST", `${base()}/messages`, { text: "hi", clientRequestId: "req-http-cons-1" })).status, 201);
    assert.equal((await put({ status: "WITHDRAWN" })).json.data.optIn.status, "WITHDRAWN");
    const blocked = await asSuper(app, "POST", `${base()}/messages`, { text: "hi again", clientRequestId: "req-http-cons-2" });
    assert.equal(blocked.status, 409);
    assert.equal(blocked.json.data.code, "CONSENT_WITHDRAWN");
    const profile = await asSuper(app, "GET", `${base()}/profile`);
    assert.equal(profile.json.data.contact.optIn.status, "WITHDRAWN");
    assert.ok(profile.json.data.evidenceTypes.includes("website_form"));
  });

  it("an allowlisted-style admin with the Inbox module can use contacts; the same call for an unknown conversation returns a null profile", async () => {
    app.db.accessRows = [{ id: "a1", userId: ADMIN_OK.id, roleKey: "SUPPORT_AGENT", modules: ["dashboard", "inbox", "customers"] }];
    const r = await call(app, "POST", "/whatsapp/contacts", { token: tokenFor("ADMIN", ADMIN_OK.id), body: { name: "Agent Made", phone: "+919800000007" } });
    assert.equal(r.status, 201);
    assert.equal((await asSuper(app, "GET", "/whatsapp/conversations/919800000099/profile")).json.data.contact, null);
    app.db.accessRows = [];
    void SUPER;
  });
});

describe("search, jump-to-message and groups", () => {
  it("finds messages by text (case-insensitive) with a snippet, across or within a conversation, and ignores short queries", async () => {
    app.db.inbound(PHONE, "Please send the INVOICE for order 4471", ago(5000));
    app.db.inbound("919811122233", "invoice attached", ago(4000), { contactName: "Ravi" });
    const all = (await asSuper(app, "GET", "/whatsapp/search?q=invoice")).json.data.items;
    assert.equal(all.length, 2);
    assert.match(all[1].snippet, /INVOICE for order 4471/);
    assert.equal(all[0].contactName, "Ravi");
    assert.equal((await asSuper(app, "GET", `/whatsapp/search?q=invoice&waId=${PHONE}`)).json.data.items.length, 1);
    assert.deepEqual((await asSuper(app, "GET", "/whatsapp/search?q=i")).json.data.items, []);
    assert.equal((await asSuper(app, "GET", "/whatsapp/search?q=invoice&waId=abc")).status, 400);
    assert.equal((await asSuper(app, "GET", "/whatsapp/search?q=zzzzzz")).json.data.items.length, 0);
  });

  it("'until' returns the page that ends at a found message so search results can be opened in context", async () => {
    app.db.messages = [];
    const ids: string[] = [];
    for (let i = 1; i <= 30; i++) ids.push(app.db.inbound(PHONE, `msg-${String(i).padStart(2, "0")}`, ago((40 - i) * 60_000)).id);
    const page = (await asSuper(app, "GET", `${base()}/messages?limit=10&until=${ids[14]}`)).json.data;
    assert.equal(page.items.at(-1).text, "msg-15");
    assert.equal(page.items[0].text, "msg-06");
    assert.equal(page.hasMore, true);
    assert.equal((await asSuper(app, "GET", `${base()}/messages?until=bad id`)).status, 400);
  });

  it("group messaging is reported as NOT supported, with the reason and next steps (nothing simulated)", async () => {
    const r = await asSuper(app, "GET", "/whatsapp/groups/status");
    assert.equal(r.json.data.supported, false);
    assert.match(r.json.data.reason, /not verified/);
    assert.ok(r.json.data.nextSteps.length >= 2);
    assert.equal(app.sender.calls.length + app.sender.mediaCalls.length, 0);
  });
});
