import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { ADMIN_OK, asSuper, call, startInboxApp, SUPER, tokenFor, type InboxApp } from "./app.js";
import { OTHER_PHONE, PHONE, readyConfig } from "./fakes.js";
import { WhatsappApiError } from "../../src/modules/whatsapp/whatsapp.client.js";

let app: InboxApp;
const base = () => `/whatsapp/conversations/${PHONE}`;
const minutesAgo = (m: number) => new Date(app.now.current.getTime() - m * 60_000);

before(async () => {
  app = await startInboxApp({ users: [SUPER, ADMIN_OK, { id: "learner-1", firstName: "Lee", lastName: "Learner", email: "lee@example.com", roles: ["USER"] }] });
});
after(() => app.close());
beforeEach(() => {
  app.now.current = new Date("2026-11-19T12:00:00Z");
  app.db.messages = [];
  app.db.conversations = [];
  app.db.events = [];
  app.db.failOn = null;
  app.sender.calls.length = 0;
  app.sender.behaviour = async (_t, _x, n) => ({ waMessageId: `wamid.OUT${n}` });
  app.config.current = readyConfig();
  app.db.inbound(PHONE, "Hello, I need help", minutesAgo(30), { contactName: "Asha Verma" });
});

describe("POST /messages (send a reply)", () => {
  it("201 on first send with the message in its final state, 200 on a repeat, one WhatsApp call", async () => {
    const body = { text: "Happy to help!", clientRequestId: "req-http-0001" };
    const first = await asSuper(app, "POST", `${base()}/messages`, body);
    assert.equal(first.status, 201);
    assert.equal(first.json.data.created, true);
    assert.equal(first.json.data.message.state, "accepted");
    assert.equal(first.json.data.message.sentBy.name, "Sam Super");
    const second = await asSuper(app, "POST", `${base()}/messages`, body);
    assert.equal(second.status, 200);
    assert.equal(second.json.data.created, false);
    assert.equal(second.json.data.message.id, first.json.data.message.id);
    assert.equal(app.sender.calls.length, 1);
  });

  it("sends the text exactly as typed: <, >, & and quotes are not HTML-escaped by the global sanitizer", async () => {
    const text = `Price < 500 & "free" shipping > 100 <b>x</b>`;
    const r = await asSuper(app, "POST", `${base()}/messages`, { text, clientRequestId: "req-http-0002" });
    assert.equal(r.status, 201);
    assert.equal(app.sender.calls[0].text, text);
    assert.equal(app.db.messages.find((m) => m.direction === "OUTBOUND")!.textBody, text);
    assert.equal(r.json.data.message.text, text);
  });

  it("trims whitespace, normalises CRLF and strips control characters", async () => {
    await asSuper(app, "POST", `${base()}/messages`, { text: "  line1\r\nline2\u0000\u0007  ", clientRequestId: "req-http-0003" });
    assert.equal(app.sender.calls[0].text, "line1\nline2");
  });

  it("validation: empty, whitespace-only, too long, non-string, missing or malformed clientRequestId, bad contact id", async () => {
    const t = (body: unknown, path = base()) => asSuper(app, "POST", `${path}/messages`, body);
    assert.equal((await t({ clientRequestId: "req-http-0004" })).status, 400);
    assert.equal((await t({ text: "   ", clientRequestId: "req-http-0004" })).status, 400);
    assert.equal((await t({ text: 5, clientRequestId: "req-http-0004" })).status, 400);
    assert.equal((await t({ text: "x".repeat(4097), clientRequestId: "req-http-0004" })).status, 400);
    assert.equal((await t({ text: "x".repeat(4096), clientRequestId: "req-http-0004" })).status, 201);
    assert.equal((await t({ text: "hi" })).status, 400);
    for (const id of ["short", "has space 1234", "retry-of:abc12345", "x".repeat(65), "bad/slash123"]) {
      assert.equal((await t({ text: "hi", clientRequestId: id })).status, 400, id);
    }
    assert.equal((await t({ text: "hi", clientRequestId: "req-http-0005" }, "/whatsapp/conversations/abc")).status, 400);
    assert.equal((await call(app, "POST", `${base()}/messages`, { token: tokenFor("SUPERADMIN"), rawBody: "{not json" })).status, 400);
  });

  it("409 WINDOW_CLOSED (template required) when the customer's last message is over 24h old; nothing is sent or saved", async () => {
    app.db.messages = [];
    app.db.inbound(PHONE, "ancient", new Date(app.now.current.getTime() - 25 * 3600_000));
    const r = await asSuper(app, "POST", `${base()}/messages`, { text: "hello?", clientRequestId: "req-http-0006" });
    assert.equal(r.status, 409);
    assert.equal(r.json.data.code, "WINDOW_CLOSED");
    assert.match(r.json.message, /template/i);
    assert.equal(app.sender.calls.length, 0);
    assert.equal(app.db.messages.filter((m) => m.direction === "OUTBOUND").length, 0);
  });

  it("503 NOT_CONFIGURED when sending is not enabled", async () => {
    app.config.current = readyConfig({ outboundEnabled: false });
    const r = await asSuper(app, "POST", `${base()}/messages`, { text: "hi", clientRequestId: "req-http-0007" });
    assert.equal(r.status, 503);
    assert.equal(r.json.data.code, "NOT_CONFIGURED");
    assert.equal(app.sender.calls.length, 0);
  });

  it("a WhatsApp rejection is a 201 with the message in FAILED state and a human-readable reason", async () => {
    app.sender.behaviour = async () => {
      throw new WhatsappApiError("raw", 400, 131047);
    };
    const r = await asSuper(app, "POST", `${base()}/messages`, { text: "hi", clientRequestId: "req-http-0008" });
    assert.equal(r.status, 201);
    assert.equal(r.json.data.message.state, "failed");
    assert.match(r.json.data.message.error.title, /24-hour window/);
    assert.equal(r.json.data.message.canRetry, true);
  });

  it("never exposes credentials in any response", async () => {
    const r = await asSuper(app, "POST", `${base()}/messages`, { text: "hi", clientRequestId: "req-http-0009" });
    const ov = await asSuper(app, "GET", "/overview");
    const all = JSON.stringify([r.json, ov.json]);
    for (const secret of ["test_access_token_value_inbox", "test_app_secret_value", "test_verify_token_value", "100200300400500"]) assert.ok(!all.includes(secret));
  });

  it("an allowlisted Learning Admin can send; a plain Learning Admin cannot", async () => {
    const ok = await call(app, "POST", `${base()}/messages`, { token: tokenFor("ADMIN", ADMIN_OK.id), body: { text: "hi", clientRequestId: "req-http-0010" } });
    assert.equal(ok.status, 201);
    app.env.BUSINESS_ADMIN_EMAILS = "";
    const no = await call(app, "POST", `${base()}/messages`, { token: tokenFor("ADMIN", ADMIN_OK.id), body: { text: "hi", clientRequestId: "req-http-0011" } });
    assert.equal(no.status, 403);
    app.env.BUSINESS_ADMIN_EMAILS = "ops@example.com";
  });
});

describe("POST /messages/:id/retry", () => {
  it("retries a failed message once, even when the button is clicked twice", async () => {
    app.sender.behaviour = async (_t, _x, n) => {
      if (n === 1) throw new WhatsappApiError("x", 400, 131026);
      return { waMessageId: `wamid.OUT${n}` };
    };
    const failed = (await asSuper(app, "POST", `${base()}/messages`, { text: "retry me", clientRequestId: "req-http-0012" })).json.data.message;
    const [a, b] = await Promise.all([asSuper(app, "POST", `/whatsapp/messages/${failed.id}/retry`, {}), asSuper(app, "POST", `/whatsapp/messages/${failed.id}/retry`, {})]);
    assert.deepEqual([a.status, b.status].sort(), [200, 201]);
    assert.equal(a.json.data.message.id, b.json.data.message.id);
    assert.equal(app.sender.calls.length, 2);
    const thread = (await asSuper(app, "GET", `${base()}/messages`)).json.data.items;
    assert.equal(thread.find((m: any) => m.id === failed.id).canRetry, false);
  });

  it("404 for unknown ids, 409 for messages that did not fail, 400 for malformed ids", async () => {
    const ok = (await asSuper(app, "POST", `${base()}/messages`, { text: "fine", clientRequestId: "req-http-0013" })).json.data.message;
    assert.equal((await asSuper(app, "POST", `/whatsapp/messages/${ok.id}/retry`, {})).status, 409);
    assert.equal((await asSuper(app, "POST", "/whatsapp/messages/cdoesnotexist12345/retry", {})).status, 404);
    assert.equal((await asSuper(app, "POST", "/whatsapp/messages/x/retry", {})).status, 400);
  });
});

describe("conversation list, unread and read state", () => {
  it("lists the conversation with latest-message preview, unread count and window state", async () => {
    app.db.inbound(PHONE, "second message", minutesAgo(10));
    const r = await asSuper(app, "GET", "/whatsapp/conversations");
    const c = r.json.data.items[0];
    assert.equal(c.contactName, "Asha Verma");
    assert.equal(c.messageCount, 2);
    assert.equal(c.unreadCount, 2);
    assert.equal(c.lastPreview, "second message");
    assert.equal(c.windowOpen, true);
    assert.equal(r.json.data.unreadTotal, 1);
  });

  it("marking as read clears unread; a newer inbound message makes it unread again", async () => {
    assert.equal((await asSuper(app, "GET", "/whatsapp/conversations?filter=unread")).json.data.total, 1);
    const read = await asSuper(app, "POST", `${base()}/read`, {});
    assert.equal(read.status, 200);
    assert.equal((await asSuper(app, "GET", "/whatsapp/conversations?filter=unread")).json.data.total, 0);
    app.now.current = new Date(app.now.current.getTime() + 60_000);
    app.db.inbound(PHONE, "are you there?", app.now.current);
    const after = await asSuper(app, "GET", "/whatsapp/conversations?filter=unread");
    assert.equal(after.json.data.total, 1);
    assert.equal(after.json.data.items[0].unreadCount, 1);
  });

  it("'read up to' only covers what the person actually saw, and the marker never moves backwards", async () => {
    app.db.inbound(PHONE, "arrived while reading", minutesAgo(1));
    await asSuper(app, "POST", `${base()}/read`, { upTo: minutesAgo(5).toISOString() });
    assert.equal((await asSuper(app, "GET", `${base()}`)).json.data.unreadCount, 1, "the newer message is still unread");
    await asSuper(app, "POST", `${base()}/read`, {});
    const marker = app.db.conversations[0].lastReadAt as Date;
    await asSuper(app, "POST", `${base()}/read`, { upTo: minutesAgo(20).toISOString() });
    assert.equal(app.db.conversations[0].lastReadAt.getTime(), marker.getTime());
    assert.equal((await asSuper(app, "POST", `${base()}/read`, { upTo: "yesterday-ish" })).status, 400);
  });

  it("our own outbound messages never count as unread", async () => {
    await asSuper(app, "POST", `${base()}/read`, {});
    await asSuper(app, "POST", `${base()}/messages`, { text: "reply", clientRequestId: "req-http-0014" });
    assert.equal((await asSuper(app, "GET", "/whatsapp/conversations?filter=unread")).json.data.total, 0);
  });

  it("search finds conversations by name or by phone number as typed with spaces and +", async () => {
    app.db.inbound(OTHER_PHONE, "other customer", minutesAgo(60), { contactName: "Ravi Kumar" });
    const byName = await asSuper(app, "GET", "/whatsapp/conversations?q=ravi");
    assert.deepEqual(byName.json.data.items.map((c: any) => c.contactWaId), [OTHER_PHONE]);
    const byPhone = await asSuper(app, "GET", `/whatsapp/conversations?q=${encodeURIComponent("+91 98765 43210")}`);
    assert.deepEqual(byPhone.json.data.items.map((c: any) => c.contactWaId), [PHONE]);
  });
});

describe("assignment and history", () => {
  it("assigns, reassigns and unassigns; the history records each change in order", async () => {
    const a1 = await asSuper(app, "PUT", `${base()}/assignment`, { assigneeId: SUPER.id });
    assert.equal(a1.status, 200);
    assert.equal(a1.json.data.changed, true);
    assert.equal(a1.json.data.contact.assignee.name, "Sam Super");
    app.now.current = new Date(app.now.current.getTime() + 1000);
    const a2 = await asSuper(app, "PUT", `${base()}/assignment`, { assigneeId: ADMIN_OK.id });
    assert.equal(a2.json.data.contact.assignee.name, "Asha Ops");
    app.now.current = new Date(app.now.current.getTime() + 1000);
    const a3 = await asSuper(app, "PUT", `${base()}/assignment`, { assigneeId: null });
    assert.equal(a3.json.data.contact.assignee, null);

    const events = (await asSuper(app, "GET", `${base()}/events`)).json.data.items;
    assert.deepEqual(events.map((e: any) => [e.type, e.assignee?.name, e.author?.name]), [
      ["UNASSIGNED", "Asha Ops", "Sam Super"],
      ["ASSIGNED", "Asha Ops", "Sam Super"],
      ["ASSIGNED", "Sam Super", "Sam Super"],
    ]);
  });

  it("assigning the same person again is a no-op with no extra history", async () => {
    await asSuper(app, "PUT", `${base()}/assignment`, { assigneeId: SUPER.id });
    const again = await asSuper(app, "PUT", `${base()}/assignment`, { assigneeId: SUPER.id });
    assert.equal(again.json.data.changed, false);
    assert.equal(app.db.events.length, 1);
    const none = await asSuper(app, "PUT", `${base()}/assignment`, { assigneeId: null });
    assert.equal(none.json.data.changed, true);
    assert.equal((await asSuper(app, "PUT", `${base()}/assignment`, { assigneeId: null })).json.data.changed, false);
  });

  it("only people with Business Admin access can be assigned (422), and bad input is rejected (400)", async () => {
    assert.equal((await asSuper(app, "PUT", `${base()}/assignment`, { assigneeId: "learner-1" })).status, 422);
    assert.equal((await asSuper(app, "PUT", `${base()}/assignment`, { assigneeId: "some-unknown-user" })).status, 422);
    app.env.BUSINESS_ADMIN_EMAILS = "";
    assert.equal((await asSuper(app, "PUT", `${base()}/assignment`, { assigneeId: ADMIN_OK.id })).status, 422, "Learning Admin without allowlist is not a team member");
    app.env.BUSINESS_ADMIN_EMAILS = "ops@example.com";
    assert.equal((await asSuper(app, "PUT", `${base()}/assignment`, {})).status, 400);
    assert.equal((await asSuper(app, "PUT", `${base()}/assignment`, { assigneeId: 7 })).status, 400);
    assert.equal((await asSuper(app, "PUT", `${base()}/assignment`, { assigneeId: "bad id!" })).status, 400);
    assert.equal(app.db.events.length, 0, "failed assignments leave no history");
  });

  it("filters: Assigned to Me, Unassigned and by team member", async () => {
    app.db.inbound(OTHER_PHONE, "another", minutesAgo(5));
    await asSuper(app, "PUT", `${base()}/assignment`, { assigneeId: SUPER.id });
    const mine = await asSuper(app, "GET", "/whatsapp/conversations?filter=mine");
    assert.deepEqual(mine.json.data.items.map((c: any) => c.contactWaId), [PHONE]);
    assert.equal(mine.json.data.items[0].assignee.name, "Sam Super");
    const unassigned = await asSuper(app, "GET", "/whatsapp/conversations?filter=unassigned");
    assert.deepEqual(unassigned.json.data.items.map((c: any) => c.contactWaId), [OTHER_PHONE]);
    const byMember = await asSuper(app, "GET", `/whatsapp/conversations?assignee=${SUPER.id}`);
    assert.deepEqual(byMember.json.data.items.map((c: any) => c.contactWaId), [PHONE]);
    const asAdmin = await call(app, "GET", "/whatsapp/conversations?filter=mine", { token: tokenFor("ADMIN", ADMIN_OK.id) });
    assert.equal(asAdmin.json.data.total, 0, "'mine' is per signed-in member");
  });

  it("the team list contains only people who can open Business Admin", async () => {
    const r = await asSuper(app, "GET", "/whatsapp/team");
    assert.deepEqual(r.json.data.items.map((m: any) => m.name), ["Asha Ops", "Sam Super"]);
    assert.ok(!JSON.stringify(r.json).includes("lee@example.com"));
  });
});

describe("internal notes", () => {
  it("creates notes shown in the history, never in the WhatsApp thread, never sent to the customer", async () => {
    const n = await asSuper(app, "POST", `${base()}/notes`, { body: "Customer prefers calls after 5pm <b>VIP</b> & urgent" });
    assert.equal(n.status, 201);
    assert.equal(n.json.data.type, "NOTE");
    assert.equal(n.json.data.author.name, "Sam Super");
    assert.equal(n.json.data.body, "Customer prefers calls after 5pm <b>VIP</b> & urgent", "stored as typed");
    const events = (await asSuper(app, "GET", `${base()}/events`)).json.data.items;
    assert.equal(events.length, 1);
    const thread = (await asSuper(app, "GET", `${base()}/messages`)).json.data.items;
    assert.ok(!JSON.stringify(thread).includes("prefers calls"));
    assert.equal(app.sender.calls.length, 0);
    assert.ok(!app.db.messages.some((m) => String(m.textBody).includes("prefers calls")));
  });

  it("validates notes: empty, whitespace, over 2000 characters, wrong type", async () => {
    for (const body of [undefined, "", "   ", 5, "x".repeat(2001)]) {
      assert.equal((await asSuper(app, "POST", `${base()}/notes`, { body })).status, 400, String(body).slice(0, 10));
    }
    assert.equal((await asSuper(app, "POST", `${base()}/notes`, { body: "x".repeat(2000) })).status, 201);
  });
});

describe("message thread: ordering and pagination", () => {
  it("returns chronological order (oldest first) mixing inbound and outbound", async () => {
    app.db.messages = [];
    app.db.inbound(PHONE, "m1", minutesAgo(50));
    app.db.inbound(PHONE, "m2", minutesAgo(40), { direction: "OUTBOUND", status: "DELIVERED", sentByUserId: SUPER.id });
    app.db.inbound(PHONE, "m3", minutesAgo(30));
    app.db.inbound(OTHER_PHONE, "someone else", minutesAgo(35));
    const items = (await asSuper(app, "GET", `${base()}/messages`)).json.data.items;
    assert.deepEqual(items.map((m: any) => m.text), ["m1", "m2", "m3"]);
    assert.deepEqual(items.map((m: any) => m.state), ["received", "delivered", "received"]);
    assert.equal(items[1].sentBy.name, "Sam Super");
  });

  it("pages backwards without gaps or duplicates, even when new messages arrive between pages", async () => {
    app.db.messages = [];
    for (let i = 1; i <= 25; i++) app.db.inbound(PHONE, `msg-${String(i).padStart(2, "0")}`, minutesAgo(100 - i));
    const p1 = (await asSuper(app, "GET", `${base()}/messages?limit=10`)).json.data;
    assert.equal(p1.items.length, 10);
    assert.equal(p1.items[0].text, "msg-16");
    assert.equal(p1.items[9].text, "msg-25");
    assert.equal(p1.hasMore, true);
    app.db.inbound(PHONE, "msg-26-new", minutesAgo(1)); // arrives between page loads
    const p2 = (await asSuper(app, "GET", `${base()}/messages?limit=10&before=${p1.nextBefore}`)).json.data;
    assert.equal(p2.items[0].text, "msg-06");
    assert.equal(p2.items[9].text, "msg-15");
    const p3 = (await asSuper(app, "GET", `${base()}/messages?limit=10&before=${p2.nextBefore}`)).json.data;
    assert.deepEqual(p3.items.map((m: any) => m.text), ["msg-01", "msg-02", "msg-03", "msg-04", "msg-05"]);
    assert.equal(p3.hasMore, false);
    assert.equal(p3.nextBefore, null);
    const all = [...p3.items, ...p2.items, ...p1.items].map((m) => m.text);
    assert.equal(new Set(all).size, 25);
  });

  it("messages with identical timestamps still page deterministically", async () => {
    app.db.messages = [];
    const t = minutesAgo(10);
    for (let i = 1; i <= 6; i++) app.db.inbound(PHONE, `same-${i}`, t);
    const p1 = (await asSuper(app, "GET", `${base()}/messages?limit=4`)).json.data;
    const p2 = (await asSuper(app, "GET", `${base()}/messages?limit=4&before=${p1.nextBefore}`)).json.data;
    const seen = [...p2.items, ...p1.items].map((m) => m.text);
    assert.equal(new Set(seen).size, 6, "no duplicates or gaps across identical timestamps");
  });

  it("contact details include the 24h window state and history counts", async () => {
    const c = (await asSuper(app, "GET", base())).json.data;
    assert.equal(c.contactName, "Asha Verma");
    assert.equal(c.windowOpen, true);
    assert.ok(c.windowExpiresAt);
    assert.equal(c.messageCount, 1);
    app.now.current = new Date(app.now.current.getTime() + 25 * 3600_000);
    assert.equal((await asSuper(app, "GET", base())).json.data.windowOpen, false);
  });
});

describe("failure handling", () => {
  it("a database failure on any write is a generic 500 with no personal data in the response or logs", async () => {
    app.db.failOn = { table: "event", op: "create", error: Object.assign(new Error(`insert failed for ${PHONE} secret note`), { code: "P2010" }) };
    const logs: string[] = [];
    const orig = { log: console.log, warn: console.warn, error: console.error };
    console.log = console.warn = console.error = (...a: unknown[]) => void logs.push(a.map(String).join(" "));
    let r;
    try {
      r = await asSuper(app, "POST", `${base()}/notes`, { body: "secret note about the customer" });
    } finally {
      Object.assign(console, orig);
    }
    assert.equal(r.status, 500);
    const all = JSON.stringify(r.json) + logs.join("\n");
    assert.ok(!all.includes(PHONE) && !all.includes("secret note"));
  });
});
