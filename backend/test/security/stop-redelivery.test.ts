import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { WhatsappWebhookService } from "../../src/modules/whatsapp/whatsapp.service.js";
import { ContactsService, isOptOutKeyword, type ContactsDb } from "../../src/modules/business-admin/contacts.service.js";
import type { InboundMessageEvent } from "../../src/modules/whatsapp/whatsapp.types.js";
import { MemoryWhatsappStore, PHONE_NUMBER_ID, textMessagePayload } from "../whatsapp/helpers.js";
import { asSuper, startInboxApp, type InboxApp } from "../business-admin/app.js";

const PHONE = "919876543210";

// The same hook the production webhook route installs, over the same (fake) database the inbox sends read from.
// A separate ContactsService instance stands for "another process / after a restart": consent lives in the database only.
const productionHook = (app: InboxApp, fail: { on: boolean }, calls: { n: number }) => async (event: InboundMessageEvent) => {
  calls.n++;
  if (fail.on) throw new Error("simulated database outage");
  if (event.type === "text" && isOptOutKeyword(event.textBody)) await new ContactsService(app.db as unknown as ContactsDb).registerOptOut(event.from, event.contactName, event.timestamp);
};

describe("a STOP whose first processing failed is repaired when Meta redelivers it", () => {
  let app: InboxApp;
  before(async () => {
    app = await startInboxApp();
    app.db.inbound(PHONE, "hello", new Date()); // customer-service window is open
  });
  after(() => app.close());

  const text = (id: string) => asSuper(app, "POST", `/whatsapp/conversations/${PHONE}/messages`, { text: "Hi again", clientRequestId: id });
  const template = (id: string) => asSuper(app, "POST", `/whatsapp/conversations/${PHONE}/templates`, { clientRequestId: id, name: "welcome", language: "en", params: [] });

  it("first attempt fails, redelivery withdraws consent, and both reply and template sends are then refused", async () => {
    assert.ok((await text("req-before-stop-0001")).status < 300, "a reply is accepted before any STOP");
    const sentBefore = app.sender.calls.length;

    const fail = { on: true };
    const calls = { n: 0 };
    const store = new MemoryWhatsappStore();
    const service = new WhatsappWebhookService(store, productionHook(app, fail, calls));
    const payload = textMessagePayload("wamid.STOP-REDELIVERY", "STOP", PHONE, PHONE_NUMBER_ID);

    // 1) First delivery: the message is stored, the hook fails, so the request fails (Meta will retry).
    await assert.rejects(() => service.handlePayload(payload, PHONE_NUMBER_ID), /post-processing failed/i);
    assert.equal(store.messages.size, 1, "the inbound message itself was stored");
    assert.equal(await new ContactsService(app.db as unknown as ContactsDb).consentFor(PHONE), "unknown", "consent is not withdrawn yet");

    // 2) Meta redelivers the same message: it is a duplicate, but the hook runs again and now succeeds.
    fail.on = false;
    const result = await service.handlePayload(payload, PHONE_NUMBER_ID);
    assert.deepEqual(result.inbound, { created: 0, duplicate: 1 });
    assert.equal(store.messages.size, 1, "no duplicate inbound message was created");
    assert.equal(calls.n, 2, "the hook ran on the first attempt and again on the redelivery");

    // 3) A fresh service instance (restart) reads the persisted state.
    assert.equal(await new ContactsService(app.db as unknown as ContactsDb).consentFor(PHONE), "withdrawn");

    // 4) Both kinds of send are refused and nothing reaches WhatsApp.
    const reply = await text("req-after-stop-0001");
    const tmpl = await template("req-after-stop-0002");
    assert.equal(reply.json?.data?.code, "CONSENT_WITHDRAWN");
    assert.equal(tmpl.json?.data?.code, "CONSENT_WITHDRAWN");
    assert.ok(reply.status >= 400 && tmpl.status >= 400);
    assert.equal(app.sender.calls.length, sentBefore, "nothing was sent after the withdrawal");

    // 5) Another redelivery is harmless (idempotent): still withdrawn, still one message.
    await service.handlePayload(payload, PHONE_NUMBER_ID);
    assert.equal(store.messages.size, 1);
    assert.equal(await new ContactsService(app.db as unknown as ContactsDb).consentFor(PHONE), "withdrawn");
  });

  it("repeating a STOP does not rewrite the withdrawal time", async () => {
    const contacts = new ContactsService(app.db as unknown as ContactsDb, () => new Date("2026-11-20T10:00:00Z"));
    const phone = "919811100001";
    await contacts.registerOptOut(phone, "Repeat Rita");
    const row = () => app.db.contactRows.find((c) => c.waId === phone);
    const first = row().optOutAt as Date;
    assert.equal(first.toISOString(), "2026-11-20T10:00:00.000Z");
    await new ContactsService(app.db as unknown as ContactsDb, () => new Date("2026-11-21T10:00:00Z")).registerOptOut(phone, "Repeat Rita");
    assert.equal((row().optOutAt as Date).toISOString(), first.toISOString(), "the original withdrawal time is kept");
    assert.equal(await contacts.consentFor(phone), "withdrawn");
  });

  it("a redelivered STOP that is older than consent recorded afterwards does not undo that newer consent", async () => {
    const phone = "919811100002";
    const created = await asSuper(app, "POST", "/whatsapp/contacts", { name: "Grant Gita", phone });
    assert.equal(created.status, 201);
    const granted = await asSuper(app, "PUT", `/whatsapp/contacts/${created.json.data.id}/opt-in`, { status: "GRANTED", evidence: "website_form", note: "Demo form 20 Nov" });
    assert.equal(granted.json.data.optIn.status, "GRANTED");
    const contacts = new ContactsService(app.db as unknown as ContactsDb);
    await contacts.registerOptOut(phone, null, new Date("2020-01-01T00:00:00Z")); // old STOP, replayed
    assert.equal(await contacts.consentFor(phone), "granted", "the later recorded consent stands");
    await contacts.registerOptOut(phone, null, new Date(Date.now() + 60_000)); // a genuinely newer STOP still wins
    assert.equal(await contacts.consentFor(phone), "withdrawn");
  });
});
