import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { InboxService } from "../../src/modules/business-admin/inbox.service.js";
import { PrismaInboxStore } from "../../src/modules/business-admin/inbox.store.js";
import { InboxError } from "../../src/modules/business-admin/inbox.errors.js";
import { ContactsService, isOptOutKeyword, type ContactsDb } from "../../src/modules/business-admin/contacts.service.js";
import { TemplatesService } from "../../src/modules/business-admin/templates.service.js";
import { WhatsappApiError, type TemplateDefinition } from "../../src/modules/whatsapp/whatsapp.client.js";
import { WhatsappWebhookService } from "../../src/modules/whatsapp/whatsapp.service.js";
import { PrismaWhatsappStore } from "../../src/modules/whatsapp/whatsapp.store.js";
import { WINDOW_MS } from "../../src/modules/business-admin/inbox.plan.js";
import { AdminFakeDb } from "./admin-fakes.js";
import { FakeSender, PHONE, readyConfig } from "./fakes.js";
import type { WhatsappSender } from "../../src/modules/business-admin/inbox.types.js";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const PDF = new TextEncoder().encode("%PDF-1.7 test");
const EXE = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);

const TEMPLATES: TemplateDefinition[] = [
  { name: "order_update", language: "en", status: "APPROVED", category: "UTILITY", components: [{ type: "BODY", text: "Hi {{1}}, order {{2}} is on its way." }, { type: "FOOTER", text: "Avatar" }] },
  { name: "welcome", language: "en", status: "APPROVED", category: "MARKETING", components: [{ type: "BODY", text: "Welcome to Avatar!" }] },
  { name: "pending_one", language: "en", status: "PENDING", category: "UTILITY", components: [{ type: "BODY", text: "x" }] },
  { name: "with_image", language: "en", status: "APPROVED", category: "MARKETING", components: [{ type: "HEADER", format: "IMAGE" }, { type: "BODY", text: "Look" }] },
  { name: "otp", language: "en", status: "APPROVED", category: "AUTHENTICATION", components: [{ type: "BODY", text: "Code {{1}}" }] },
  { name: "url_button", language: "en", status: "APPROVED", category: "UTILITY", components: [{ type: "BODY", text: "Hi" }, { type: "BUTTONS", buttons: [{ type: "URL", url: "https://x.com/{{1}}" }] }] },
];

class MediaSender extends FakeSender implements WhatsappSender {
  uploads: Array<{ mimeType: string; filename: string; size: number }> = [];
  mediaSends: Array<{ to: string; media: any; opts?: any }> = [];
  templateSends: Array<{ to: string; tpl: any; opts?: any }> = [];
  textOpts: any[] = [];
  uploadBehaviour: () => Promise<{ mediaId: string }> = async () => ({ mediaId: "55501" });
  mediaBehaviour: () => Promise<{ waMessageId: string }> = async () => ({ waMessageId: `wamid.MEDIA${this.mediaSends.length}` });
  async sendText(to: string, text: string, opts?: { replyTo?: string }) {
    this.textOpts.push(opts);
    return super.sendText(to, text);
  }
  async uploadMedia(file: { data: Uint8Array; mimeType: string; filename: string }) {
    this.uploads.push({ mimeType: file.mimeType, filename: file.filename, size: file.data.byteLength });
    return this.uploadBehaviour();
  }
  async sendMedia(to: string, media: any, opts?: any) {
    this.mediaSends.push({ to, media, opts });
    return this.mediaBehaviour();
  }
  async sendTemplate(to: string, tpl: any, opts?: any) {
    this.templateSends.push({ to, tpl, opts });
    return { waMessageId: `wamid.TPL${this.templateSends.length}` };
  }
}

let now = new Date("2026-11-19T12:00:00Z");
let db: AdminFakeDb;
let sender: MediaSender;
let contacts: ContactsService;
let store: PrismaInboxStore;
let service: InboxService;
const ago = (ms: number) => new Date(now.getTime() - ms);
const outbound = () => db.messages.filter((m) => m.direction === "OUTBOUND");
const file = (over: Partial<{ data: Uint8Array; mimeType: string; filename: string }> = {}) => ({ data: JPEG, mimeType: "image/jpeg", filename: "photo.jpg", ...over });
const media = (over: Record<string, unknown> = {}) => service.sendMedia({ contactWaId: PHONE, clientRequestId: "req-media-0001", userId: "u1", file: file(), ...over } as never);
const template = (over: Record<string, unknown> = {}) => service.sendTemplate({ contactWaId: PHONE, clientRequestId: "req-tpl-00001", userId: "u1", name: "order_update", language: "en", params: ["Asha", "ORD-7"], ...over } as never);
const closeWindow = () => {
  db.messages = [];
  db.inbound(PHONE, "old", ago(WINDOW_MS + 3600_000));
};

beforeEach(() => {
  now = new Date("2026-11-19T12:00:00Z");
  db = new AdminFakeDb();
  db.clock = () => now;
  db.users = [{ id: "u1", firstName: "Asha", lastName: "Ops", email: "ops@example.com", roles: ["SUPERADMIN"] }];
  sender = new MediaSender();
  contacts = new ContactsService(db as unknown as ContactsDb, () => now);
  store = new PrismaInboxStore(db, {}, () => now);
  service = new InboxService({
    store,
    sender,
    getConfig: () => readyConfig(),
    now: () => now,
    consent: { check: (w) => contacts.consentFor(w) },
    templates: new TemplatesService({ fetchTemplates: async () => TEMPLATES, now: () => now }),
  });
  db.inbound(PHONE, "Hi", ago(3600_000), { contactName: "Asha" });
});

describe("sending media", () => {
  it("uploads, sends, stores the WhatsApp media id and the caption, and ends SENT", async () => {
    const r = await media({ caption: "Here is the photo" });
    assert.equal(r.created, true);
    assert.equal(r.message.state, "accepted");
    assert.equal(r.message.kind, "image");
    assert.equal(r.message.media?.caption, "Here is the photo");
    assert.equal(r.message.media?.available, true);
    assert.deepEqual(sender.uploads, [{ mimeType: "image/jpeg", filename: "photo.jpg", size: JPEG.byteLength }]);
    assert.deepEqual(sender.mediaSends[0].media, { kind: "image", mediaId: "55501", caption: "Here is the photo", filename: undefined });
    const [row] = outbound();
    assert.equal(row.messageType, "image");
    assert.equal((row.payload as any).media.id, "55501", "the id is kept so a later retry can reuse the upload");
    assert.equal(row.status, "SENT");
  });

  it("documents keep their filename; audio refuses a caption", async () => {
    const doc = await media({ clientRequestId: "req-media-0002", file: file({ data: PDF, mimeType: "application/pdf", filename: "Quote 2026.pdf" }) });
    assert.equal(doc.message.kind, "document");
    assert.equal(doc.message.media?.filename, "Quote 2026.pdf");
    assert.equal(sender.mediaSends[0].media.filename, "Quote 2026.pdf");
    await assert.rejects(() => media({ clientRequestId: "req-media-0003", caption: "hi", file: file({ data: new TextEncoder().encode("OggS\u0000"), mimeType: "audio/ogg", filename: "v.ogg" }) }), (e: any) => e.code === "MEDIA_INVALID");
  });

  it("is idempotent: the same clientRequestId never uploads or sends twice", async () => {
    await media();
    const again = await media();
    assert.equal(again.created, false);
    assert.equal(sender.uploads.length, 1);
    assert.equal(sender.mediaSends.length, 1);
    assert.equal(outbound().length, 1);
  });

  it("refuses bad files before anything is saved or uploaded: wrong type, disguised executable, oversize, empty, long caption", async () => {
    const expectInvalid = (over: Record<string, unknown>) => assert.rejects(() => media(over), (e: any) => e instanceof InboxError && e.code === "MEDIA_INVALID" && e.statusCode === 400);
    await expectInvalid({ file: file({ mimeType: "application/x-msdownload", data: EXE, filename: "run.exe" }) });
    await expectInvalid({ file: file({ data: EXE }) });
    await expectInvalid({ file: file({ data: new Uint8Array(0) }) });
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set(JPEG);
    await expectInvalid({ file: file({ data: big }) });
    await expectInvalid({ caption: "x".repeat(1025) });
    assert.equal(sender.uploads.length, 0);
    assert.equal(outbound().length, 0);
  });

  it("respects the 24h window and withdrawn consent exactly like text", async () => {
    closeWindow();
    await assert.rejects(() => media(), (e: any) => e.code === "WINDOW_CLOSED");
    now = new Date("2026-11-19T12:00:00Z");
    db.inbound(PHONE, "fresh", ago(60_000));
    await contacts.registerOptOut(PHONE, "Asha");
    await assert.rejects(() => media(), (e: any) => e.code === "CONSENT_WITHDRAWN");
    assert.equal(sender.uploads.length, 0);
  });

  it("a failed UPLOAD is a plain failure (nothing was sent), not an 'unconfirmed delivery'; it cannot be retried without the file", async () => {
    sender.uploadBehaviour = async () => {
      throw new WhatsappApiError("timed out", undefined, undefined, true);
    };
    const r = await media();
    assert.equal(r.message.state, "failed");
    assert.equal(r.message.error?.ambiguous, false);
    assert.equal(r.message.canRetry, false, "no media id was obtained, so there is nothing to resend");
    await assert.rejects(() => service.retry({ messageId: r.message.id, userId: "u1" }), (e: any) => e.code === "NOT_RETRYABLE" && /Attach it again/.test(e.message));
  });

  it("if only the SEND step fails after a good upload, retry reuses the uploaded file (no second upload)", async () => {
    let n = 0;
    sender.mediaBehaviour = async () => {
      if (++n === 1) throw new WhatsappApiError("x", 400, 131026);
      return { waMessageId: "wamid.OK" };
    };
    const failed = await media({ caption: "cap" });
    assert.equal(failed.message.state, "failed");
    assert.equal(failed.message.canRetry, true);
    const retried = await service.retry({ messageId: failed.message.id, userId: "u1" });
    assert.equal(retried.message.state, "accepted");
    assert.equal(sender.uploads.length, 1, "the file was not uploaded again");
    assert.equal(sender.mediaSends[1].media.mediaId, "55501");
    assert.equal(sender.mediaSends[1].media.caption, "cap");
    const double = await service.retry({ messageId: failed.message.id, userId: "u1" });
    assert.equal(double.created, false);
    assert.equal(sender.mediaSends.length, 2);
  });

  it("a sender without media support answers 'not available' instead of pretending", async () => {
    const bare = new InboxService({ store, sender: { sendText: async () => ({ waMessageId: "wamid.X" }) }, getConfig: () => readyConfig(), now: () => now });
    await assert.rejects(() => bare.sendMedia({ contactWaId: PHONE, clientRequestId: "req-media-0009", userId: "u1", file: file() }), (e: any) => e.code === "NOT_SUPPORTED");
  });
});

describe("replies (quoting a message)", () => {
  it("sends the quoted message id as context and shows the quote in the thread", async () => {
    const inboundId = db.messages.find((m) => m.direction === "INBOUND")!.id;
    const quotedWamid = db.messages.find((m) => m.id === inboundId)!.waMessageId;
    const r = await service.send({ contactWaId: PHONE, text: "Yes, available", clientRequestId: "req-reply-0001", userId: "u1", replyToMessageId: inboundId });
    assert.deepEqual(sender.textOpts[0], { replyTo: quotedWamid });
    assert.equal(r.message.replyTo?.id, inboundId);
    assert.equal(r.message.replyTo?.text, "Hi");
    assert.equal(r.message.replyTo?.direction, "INBOUND");
    const thread = (await store.listMessages(PHONE, { limit: 50 }, now)).items;
    assert.equal(thread.find((m) => m.id === r.message.id)?.replyTo?.text, "Hi");
  });

  it("shows replies from customers (inbound context) against the message they quote", async () => {
    const mine = await service.send({ contactWaId: PHONE, text: "Price is 500", clientRequestId: "req-reply-0002", userId: "u1" });
    const wamid = outbound()[0].waMessageId;
    db.inbound(PHONE, "ok thanks", ago(0), { payload: { context: { id: wamid } } });
    const thread = (await store.listMessages(PHONE, { limit: 50 }, now)).items;
    const reply = thread.find((m) => m.text === "ok thanks")!;
    assert.equal(reply.replyTo?.id, mine.message.id);
    assert.equal(reply.replyTo?.text, "Price is 500");
  });

  it("refuses to reply to a message from another conversation, an unknown message or a still-pending one", async () => {
    db.inbound("919811122233", "other chat", ago(1000));
    const otherId = db.messages.find((m) => m.contactWaId === "919811122233")!.id;
    for (const id of [otherId, "cdoesnotexist12345"]) {
      await assert.rejects(() => service.send({ contactWaId: PHONE, text: "x", clientRequestId: `req-reply-${id.slice(-6)}`, userId: "u1", replyToMessageId: id }), (e: any) => e.code === "REPLY_UNAVAILABLE");
    }
    assert.equal(outbound().length, 0);
  });

  it("a quote outside our history is shown as an unavailable reference, not dropped", async () => {
    db.inbound(PHONE, "re: something old", ago(10), { payload: { context: { id: "wamid.NOTINDB" } } });
    const t = (await store.listMessages(PHONE, { limit: 50 }, now)).items.find((m) => m.text === "re: something old")!;
    assert.deepEqual(t.replyTo, { id: null, text: null, kind: "other", direction: null });
  });

  it("retrying a failed reply keeps the quote", async () => {
    const inboundId = db.messages.find((m) => m.direction === "INBOUND")!.id;
    let n = 0;
    sender.behaviour = async (_t, _x, i) => {
      if (++n === 1) throw new WhatsappApiError("x", 400, 131026);
      return { waMessageId: `wamid.R${i}` };
    };
    const failed = await service.send({ contactWaId: PHONE, text: "answer", clientRequestId: "req-reply-0003", userId: "u1", replyToMessageId: inboundId });
    await service.retry({ messageId: failed.message.id, userId: "u1" });
    assert.ok(sender.textOpts[1]?.replyTo, "context sent on the retry as well");
  });
});

describe("templates (outside the 24h window)", () => {
  it("lists real templates, marking which this inbox can send and why not", async () => {
    const list = await new TemplatesService({ fetchTemplates: async () => TEMPLATES }).list();
    const by = Object.fromEntries(list.map((t) => [t.name, t]));
    assert.equal(by.order_update.sendable, true);
    assert.equal(by.order_update.variableCount, 2);
    assert.equal(by.welcome.variableCount, 0);
    assert.match(by.pending_one.unsupportedReason ?? "", /approved/i);
    assert.match(by.with_image.unsupportedReason ?? "", /image header/i);
    assert.match(by.otp.unsupportedReason ?? "", /Authentication/);
    assert.match(by.url_button.unsupportedReason ?? "", /button/);
  });

  it("inside the window a template needs no opt-in; it is stored with its rendered text", async () => {
    const r = await template();
    assert.equal(r.message.state, "accepted");
    assert.equal(r.message.kind, "template");
    assert.equal(r.message.text, "Hi Asha, order ORD-7 is on its way.");
    assert.deepEqual(r.message.template, { name: "order_update", language: "en" });
    assert.deepEqual(sender.templateSends[0].tpl, { name: "order_update", language: "en", bodyParams: ["Asha", "ORD-7"] });
  });

  it("outside the window a template needs recorded opt-in: refused without it, allowed with it, blocked after withdrawal", async () => {
    closeWindow();
    await assert.rejects(() => template(), (e: any) => e.code === "OPT_IN_REQUIRED" && e.statusCode === 409);
    assert.equal(sender.templateSends.length, 0);
    assert.equal(outbound().length, 0);

    const c = await contacts.create({ name: "Asha Verma", phone: `+${PHONE}` }, "u1");
    await assert.rejects(() => template({ clientRequestId: "req-tpl-00002" }), (e: any) => e.code === "OPT_IN_REQUIRED", "a saved contact with unknown consent is still not enough");
    await contacts.setOptIn(c.id, { status: "GRANTED", evidence: "website_form", note: "Book demo form 2026-11-10" }, "u1");
    const ok = await template({ clientRequestId: "req-tpl-00003" });
    assert.equal(ok.message.state, "accepted");
    await contacts.setOptIn(c.id, { status: "WITHDRAWN" }, "u1");
    await assert.rejects(() => template({ clientRequestId: "req-tpl-00004" }), (e: any) => e.code === "CONSENT_WITHDRAWN");
    assert.equal(sender.templateSends.length, 1);
  });

  it("works for a saved, opted-in contact who has never messaged us (new business-initiated conversation)", async () => {
    const c = await contacts.create({ name: "New Lead", phone: "+919811122233" }, "u1");
    await contacts.setOptIn(c.id, { status: "GRANTED", evidence: "written", note: "signed form #44" }, "u1");
    const r = await service.sendTemplate({ contactWaId: "919811122233", clientRequestId: "req-tpl-00005", userId: "u1", name: "welcome", language: "en", params: [] });
    assert.equal(r.message.state, "accepted");
    assert.equal(outbound().filter((m) => m.contactWaId === "919811122233").length, 1);
  });

  it("validates against the real template list: unknown, unapproved, unsupported, wrong value count, empty values", async () => {
    const expectInvalid = (over: Record<string, unknown>, re: RegExp) => assert.rejects(() => template({ clientRequestId: `req-tpl-${Math.random().toString(36).slice(2, 10)}`, ...over }), (e: any) => e.code === "TEMPLATE_INVALID" && re.test(e.message));
    await expectInvalid({ name: "made_up" }, /does not exist/);
    await expectInvalid({ name: "pending_one" }, /approved/i);
    await expectInvalid({ name: "with_image" }, /image header/i);
    await expectInvalid({ params: ["only one"] }, /needs 2 values/);
    await expectInvalid({ params: ["Asha", "  "] }, /cannot be empty/);
    await expectInvalid({ params: "nope" }, /needs 2 values/);
    assert.equal(sender.templateSends.length, 0);
  });

  it("cleans template values (WhatsApp rejects newlines/tabs/runs of spaces) and caps their length", async () => {
    const r = await template({ params: ["Asha\nVerma", `ORD\t7${"x".repeat(2000)}`] });
    const sent = sender.templateSends[0].tpl.bodyParams as string[];
    assert.equal(sent[0], "Asha Verma");
    assert.ok(sent[1].length <= 1024 && !/[\n\t]/.test(sent[1]));
    assert.equal(r.message.state, "accepted");
  });

  it("a failed template can be retried once (double click safe)", async () => {
    let n = 0;
    const ts = sender.sendTemplate.bind(sender);
    sender.sendTemplate = async (to, tpl, opts) => {
      if (++n === 1) throw new WhatsappApiError("x", 400, 132000);
      return ts(to, tpl, opts);
    };
    const failed = await template();
    assert.equal(failed.message.canRetry, true);
    const [a, b] = await Promise.all([service.retry({ messageId: failed.message.id, userId: "u1" }), service.retry({ messageId: failed.message.id, userId: "u1" })]);
    assert.equal(a.message.id, b.message.id);
    assert.equal(sender.templateSends.length, 1);
  });

  it("needs sending to be enabled, and a sender/template service to exist", async () => {
    const off = new InboxService({ store, sender, getConfig: () => readyConfig({ outboundEnabled: false }), now: () => now, templates: new TemplatesService({ fetchTemplates: async () => TEMPLATES }) });
    await assert.rejects(() => off.sendTemplate({ contactWaId: PHONE, clientRequestId: "req-tpl-00009", userId: "u1", name: "welcome", language: "en", params: [] }), (e: any) => e.code === "NOT_CONFIGURED");
    const bare = new InboxService({ store, sender: { sendText: async () => ({ waMessageId: "wamid.X" }) }, getConfig: () => readyConfig(), now: () => now });
    await assert.rejects(() => bare.sendTemplate({ contactWaId: PHONE, clientRequestId: "req-tpl-00008", userId: "u1", name: "welcome", language: "en", params: [] }), (e: any) => e.code === "NOT_SUPPORTED");
  });
});

describe("the opt-out keyword and the consent register", () => {
  it("only an exact STOP-style message counts (case-insensitive), never a sentence containing the word", () => {
    for (const yes of ["STOP", "stop", " Stop ", "Stop.", "STOP ALL", "unsubscribe", "Opt out", "optout"]) assert.equal(isOptOutKeyword(yes), true, yes);
    for (const no of ["please don't stop", "stop sending me this", "non-stop", "unstoppable", "", null, undefined, "start"]) assert.equal(isOptOutKeyword(no as never), false, String(no));
  });

  it("a customer replying STOP is withdrawn immediately and every send is then refused; a normal message does nothing", async () => {
    const hook = async (e: any) => {
      if (e.type === "text" && isOptOutKeyword(e.textBody)) await contacts.registerOptOut(e.from, e.contactName);
    };
    const webhook = new WhatsappWebhookService(new PrismaWhatsappStore(db as never, () => now), hook);
    const deliver = (id: string, text: string) =>
      webhook.handlePayload({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "1" }, contacts: [{ wa_id: PHONE, profile: { name: "Asha" } }], messages: [{ from: PHONE, id: id, timestamp: String(Math.floor(now.getTime() / 1000)), type: "text", text: { body: text } }] } }] }] });
    await deliver("wamid.N1", "thanks, that works");
    assert.equal(await contacts.consentFor(PHONE), "unknown");
    await deliver("wamid.S1", "STOP");
    assert.equal(await contacts.consentFor(PHONE), "withdrawn");
    const c = (await contacts.getByWaId(PHONE))!;
    assert.equal(c.source, "inbound");
    assert.equal(c.optIn.bySomeoneElse, false, "recorded as the customer's own choice");
    await assert.rejects(() => service.send({ contactWaId: PHONE, text: "hello", clientRequestId: "req-stop-0001", userId: "u1" }), (e: any) => e.code === "CONSENT_WITHDRAWN");
    // The same STOP delivered again (Meta retries) is a duplicate message; the idempotent hook still runs, so a failed first attempt is repaired.
    const r = await deliver("wamid.S1", "STOP");
    assert.equal(r.inbound.duplicate, 1);
  });

  it("a failing opt-out hook still stores the message, fails the request so Meta redelivers, and never logs the phone number", async () => {
    const webhook = new WhatsappWebhookService(new PrismaWhatsappStore(db as never, () => now), async () => {
      throw new Error("db down for 919876543210");
    });
    const logs: string[] = [];
    const orig = { log: console.log, warn: console.warn, error: console.error };
    console.log = console.warn = console.error = (...a: unknown[]) => void logs.push(a.map(String).join(" "));
    let r: Awaited<ReturnType<typeof webhook.handlePayload>> | undefined;
    let failure: unknown;
    const storedBefore = db.messages.length;
    try {
      r = await webhook.handlePayload({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "1" }, messages: [{ from: PHONE, id: "wamid.H1", timestamp: "1763553600", type: "text", text: { body: "STOP" } }] } }] }] });
    } catch (e) {
      failure = e;
    } finally {
      Object.assign(console, orig);
    }
    assert.equal(r, undefined);
    assert.match(String((failure as Error)?.message), /post-processing failed/i, "non-2xx so Meta retries; the retry repairs the opt-out (see test/security/stop-redelivery.test.ts)");
    assert.equal(db.messages.length, storedBefore + 1, "the message was stored regardless");
    assert.ok(!logs.join("\n").includes("919876543210"));
  });

  it("withdrawn consent can only be replaced by NEW consent with evidence, never silently reset", async () => {
    const c = await contacts.create({ name: "Asha", phone: PHONE }, "u1");
    await contacts.setOptIn(c.id, { status: "WITHDRAWN" }, "u1");
    await assert.rejects(() => contacts.setOptIn(c.id, { status: "UNKNOWN" }, "u1"), (e: any) => e.code === "INVALID");
    await assert.rejects(() => contacts.setOptIn(c.id, { status: "GRANTED" }, "u1"), (e: any) => e.code === "EVIDENCE_REQUIRED");
    await assert.rejects(() => contacts.setOptIn(c.id, { status: "GRANTED", evidence: "made_up_type", note: "something" }, "u1"), (e: any) => e.code === "EVIDENCE_REQUIRED");
    await assert.rejects(() => contacts.setOptIn(c.id, { status: "GRANTED", evidence: "website_form", note: "x" }, "u1"), (e: any) => e.code === "EVIDENCE_REQUIRED");
    const granted = await contacts.setOptIn(c.id, { status: "GRANTED", evidence: "website_form", note: "Demo form, 10 Nov" }, "u1");
    assert.equal(granted.optIn.status, "GRANTED");
    assert.match(granted.optIn.evidence ?? "", /^website_form: Demo form/);
    assert.equal(granted.optIn.outAt, null);
  });
});
