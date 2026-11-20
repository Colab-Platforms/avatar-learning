// A send that timed out (or whose WhatsApp id could not be recorded) may still be delivered. When Meta's status webhook
// later arrives with an id we have never seen, it must attach to THAT message: one row, with its text, never a second
// text-less row, never a duplicate.
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { InboxService } from "../../src/modules/business-admin/inbox.service.js";
import { PrismaInboxStore } from "../../src/modules/business-admin/inbox.store.js";
import { PrismaWhatsappStore } from "../../src/modules/whatsapp/whatsapp.store.js";
import { WhatsappApiError } from "../../src/modules/whatsapp/whatsapp.client.js";
import { ADOPT_WINDOW_MS } from "../../src/modules/whatsapp/whatsapp.pending.js";
import type { StatusEvent } from "../../src/modules/whatsapp/whatsapp.types.js";
import { AdminFakeDb } from "./admin-fakes.js";
import { FakeSender, OTHER_PHONE, PHONE, readyConfig } from "./fakes.js";

let now = new Date("2026-11-19T12:00:00Z");
let db: AdminFakeDb;
let sender: FakeSender;
let store: PrismaInboxStore;
let service: InboxService;

const ago = (ms: number) => new Date(now.getTime() - ms);
const timeout = () => {
  sender.behaviour = async () => {
    throw new WhatsappApiError("WhatsApp API request timed out.", undefined, undefined, true);
  };
};
const send = (text = "Your invoice is attached", clientRequestId = "req-amb-0001", contactWaId = PHONE) => service.send({ contactWaId, text, clientRequestId, userId: "u-sender" });
const status = (waMessageId: string, s: string, over: Partial<StatusEvent> = {}): StatusEvent => ({ waMessageId, status: s, recipientId: PHONE, timestamp: new Date(1763553700 * 1000), ...over });
const hook = () => new PrismaWhatsappStore(db as never, () => now);
const outbound = () => db.messages.filter((m) => m.direction === "OUTBOUND");
const thread = async (waId = PHONE) => (await store.listMessages(waId, { limit: 50 }, now)).items;

beforeEach(() => {
  now = new Date("2026-11-19T12:00:00Z");
  db = new AdminFakeDb();
  db.clock = () => now;
  db.users = [{ id: "u-sender", firstName: "Asha", lastName: "Ops", email: "ops@example.com", roles: ["SUPERADMIN"] }];
  sender = new FakeSender();
  store = new PrismaInboxStore(db, {}, () => now);
  service = new InboxService({ store, sender, getConfig: () => readyConfig(), now: () => now });
  db.inbound(PHONE, "Hi", ago(3600_000));
  db.inbound(OTHER_PHONE, "Hello", ago(3600_000));
});

describe("late webhook after an ambiguous (timed-out) send", () => {
  it("attaches the delivery status to the SAME message: one row, with its text, no text-less duplicate", async () => {
    timeout();
    const r = await send();
    assert.equal(r.message.state, "failed");
    assert.equal(r.message.error?.ambiguous, true);
    assert.equal(r.message.canRetry, true);

    // The customer actually received it; Meta reports it with an id we never saw.
    assert.equal(await hook().applyStatusEvent(status("wamid.LATE1", "sent")), "applied");
    assert.equal(outbound().length, 1, "no second row was created");
    const [row] = outbound();
    assert.equal(row.waMessageId, "wamid.LATE1");
    assert.equal(row.textBody, "Your invoice is attached");
    assert.equal(row.sentByUserId, "u-sender");
    assert.equal(row.clientRequestId, "req-amb-0001");
    assert.equal(row.status, "SENT");
    assert.equal(row.errorTitle, null);
    assert.equal(row.errorDetails, null, "the unknown-outcome marker is cleared");

    const t = (await thread()).filter((m) => m.direction === "OUTBOUND");
    assert.equal(t.length, 1);
    assert.equal(t[0].state, "sent");
    assert.equal(t[0].error, null);
    assert.equal(t[0].canRetry, false, "it was delivered, so there is nothing to retry");
    assert.ok(t[0].text);
  });

  it("later delivered / read events update that same row and never regress", async () => {
    timeout();
    await send();
    await hook().applyStatusEvent(status("wamid.LATE1", "sent"));
    await hook().applyStatusEvent(status("wamid.LATE1", "delivered", { timestamp: new Date(1763553800 * 1000) }));
    await hook().applyStatusEvent(status("wamid.LATE1", "read", { timestamp: new Date(1763553900 * 1000) }));
    assert.equal(await hook().applyStatusEvent(status("wamid.LATE1", "delivered")), "duplicate");
    assert.equal(outbound().length, 1);
    assert.equal((await thread()).find((m) => m.direction === "OUTBOUND")!.state, "read");
  });

  it("works when the first status Meta sends is already 'delivered' or 'read'", async () => {
    timeout();
    await send();
    await hook().applyStatusEvent(status("wamid.LATE1", "read"));
    assert.equal(outbound().length, 1);
    assert.equal(outbound()[0].status, "READ");
    assert.equal(outbound()[0].textBody, "Your invoice is attached");
  });

  it("a WhatsApp 'failed' status replaces the vague timeout message with the real reason", async () => {
    timeout();
    await send();
    await hook().applyStatusEvent(status("wamid.LATE1", "failed", { error: { code: 131026, title: "Message undeliverable" } }));
    assert.equal(outbound().length, 1);
    const m = (await thread()).find((x) => x.direction === "OUTBOUND")!;
    assert.equal(m.state, "failed");
    assert.equal(m.error?.code, 131026);
    assert.equal(m.error?.ambiguous, false, "now the outcome is known");
  });

  it("two ambiguous sends are attributed oldest-first, so each status lands on its own message", async () => {
    timeout();
    await send("first message", "req-amb-0001");
    now = new Date(now.getTime() + 5000);
    await send("second message", "req-amb-0002");
    await hook().applyStatusEvent(status("wamid.A", "sent"));
    await hook().applyStatusEvent(status("wamid.B", "sent"));
    assert.equal(outbound().length, 2);
    assert.equal(outbound().find((m) => m.waMessageId === "wamid.A")!.textBody, "first message");
    assert.equal(outbound().find((m) => m.waMessageId === "wamid.B")!.textBody, "second message");
    assert.ok(outbound().every((m) => m.textBody), "no text-less rows");
  });

  it("a retry the user already made does not stop the original from being matched, and nothing is duplicated", async () => {
    timeout();
    const failed = await send();
    sender.behaviour = async (_t, _x, n) => ({ waMessageId: `wamid.OUT${n}` });
    const retried = await service.retry({ messageId: failed.message.id, userId: "u-sender" });
    assert.equal(retried.message.state, "accepted");
    // Late status for the ORIGINAL timed-out message.
    await hook().applyStatusEvent(status("wamid.ORIG", "delivered"));
    assert.equal(outbound().length, 2, "original + the user's explicit retry, both with text");
    assert.ok(outbound().every((m) => m.textBody === "Your invoice is attached"));
    assert.equal(outbound().filter((m) => m.waMessageId === "wamid.ORIG").length, 1);
  });

  it("an unrecorded WhatsApp id (accepted but the save failed) is completed by the webhook", async () => {
    sender.behaviour = async () => ({ waMessageId: "wamid.OUT1" });
    const realFind = db.whatsappMessage.findUnique;
    let armed = false;
    db.whatsappMessage.findUnique = async (args: any) => {
      if (armed) throw Object.assign(new Error("db blip"), { code: "P1001" });
      return realFind(args);
    };
    sender.behaviour = async () => {
      armed = true;
      return { waMessageId: "wamid.OUT1" };
    };
    const logs: string[] = [];
    const orig = { log: console.log, warn: console.warn, error: console.error };
    console.log = console.warn = console.error = (...a: unknown[]) => void logs.push(a.map(String).join(" "));
    try {
      await send();
    } finally {
      Object.assign(console, orig);
      db.whatsappMessage.findUnique = realFind;
    }
    assert.equal(outbound()[0].status, "SENDING");
    assert.ok(outbound()[0].waMessageId.startsWith("pending:"));
    assert.equal(await hook().applyStatusEvent(status("wamid.OUT1", "sent")), "applied");
    assert.equal(outbound().length, 1);
    assert.equal(outbound()[0].waMessageId, "wamid.OUT1");
    assert.equal(outbound()[0].status, "SENT");
    assert.equal(outbound()[0].textBody, "Your invoice is attached");
  });

  it("two statuses for the same unknown id arriving at the same moment still produce ONE row", async () => {
    timeout();
    await send();
    await Promise.all([hook().applyStatusEvent(status("wamid.LATE1", "sent")), hook().applyStatusEvent(status("wamid.LATE1", "delivered", { timestamp: new Date(1763553800 * 1000) }))]);
    assert.equal(outbound().length, 1);
    assert.equal(outbound()[0].textBody, "Your invoice is attached");
    assert.ok(["DELIVERED", "SENT"].includes(outbound()[0].status));
  });
});

describe("what must NOT be adopted (existing webhook behaviour is preserved)", () => {
  it("a status for another recipient is not attached to the pending message", async () => {
    timeout();
    await send();
    await hook().applyStatusEvent(status("wamid.OTHER", "sent", { recipientId: OTHER_PHONE }));
    const pending = outbound().find((m) => m.contactWaId === PHONE)!;
    assert.ok(pending.waMessageId.startsWith("pending:"));
    assert.equal(pending.status, "FAILED");
    assert.equal(outbound().filter((m) => m.contactWaId === OTHER_PHONE).length, 1, "the unknown message is stored as before");
  });

  it("a definite rejection (e.g. window closed) is never adopted: its status stays failed", async () => {
    sender.behaviour = async () => {
      throw new WhatsappApiError("x", 400, 131047);
    };
    await send();
    await hook().applyStatusEvent(status("wamid.SOMEOTHER", "sent"));
    const rejected = outbound().find((m) => m.waMessageId.startsWith("pending:"))!;
    assert.equal(rejected.status, "FAILED");
    assert.equal(rejected.errorCode, 131047);
    assert.equal(outbound().length, 2, "the unrelated status became its own row, exactly as before this change");
  });

  it("a pending message older than the 15-minute window is not adopted, but one just inside it is", async () => {
    timeout();
    await send();
    now = new Date(now.getTime() + ADOPT_WINDOW_MS + 60_000);
    await hook().applyStatusEvent(status("wamid.TOOLATE", "sent"));
    assert.equal(outbound().length, 2);
    assert.ok(outbound().some((m) => m.waMessageId === "wamid.TOOLATE" && !m.textBody));
  });

  it("a pending message just inside the window (14 minutes) is adopted", async () => {
    timeout();
    await send();
    now = new Date(now.getTime() + ADOPT_WINDOW_MS - 60_000);
    await hook().applyStatusEvent(status("wamid.JUSTINSIDE", "sent"));
    assert.equal(outbound().length, 1);
    assert.equal(outbound()[0].textBody, "Your invoice is attached");
  });

  it("unsupported statuses (e.g. 'deleted') never adopt", async () => {
    timeout();
    await send();
    assert.equal(await hook().applyStatusEvent(status("wamid.X", "deleted")), "ignored");
    assert.ok(outbound()[0].waMessageId.startsWith("pending:"));
  });

  it("with no pending message, a status for an unknown id still creates the OUTBOUND row (unchanged behaviour)", async () => {
    assert.equal(await hook().applyStatusEvent(status("wamid.EXTERNAL", "sent")), "applied");
    assert.equal(outbound().length, 1);
    assert.equal(outbound()[0].textBody, null);
  });

  it("without the optional query methods the store behaves exactly as it did before (feature simply off)", async () => {
    timeout();
    await send();
    const legacyDb = {
      whatsappMessage: { findUnique: db.whatsappMessage.findUnique, create: db.whatsappMessage.create, update: db.whatsappMessage.update },
    };
    const legacy = new PrismaWhatsappStore(legacyDb as never);
    await legacy.applyStatusEvent(status("wamid.LEGACY", "sent"));
    assert.equal(outbound().length, 2);
  });
});
