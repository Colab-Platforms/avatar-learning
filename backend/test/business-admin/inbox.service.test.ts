import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { InboxService } from "../../src/modules/business-admin/inbox.service.js";
import { PrismaInboxStore } from "../../src/modules/business-admin/inbox.store.js";
import { InboxError } from "../../src/modules/business-admin/inbox.errors.js";
import { WINDOW_MS } from "../../src/modules/business-admin/inbox.plan.js";
import { PrismaWhatsappStore } from "../../src/modules/whatsapp/whatsapp.store.js";
import { WhatsappApiError } from "../../src/modules/whatsapp/whatsapp.client.js";
import type { StatusEvent } from "../../src/modules/whatsapp/whatsapp.types.js";
import { FakeInboxDb, FakeSender, OTHER_PHONE, PHONE, readyConfig, SENDER_SECRETS } from "./fakes.js";

const TEXT = "Thanks for reaching out about pricing 7731";
let now = new Date("2026-11-19T12:00:00Z");
let db: FakeInboxDb;
let sender: FakeSender;
let config = readyConfig();
let store: PrismaInboxStore;
let service: InboxService;

const ago = (ms: number) => new Date(now.getTime() - ms);
const send = (over: Partial<{ text: string; clientRequestId: string; contactWaId: string }> = {}) =>
  service.send({ contactWaId: PHONE, text: TEXT, clientRequestId: "req-00000001", userId: "u-sender", ...over });
const status = (waMessageId: string, s: string, ts = "1763553700", extra: Partial<StatusEvent> = {}): StatusEvent => ({
  waMessageId,
  status: s,
  recipientId: PHONE,
  timestamp: new Date(Number(ts) * 1000),
  ...extra,
});
const webhook = () => new PrismaWhatsappStore(db as never);
const outbound = () => db.messages.filter((m) => m.direction === "OUTBOUND");

/** Captures everything logged during `fn`, to prove nothing sensitive is written. */
async function captureLogs<T>(fn: () => Promise<T>): Promise<{ result: T; logs: string }> {
  const lines: string[] = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  console.log = console.warn = console.error = (...a: unknown[]) => void lines.push(a.map(String).join(" "));
  try {
    return { result: await fn(), logs: lines.join("\n") };
  } finally {
    Object.assign(console, orig);
  }
}

beforeEach(() => {
  now = new Date("2026-11-19T12:00:00Z");
  db = new FakeInboxDb();
  db.clock = () => now;
  db.users = [{ id: "u-sender", firstName: "Asha", lastName: "Ops", email: "ops@example.com", roles: ["SUPERADMIN"] }];
  sender = new FakeSender();
  config = readyConfig();
  store = new PrismaInboxStore(db, {});
  service = new InboxService({ store, sender, getConfig: () => config, now: () => now });
  // A customer who wrote 1 hour ago: the 24h window is open.
  db.inbound(PHONE, "Hi, what does it cost?", ago(3600_000), { contactName: "Asha Verma" });
});

describe("outbound text messages", () => {
  it("sends, persists the WhatsApp message id, the sender and the text, and ends in SENT", async () => {
    const r = await send();
    assert.equal(r.created, true);
    assert.equal(r.message.state, "accepted");
    assert.deepEqual(sender.calls, [{ to: PHONE, text: TEXT }]);
    const [row] = outbound();
    assert.equal(row.waMessageId, "wamid.OUT1");
    assert.equal(row.status, "SENT");
    assert.equal(row.sentByUserId, "u-sender");
    assert.equal(row.textBody, TEXT);
    assert.equal(row.clientRequestId, "req-00000001");
    assert.deepEqual(r.message.sentBy, { id: "u-sender", name: "Asha Ops" });
    // API acceptance only: Meta's `sent` webhook (not our call) is what fills sentAt.
    assert.equal(row.sentAt ?? null, null);
    assert.ok(typeof (row.payload as { acceptedAt?: string })?.acceptedAt === "string", "the acceptance time is kept");
  });

  it("the row exists as SENDING while WhatsApp is being called, so a crash cannot lose the message", async () => {
    let during: any;
    sender.behaviour = async () => {
      during = { ...outbound()[0] };
      return { waMessageId: "wamid.OUT1" };
    };
    await send();
    assert.equal(during.status, "SENDING");
    assert.equal(during.textBody, TEXT);
    assert.ok(during.waMessageId.startsWith("pending:"));
  });

  it("is idempotent: the same clientRequestId (retry, double click) never sends twice", async () => {
    const first = await send();
    const again = await send();
    assert.equal(again.created, false);
    assert.equal(again.message.id, first.message.id);
    assert.equal(sender.calls.length, 1);
    assert.equal(outbound().length, 1);
  });

  it("two simultaneous submits create one row and one WhatsApp call", async () => {
    sender.behaviour = async (_t, _x, n) => {
      await new Promise((r) => setTimeout(r, 20));
      return { waMessageId: `wamid.OUT${n}` };
    };
    const [a, b] = await Promise.all([send(), send()]);
    assert.equal(sender.calls.length, 1);
    assert.equal(outbound().length, 1);
    assert.equal([a.created, b.created].filter(Boolean).length, 1);
  });

  it("the same request id for another conversation is refused, not silently reused", async () => {
    db.inbound(OTHER_PHONE, "hello", ago(1000));
    await send();
    await assert.rejects(() => send({ contactWaId: OTHER_PHONE }), (e: any) => e instanceof InboxError && e.code === "CONFLICT" && e.statusCode === 409);
    assert.equal(sender.calls.length, 1);
  });

  it("a repeat of an earlier request still reports it after the window has since closed", async () => {
    const first = await send();
    now = new Date(now.getTime() + 2 * WINDOW_MS);
    const again = await send();
    assert.equal(again.message.id, first.message.id);
    assert.equal(sender.calls.length, 1);
  });
});

describe("24-hour customer service window", () => {
  it("allows a free-form reply 23h59m after the customer's last message", async () => {
    db.messages = [];
    db.inbound(PHONE, "old but inside the window", ago(WINDOW_MS - 60_000));
    assert.equal((await send()).message.state, "accepted");
  });

  it("refuses at exactly 24h: no row, no WhatsApp call, and the error says a template is required", async () => {
    db.messages = [];
    db.inbound(PHONE, "exactly a day ago", ago(WINDOW_MS));
    await assert.rejects(send, (e: any) => e instanceof InboxError && e.code === "WINDOW_CLOSED" && e.statusCode === 409 && /template/i.test(e.message));
    assert.equal(sender.calls.length, 0);
    assert.equal(outbound().length, 0);
  });

  it("uses the customer's WhatsApp timestamp, not when we stored the message", async () => {
    db.messages = [];
    db.inbound(PHONE, "stored recently, sent two days ago", ago(1000), { messageTimestamp: ago(2 * WINDOW_MS) });
    await assert.rejects(send, (e: any) => e.code === "WINDOW_CLOSED");
  });

  it("our own outbound messages do not extend the window", async () => {
    db.messages = [];
    db.inbound(PHONE, "ancient", ago(3 * WINDOW_MS));
    db.inbound(PHONE, "we replied recently", ago(1000), { direction: "OUTBOUND", status: "SENT", waMessageId: "wamid.OLDOUT" });
    await assert.rejects(send, (e: any) => e.code === "WINDOW_CLOSED");
  });

  it("refuses a conversation that does not exist", async () => {
    await assert.rejects(() => send({ contactWaId: "447700900999" }), (e: any) => e.code === "NO_CONVERSATION" && e.statusCode === 404);
    assert.equal(sender.calls.length, 0);
  });
});

describe("sending must be explicitly enabled", () => {
  for (const [label, over] of [
    ["integration disabled", { enabled: false }],
    ["no access token", { accessToken: undefined }],
    ["no phone number id", { phoneNumberId: undefined }],
    ["WHATSAPP_OUTBOUND_ENABLED off", { outboundEnabled: false }],
    ["WHATSAPP_OUTBOUND_ENABLED absent", { outboundEnabled: undefined }],
  ] as const) {
    it(`${label}: 503 NOT_CONFIGURED, nothing persisted, nothing sent`, async () => {
      config = readyConfig(over);
      await assert.rejects(send, (e: any) => e instanceof InboxError && e.code === "NOT_CONFIGURED" && e.statusCode === 503);
      assert.equal(sender.calls.length, 0);
      assert.equal(outbound().length, 0);
    });
  }
});

describe("WhatsApp errors and failed-send persistence", () => {
  it("a rejection is stored as FAILED with a meaningful reason and can be retried", async () => {
    sender.behaviour = async () => {
      throw new WhatsappApiError("WhatsApp API request failed (400, code 131026): internal text 919876543210", 400, 131026);
    };
    const r = await send();
    assert.equal(r.message.state, "failed");
    assert.match(r.message.error?.title ?? "", /not be on WhatsApp/);
    assert.equal(r.message.error?.code, 131026);
    assert.equal(r.message.error?.ambiguous, false);
    assert.equal(r.message.canRetry, true);
    const [row] = outbound();
    assert.equal(row.status, "FAILED");
    assert.ok(row.failedAt);
    assert.ok(!JSON.stringify(row).includes("internal text"), "Meta's raw message is not stored");
  });

  it("unknown Meta codes get a generic but honest message", async () => {
    sender.behaviour = async () => {
      throw new WhatsappApiError("boom", 400, 999999);
    };
    assert.equal((await send()).message.error?.title, "WhatsApp rejected this message.");
  });

  it("a timeout is recorded as an unconfirmed failure that warns the message may still arrive", async () => {
    sender.behaviour = async () => {
      throw new WhatsappApiError("WhatsApp API request timed out.", undefined, undefined, true);
    };
    const r = await send();
    assert.equal(r.message.state, "failed");
    assert.equal(r.message.error?.ambiguous, true);
    assert.match(r.message.error?.title ?? "", /may still receive/);
  });

  it("an unexpected exception is a safe failed state, not a crash", async () => {
    sender.behaviour = async () => {
      throw new TypeError("kaboom");
    };
    const r = await send();
    assert.equal(r.message.state, "failed");
    assert.equal(r.message.error?.ambiguous, false);
  });

  it("logs never contain the message text, the customer's number or credentials", async () => {
    sender.behaviour = async () => {
      throw new WhatsappApiError(`failed for ${PHONE} text ${TEXT} token ${SENDER_SECRETS.token}`, 400, 131047);
    };
    const { logs } = await captureLogs(() => send());
    for (const secret of [PHONE, TEXT, SENDER_SECRETS.token, "Asha"]) assert.ok(!logs.includes(secret), `leaked ${secret.slice(0, 6)}`);
  });

  it("if WhatsApp accepted the message but recording it fails, nothing is resent and the row stays SENDING", async () => {
    db.failOn = { table: "msg", op: "findUnique", error: Object.assign(new Error("db blip"), { code: "P1001" }) };
    // Fail only the markSent transaction's lookups (first findUnique happens in markSent after createPending's own lookups).
    const real = db.whatsappMessage.findUnique;
    let armed = false;
    db.whatsappMessage.findUnique = async (args: any) => {
      if (armed) throw Object.assign(new Error("db blip"), { code: "P1001" });
      return real(args);
    };
    db.failOn = null;
    sender.behaviour = async () => {
      armed = true;
      return { waMessageId: "wamid.OUT1" };
    };
    const { result } = await captureLogs(() => send());
    db.whatsappMessage.findUnique = real;
    assert.equal(sender.calls.length, 1);
    assert.equal(outbound()[0].status, "SENDING");
    assert.ok(["sending", "unconfirmed"].includes(result.message.state));
    now = new Date(now.getTime() + 5 * 60_000);
    assert.equal((await store.toDto(outbound()[0] as never, now)).state, "unconfirmed");
  });
});

describe("retry", () => {
  const failFirst = () => {
    sender.behaviour = async (_t, _x, n) => {
      if (n === 1) throw new WhatsappApiError("x", 400, 131026);
      return { waMessageId: `wamid.OUT${n}` };
    };
  };

  it("resends a failed message as a NEW row, keeps the failure as history, and hides the retry button", async () => {
    failFirst();
    const failed = await send();
    const retried = await service.retry({ messageId: failed.message.id, userId: "u-sender" });
    assert.equal(retried.created, true);
    assert.equal(retried.message.state, "accepted");
    assert.notEqual(retried.message.id, failed.message.id);
    assert.equal(sender.calls.length, 2);
    assert.equal(sender.calls[1].text, TEXT);
    assert.equal(outbound().length, 2);
    const page = await store.listMessages(PHONE, { limit: 50 }, now);
    const original = page.items.find((m) => m.id === failed.message.id)!;
    assert.equal(original.state, "failed");
    assert.equal(original.canRetry, false, "already retried");
  });

  it("a double click on Retry sends once", async () => {
    failFirst();
    const failed = await send();
    sender.behaviour = async (_t, _x, n) => {
      await new Promise((r) => setTimeout(r, 20));
      return { waMessageId: `wamid.OUT${n}` };
    };
    const [a, b] = await Promise.all([service.retry({ messageId: failed.message.id, userId: "u" }), service.retry({ messageId: failed.message.id, userId: "u" })]);
    assert.equal(sender.calls.length, 2, "one original attempt + one retry");
    assert.equal(a.message.id, b.message.id);
    assert.equal(outbound().length, 2);
  });

  it("a failed retry can be retried again (chain), each attempt idempotent", async () => {
    sender.behaviour = async (_t, _x, n) => {
      if (n <= 2) throw new WhatsappApiError("x", 400, 131026);
      return { waMessageId: `wamid.OUT${n}` };
    };
    const f1 = await send();
    const f2 = await service.retry({ messageId: f1.message.id, userId: "u" });
    assert.equal(f2.message.state, "failed");
    assert.equal(f2.message.canRetry, true);
    const ok = await service.retry({ messageId: f2.message.id, userId: "u" });
    assert.equal(ok.message.state, "accepted");
    assert.equal(sender.calls.length, 3);
  });

  it("only failed outbound messages can be retried", async () => {
    const ok = await send();
    await assert.rejects(() => service.retry({ messageId: ok.message.id, userId: "u" }), (e: any) => e.code === "NOT_RETRYABLE" && e.statusCode === 409);
    const inboundId = db.messages.find((m) => m.direction === "INBOUND")!.id;
    await assert.rejects(() => service.retry({ messageId: inboundId, userId: "u" }), (e: any) => e.code === "NOT_FOUND");
    await assert.rejects(() => service.retry({ messageId: "cdoesnotexist12345", userId: "u" }), (e: any) => e.code === "NOT_FOUND");
    assert.equal(sender.calls.length, 1);
  });

  it("the 24h window is re-checked on retry", async () => {
    failFirst();
    const failed = await send();
    now = new Date(now.getTime() + 2 * WINDOW_MS);
    await assert.rejects(() => service.retry({ messageId: failed.message.id, userId: "u" }), (e: any) => e.code === "WINDOW_CLOSED");
    assert.equal(sender.calls.length, 1);
  });

  it("retry is refused while sending is not enabled", async () => {
    failFirst();
    const failed = await send();
    config = readyConfig({ outboundEnabled: false });
    await assert.rejects(() => service.retry({ messageId: failed.message.id, userId: "u" }), (e: any) => e.code === "NOT_CONFIGURED");
  });
});

describe("delivery status webhooks on messages sent from the inbox", () => {
  const sentMessage = async () => (await send()).message;
  const state = async (id: string) => (await store.listMessages(PHONE, { limit: 50 }, now)).items.find((m) => m.id === id)!;

  it("sent -> delivered -> read updates the same row", async () => {
    const m = await sentMessage();
    assert.equal(await webhook().applyStatusEvent(status("wamid.OUT1", "delivered")), "applied");
    assert.equal((await state(m.id)).state, "delivered");
    assert.equal(await webhook().applyStatusEvent(status("wamid.OUT1", "read", "1763553800")), "applied");
    assert.equal((await state(m.id)).state, "read");
    assert.equal(outbound().length, 1, "no duplicate message row");
  });

  it("never regresses: a late 'delivered' or 'sent' after 'read' changes nothing", async () => {
    const m = await sentMessage();
    await webhook().applyStatusEvent(status("wamid.OUT1", "read", "1763553800"));
    assert.equal(await webhook().applyStatusEvent(status("wamid.OUT1", "delivered", "1763553900")), "applied", "late timestamp is filled in");
    // The API call no longer pre-fills sentAt, so Meta's late `sent` fills in its timestamp ("applied") but never moves the state.
    assert.equal(await webhook().applyStatusEvent(status("wamid.OUT1", "sent", "1763553950")), "applied");
    assert.equal(await webhook().applyStatusEvent(status("wamid.OUT1", "sent", "1763553950")), "duplicate");
    assert.equal((await state(m.id)).state, "read");
  });

  it("out-of-order delivery (read before delivered) still ends in read", async () => {
    const m = await sentMessage();
    await webhook().applyStatusEvent(status("wamid.OUT1", "read"));
    await webhook().applyStatusEvent(status("wamid.OUT1", "delivered"));
    assert.equal((await state(m.id)).state, "read");
  });

  it("a replayed webhook is reported as a duplicate and creates nothing", async () => {
    await sentMessage();
    await webhook().applyStatusEvent(status("wamid.OUT1", "delivered"));
    const before = JSON.stringify(db.messages);
    assert.equal(await webhook().applyStatusEvent(status("wamid.OUT1", "delivered")), "duplicate");
    assert.equal(JSON.stringify(db.messages), before);
    assert.equal(outbound().length, 1);
  });

  it("a failed status webhook (e.g. window violation) marks the message failed with the reason and offers retry", async () => {
    const m = await sentMessage();
    await webhook().applyStatusEvent(status("wamid.OUT1", "failed", "1763553700", { error: { code: 131047, title: "Re-engagement message" } }));
    const s = await state(m.id);
    assert.equal(s.state, "failed");
    assert.equal(s.error?.code, 131047);
    assert.equal(s.canRetry, true);
  });

  it("'failed' arriving after 'delivered' is ignored (cannot un-deliver)", async () => {
    const m = await sentMessage();
    await webhook().applyStatusEvent(status("wamid.OUT1", "delivered"));
    assert.equal(await webhook().applyStatusEvent(status("wamid.OUT1", "failed", "1763553800", { error: { code: 1, title: "x" } })), "duplicate");
    assert.equal((await state(m.id)).state, "delivered");
  });

  it("when Meta's status webhook beats our own save, ONE row remains with the text, the sender and the furthest status", async () => {
    // We called WhatsApp; before we record the id, Meta's 'sent' and 'delivered' webhooks arrive and create a status-only row.
    sender.behaviour = async () => {
      await webhook().applyStatusEvent(status("wamid.RACE1", "sent"));
      await webhook().applyStatusEvent(status("wamid.RACE1", "delivered", "1763553800"));
      return { waMessageId: "wamid.RACE1" };
    };
    const r = await send();
    assert.equal(outbound().length, 1, "no duplicate row");
    const [row] = outbound();
    assert.equal(row.waMessageId, "wamid.RACE1");
    assert.equal(row.textBody, TEXT);
    assert.equal(row.sentByUserId, "u-sender");
    assert.equal(row.clientRequestId, "req-00000001");
    assert.equal(row.status, "DELIVERED", "status does not regress to SENT");
    assert.equal(r.message.state, "delivered");
    // and the idempotency key still works
    assert.equal((await send()).created, false);
  });

  it("an inbound message delivered twice creates one row (existing duplicate protection is intact)", async () => {
    const ev = { waMessageId: "wamid.IN-DUP", from: PHONE, type: "text", textBody: "again", raw: {} };
    assert.equal(await webhook().saveInboundMessage(ev), "created");
    assert.equal(await webhook().saveInboundMessage(ev), "duplicate");
    assert.equal(db.messages.filter((m) => m.waMessageId === "wamid.IN-DUP").length, 1);
  });
});
