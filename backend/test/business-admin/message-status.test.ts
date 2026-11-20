import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { InboxService } from "../../src/modules/business-admin/inbox.service.js";
import { PrismaInboxStore } from "../../src/modules/business-admin/inbox.store.js";
import { isSimulatedMessage, messageState, SIMULATED_WAMID_PREFIX } from "../../src/modules/business-admin/inbox.plan.js";
import { PrismaWhatsappStore } from "../../src/modules/whatsapp/whatsapp.store.js";
import type { StatusEvent } from "../../src/modules/whatsapp/whatsapp.types.js";
import { FakeInboxDb, FakeSender, PHONE, readyConfig } from "./fakes.js";

/**
 * Status rendering for the two kinds of sender:
 *  - REAL (WhatsApp Cloud API): sending -> accepted (API said yes) -> sent (Meta webhook) -> delivered -> read | failed
 *  - SANDBOX (dev mock): always "simulated". Nothing was sent, so it must never read as sent/delivered/read.
 */
const NOW = new Date("2026-11-19T12:00:00Z");
let db: FakeInboxDb;
let sender: FakeSender;

const ev = (waMessageId: string, s: string, ts = "1763553700"): StatusEvent => ({ waMessageId, status: s, recipientId: PHONE, timestamp: new Date(Number(ts) * 1000) });
const webhook = () => new PrismaWhatsappStore(db as never);

function build(opts: { sandbox: boolean }) {
  db = new FakeInboxDb();
  db.clock = () => NOW;
  db.users = [{ id: "u1", firstName: "Asha", lastName: "Ops", email: "ops@example.com", roles: ["SUPERADMIN"] }];
  sender = new FakeSender();
  const store = new PrismaInboxStore(db, {}, () => NOW, opts.sandbox ? { sandbox: true } : {});
  const service = new InboxService({ store, sender, getConfig: () => readyConfig(), now: () => NOW });
  db.inbound(PHONE, "Hello", new Date(NOW.getTime() - 3600_000), { contactName: "Asha" });
  return { store, service };
}
const sendOne = (service: InboxService, id = "req-00000001") => service.send({ contactWaId: PHONE, text: "Hi there", clientRequestId: id, userId: "u1" });
const view = async (store: PrismaInboxStore) => (await store.listMessages(PHONE, { limit: 50 }, NOW)).items.filter((m) => m.direction === "OUTBOUND").at(-1)!;

describe("messageState (pure)", () => {
  const base = { direction: "OUTBOUND" as const, createdAt: new Date(NOW.getTime() - 1000) };
  it("real: SENT without a WhatsApp confirmation is only 'accepted'; with Meta's sent time it is 'sent'", () => {
    assert.equal(messageState({ ...base, status: "SENT", sentAt: null }, NOW), "accepted");
    assert.equal(messageState({ ...base, status: "SENT" }, NOW), "accepted");
    assert.equal(messageState({ ...base, status: "SENT", sentAt: NOW }, NOW), "sent");
    assert.equal(messageState({ ...base, status: "DELIVERED" }, NOW), "delivered");
    assert.equal(messageState({ ...base, status: "READ" }, NOW), "read");
    assert.equal(messageState({ ...base, status: "FAILED" }, NOW), "failed");
  });
  it("sandbox: every progressed state is 'simulated'; failures and in-flight sends keep their honest state", () => {
    for (const status of ["SENT", "DELIVERED", "READ"] as const) assert.equal(messageState({ ...base, status, sentAt: NOW }, NOW, true), "simulated", status);
    assert.equal(messageState({ ...base, status: "FAILED" }, NOW, true), "failed");
    assert.equal(messageState({ ...base, status: "SENDING" }, NOW, true), "sending");
  });
  it("inbound messages are never given a delivery state", () => {
    assert.equal(messageState({ direction: "INBOUND", status: "RECEIVED", createdAt: NOW }, NOW), "received");
    assert.equal(messageState({ direction: "INBOUND", status: "RECEIVED", createdAt: NOW }, NOW, true), "received");
  });
  it("mock ids are recognised as simulated even if a store forgot the sandbox flag (defence in depth)", () => {
    assert.equal(isSimulatedMessage({ waMessageId: `${SIMULATED_WAMID_PREFIX}abc123` }), true);
    assert.equal(isSimulatedMessage({ waMessageId: "wamid.HBgLMTIzNDU2Nzg5MBUCABEYEjQ" }), false);
    assert.equal(isSimulatedMessage({ waMessageId: "wamid.HBgL" }, true), true);
  });
});

describe("REAL sender: Accepted, Sent, Delivered, Read and Failed stay separate", () => {
  let store: PrismaInboxStore;
  let service: InboxService;
  beforeEach(() => void ({ store, service } = build({ sandbox: false })));

  it("API acceptance shows 'accepted' (not sent), is not simulated, and records when the API accepted it", async () => {
    const r = await sendOne(service);
    assert.equal(r.message.state, "accepted");
    assert.equal(r.message.simulated, false);
    assert.ok(r.message.timeline.acceptedAt, "acceptance time kept");
    assert.equal(r.message.timeline.sentAt, null, "nothing from WhatsApp yet");
    assert.equal(r.message.timeline.deliveredAt, null);
  });

  it("walks accepted -> sent -> delivered -> read as Meta's webhooks arrive, never skipping ahead on its own", async () => {
    await sendOne(service);
    assert.equal((await view(store)).state, "accepted");
    await webhook().applyStatusEvent(ev("wamid.OUT1", "sent"));
    let m = await view(store);
    assert.equal(m.state, "sent");
    assert.ok(m.timeline.sentAt);
    await webhook().applyStatusEvent(ev("wamid.OUT1", "delivered", "1763553800"));
    m = await view(store);
    assert.equal(m.state, "delivered");
    assert.ok(m.timeline.deliveredAt);
    await webhook().applyStatusEvent(ev("wamid.OUT1", "read", "1763553900"));
    m = await view(store);
    assert.equal(m.state, "read");
    assert.ok(m.timeline.readAt);
    assert.equal(m.simulated, false);
  });

  it("without any webhook the message stays 'accepted' forever: it is never promoted to delivered", async () => {
    await sendOne(service);
    const later = new Date(NOW.getTime() + 6 * 3600_000);
    const m = (await store.listMessages(PHONE, { limit: 50 }, later)).items.filter((x) => x.direction === "OUTBOUND")[0];
    assert.equal(m.state, "accepted");
  });

  it("a send Meta rejects is 'failed' with the reason, not accepted or sent", async () => {
    const { WhatsappApiError } = await import("../../src/modules/whatsapp/whatsapp.client.js");
    sender.behaviour = async () => {
      throw new WhatsappApiError("rejected", 400, 131047, false);
    };
    const r = await sendOne(service);
    assert.equal(r.message.state, "failed");
    assert.equal(r.message.simulated, false);
    assert.equal(r.message.timeline.acceptedAt, null);
  });

  it("a Meta failure webhook after acceptance ends in 'failed'", async () => {
    await sendOne(service);
    await webhook().applyStatusEvent({ ...ev("wamid.OUT1", "failed"), error: { code: 131026, title: "Message undeliverable" } });
    assert.equal((await view(store)).state, "failed");
  });

  it("conversation list reports the same real state for the last message", async () => {
    await sendOne(service);
    const list = await store.listConversations({ filter: "all", page: 1, pageSize: 10, meId: "u1" }, NOW);
    assert.equal(list.items[0].lastState, "accepted");
  });
});

describe("SANDBOX sender: every message is 'simulated' and never looks delivered", () => {
  let store: PrismaInboxStore;
  let service: InboxService;
  beforeEach(() => void ({ store, service } = build({ sandbox: true })));

  it("a sandbox send is 'simulated' and flagged, not 'sent' or 'accepted'", async () => {
    const r = await sendOne(service);
    assert.equal(r.message.state, "simulated");
    assert.equal(r.message.simulated, true);
    assert.notEqual(r.message.state, "sent");
    assert.notEqual(r.message.state, "accepted");
  });

  it("even if delivered/read rows exist in the sandbox, they still read 'simulated'", async () => {
    await sendOne(service);
    const row = db.messages.find((m) => m.direction === "OUTBOUND")!;
    for (const status of ["DELIVERED", "READ"]) {
      row.status = status;
      assert.equal((await view(store)).state, "simulated", status);
    }
  });

  it("a mock id marks a message simulated even on a store that is not flagged as sandbox", async () => {
    const real = build({ sandbox: false });
    sender.behaviour = async () => ({ waMessageId: `${SIMULATED_WAMID_PREFIX}zzz001` });
    const r = await sendOne(real.service);
    assert.equal(r.message.state, "simulated", "a mock sender response can never appear as real WhatsApp delivery");
    assert.equal(r.message.simulated, true);
  });

  it("the conversation list shows simulated, and inbound messages are unaffected", async () => {
    await sendOne(service);
    const list = await store.listConversations({ filter: "all", page: 1, pageSize: 10, meId: "u1" }, NOW);
    assert.equal(list.items[0].lastState, "simulated");
    const inbound = (await store.listMessages(PHONE, { limit: 50 }, NOW)).items.find((m) => m.direction === "INBOUND")!;
    assert.equal(inbound.state, "received");
    assert.equal(inbound.simulated, false);
  });
});
