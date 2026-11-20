// Run with: npm run test:logic   (Node's built-in test runner; no browser, no network)
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ATTACHMENT_ACCEPT,
  statusView,
  timelineRows,
  STATE_HELP,
  checkAttachment,
  fillTemplate,
  formatBytes,
  parseContactsCsv,
  previewText,
  templateReady,
  composerBlock,
  dayLabel,
  debounce,
  decideScroll,
  initials,
  isLocal,
  isNearBottom,
  localMessage,
  mergeThread,
  newClientRequestId,
  shortTime,
  stateLabel,
  unreadBadge,
  windowLabel,
  displayName,
} from "./inboxLogic";
import type { InboxMessage } from "./businessAdminApi";

const msg = (id: string, at: string, over: Partial<InboxMessage> = {}): InboxMessage => ({
  id,
  direction: "INBOUND",
  state: "received",
  type: "text",
  kind: "text",
  text: id,
  media: null,
  template: null,
  replyTo: null,
  at,
  sentBy: null,
  error: null,
  canRetry: false,
  clientRequestId: null,
  ...over,
});

describe("mergeThread (ordering, duplicates, optimistic messages)", () => {
  it("orders chronologically across sources and breaks ties by id", () => {
    const out = mergeThread([[msg("c", "2026-11-19T10:02:00Z"), msg("a", "2026-11-19T10:00:00Z")], [msg("b", "2026-11-19T10:01:00Z"), msg("b2", "2026-11-19T10:01:00Z")]], []);
    assert.deepEqual(out.map((m) => m.id), ["a", "b", "b2", "c"]);
  });

  it("deduplicates by id and lets the newest fetch win (status moves forward)", () => {
    const old = msg("x", "2026-11-19T10:00:00Z", { direction: "OUTBOUND", state: "sent" });
    const fresh = msg("x", "2026-11-19T10:00:00Z", { direction: "OUTBOUND", state: "delivered" });
    const out = mergeThread([[old], [fresh]], []);
    assert.equal(out.length, 1);
    assert.equal(out[0].state, "delivered");
  });

  it("a stale copy from the send response never overrides a fresher poll (later sources win)", () => {
    const fromSend = msg("x", "2026-11-19T10:00:00Z", { direction: "OUTBOUND", state: "sent", canRetry: false });
    const fromPoll = msg("x", "2026-11-19T10:00:00Z", { direction: "OUTBOUND", state: "read" });
    assert.equal(mergeThread([[], [fromSend], [fromPoll]], [])[0].state, "read");
    const failedFromSend = msg("f", "2026-11-19T10:00:00Z", { direction: "OUTBOUND", state: "failed", canRetry: true });
    const afterRetry = msg("f", "2026-11-19T10:00:00Z", { direction: "OUTBOUND", state: "failed", canRetry: false });
    assert.equal(mergeThread([[], [failedFromSend], [afterRetry]], [])[0].canRetry, false);
  });

  it("keeps an unconfirmed local message at the end, then drops it once the server returns the same clientRequestId", () => {
    const local = localMessage("hello", "web-req-1", { id: "u1", name: "Asha" }, new Date("2026-11-19T10:05:00Z"));
    const history = [msg("a", "2026-11-19T10:00:00Z")];
    const before = mergeThread([history], [local]);
    assert.deepEqual(before.map((m) => m.id), ["a", "local-web-req-1"]);
    assert.equal(isLocal(before[1]), true);
    const confirmed = msg("srv1", "2026-11-19T10:05:01Z", { direction: "OUTBOUND", state: "sent", clientRequestId: "web-req-1" });
    const after = mergeThread([history, [confirmed]], [local]);
    assert.deepEqual(after.map((m) => m.id), ["a", "srv1"], "no duplicate bubble for the same message");
  });

  it("two different local messages both stay until confirmed independently", () => {
    const l1 = localMessage("one", "web-req-1", null);
    const l2 = localMessage("two", "web-req-2", null);
    const out = mergeThread([[]], [l1, l2]);
    assert.equal(out.length, 2);
    const confirmed1 = msg("s1", "2026-11-19T10:00:00Z", { clientRequestId: "web-req-1" });
    assert.deepEqual(mergeThread([[confirmed1]], [l1, l2]).map((m) => m.id), ["s1", "local-web-req-2"]);
  });

  it("older pages prepended later still land in order", () => {
    const latest = [msg("m5", "2026-11-19T10:05:00Z"), msg("m6", "2026-11-19T10:06:00Z")];
    const older = [msg("m1", "2026-11-19T10:01:00Z"), msg("m2", "2026-11-19T10:02:00Z")];
    assert.deepEqual(mergeThread([older, latest], []).map((m) => m.id), ["m1", "m2", "m5", "m6"]);
  });
});

describe("auto-scroll rules", () => {
  it("isNearBottom uses a small threshold", () => {
    assert.equal(isNearBottom({ scrollTop: 920, clientHeight: 500, scrollHeight: 1500 }), true);
    assert.equal(isNearBottom({ scrollTop: 100, clientHeight: 500, scrollHeight: 1500 }), false);
    assert.equal(isNearBottom({ scrollTop: 0, clientHeight: 500, scrollHeight: 500 }), true, "short threads are always at the bottom");
  });

  it("follows new messages when the viewer is at the bottom, but not when reading history", () => {
    assert.deepEqual(decideScroll({ conversationChanged: false, addedAtEnd: 2, wasNearBottom: true, lastIsOwnLocal: false }), { scrollToBottom: true, showNewChip: false });
    assert.deepEqual(decideScroll({ conversationChanged: false, addedAtEnd: 2, wasNearBottom: false, lastIsOwnLocal: false }), { scrollToBottom: false, showNewChip: true });
  });

  it("opening a conversation or sending always scrolls to the newest", () => {
    assert.equal(decideScroll({ conversationChanged: true, addedAtEnd: 0, wasNearBottom: false, lastIsOwnLocal: false }).scrollToBottom, true);
    assert.equal(decideScroll({ conversationChanged: false, addedAtEnd: 1, wasNearBottom: false, lastIsOwnLocal: true }).scrollToBottom, true);
  });

  it("does nothing when no new message arrived at the end (e.g. a status tick or older page)", () => {
    assert.deepEqual(decideScroll({ conversationChanged: false, addedAtEnd: 0, wasNearBottom: false, lastIsOwnLocal: false }), { scrollToBottom: false, showNewChip: false });
  });
});

describe("labels", () => {
  it("message states read clearly", () => {
    assert.deepEqual(
      (["sending", "accepted", "sent", "delivered", "read", "failed", "unconfirmed", "simulated"] as const).map(stateLabel),
      ["Sending…", "Accepted", "Sent", "Delivered", "Read", "Failed", "Not confirmed", "Simulated"],
    );
  });

  it("reply window text counts down and reports closed", () => {
    const now = new Date("2026-11-19T12:00:00Z");
    assert.deepEqual(windowLabel(true, "2026-11-19T15:12:30Z", now), { open: true, text: "Reply window open for 3h 12m" });
    assert.deepEqual(windowLabel(true, "2026-11-19T12:25:00Z", now), { open: true, text: "Reply window closes in 25 min" });
    assert.equal(windowLabel(false, null, now).open, false);
    assert.equal(windowLabel(true, "2026-11-19T11:59:00Z", now).open, false, "expired while the page was open");
    assert.match(windowLabel(false, null, now).text, /closed/);
  });

  it("names, initials and badges", () => {
    assert.equal(displayName({ contactName: "Asha Verma", contactWaId: "919800000001" }), "Asha Verma");
    assert.equal(displayName({ contactName: null, contactWaId: "919800000001" }), "+919800000001");
    assert.equal(initials("Asha Verma"), "AV");
    assert.equal(initials("+919800000001"), "91");
    assert.equal(initials(""), "?");
    assert.equal(unreadBadge(3), "3");
    assert.equal(unreadBadge(250), "99+");
  });

  it("short times and day separators", () => {
    const now = new Date("2026-11-19T12:00:00Z");
    assert.equal(shortTime("2026-11-19T11:59:40Z", now), "now");
    assert.equal(shortTime("2026-11-19T11:48:00Z", now), "12m");
    assert.equal(shortTime("2026-11-19T09:00:00Z", now), "3h");
    assert.equal(shortTime("garbage", now), "");
    assert.equal(dayLabel("2026-11-19T01:00:00Z", new Date("2026-11-19T12:00:00Z")), "Today");
    assert.equal(dayLabel("2026-11-18T12:00:00Z", new Date("2026-11-19T12:00:00Z")), "Yesterday");
  });
});

describe("composer rules and ids", () => {
  it("not-configured outranks window-closed; unknown state does not block", () => {
    assert.equal(composerBlock({ outboundReady: false, windowOpen: false }), "not-configured");
    assert.equal(composerBlock({ outboundReady: true, windowOpen: false }), "window-closed");
    assert.equal(composerBlock({ outboundReady: true, windowOpen: true }), null);
    assert.equal(composerBlock({ outboundReady: undefined, windowOpen: undefined }), null, "the server still enforces both");
  });

  it("request ids are unique, valid for the API (8-64 of A-Za-z0-9_-) and local messages carry them", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newClientRequestId()));
    assert.equal(ids.size, 200);
    for (const id of ids) assert.match(id, /^[A-Za-z0-9_-]{8,64}$/);
    const l = localMessage("hi", "web-abc12345", { id: "u", name: "N" });
    assert.equal(l.state, "sending");
    assert.equal(l.clientRequestId, "web-abc12345");
    assert.equal(l.direction, "OUTBOUND");
  });

  it("debounce coalesces rapid calls and can be cancelled", async () => {
    const calls: string[] = [];
    const d = debounce((v: string) => calls.push(v), 20);
    d("a");
    d("ab");
    d("abc");
    await new Promise((r) => setTimeout(r, 60));
    assert.deepEqual(calls, ["abc"]);
    d("x");
    d.cancel();
    await new Promise((r) => setTimeout(r, 60));
    assert.deepEqual(calls, ["abc"]);
  });
});

describe("attachments", () => {
  const f = (type: string, size: number, name = "file.bin") => ({ type, size, name });
  it("accepts WhatsApp-supported types within the caps and says why otherwise", () => {
    assert.deepEqual(checkAttachment(f("image/jpeg", 1000)), { ok: true, kind: "image" });
    assert.deepEqual(checkAttachment(f("application/pdf", 5_000_000)), { ok: true, kind: "document" });
    assert.deepEqual(checkAttachment(f("audio/ogg", 100)), { ok: true, kind: "audio" });
    const gif = checkAttachment(f("image/gif", 10, "anim.gif"));
    assert.equal(gif.ok, false);
    assert.match(gif.ok ? "" : gif.reason, /anim.gif is not a type WhatsApp accepts/);
    assert.equal(checkAttachment(f("", 10)).ok, false);
    assert.equal(checkAttachment(f("image/png", 0, "e.png")).ok, false);
    const big = checkAttachment(f("image/png", 6 * 1024 * 1024, "big.png"));
    assert.match(big.ok ? "" : big.reason, /Image files can be at most 5.0 MB/);
    assert.equal(checkAttachment(f("image/png", 5 * 1024 * 1024)).ok, true, "exactly at the cap");
    assert.equal(checkAttachment(f("video/mp4", 6 * 1024 * 1024)).ok, true, "video allows more");
  });
  it("formats sizes and builds the picker filter", () => {
    assert.deepEqual([formatBytes(0), formatBytes(900), formatBytes(2048), formatBytes(5 * 1024 * 1024), formatBytes(20 * 1024 * 1024), formatBytes(null)], ["0 B", "900 B", "2.0 KB", "5.0 MB", "20 MB", ""]);
    assert.ok(ATTACHMENT_ACCEPT.includes("image/jpeg") && ATTACHMENT_ACCEPT.includes("application/pdf") && !ATTACHMENT_ACCEPT.includes("image/gif"));
  });
  it("previews media without a caption by its kind", () => {
    assert.equal(previewText({ lastPreview: "hello", lastKind: "text", lastMessageType: "text" }), "hello");
    assert.equal(previewText({ lastPreview: null, lastKind: "image", lastMessageType: "image" }), "[Photo]");
    assert.equal(previewText({ lastPreview: null, lastKind: "document", lastMessageType: "document" }), "[Document]");
  });
});

describe("templates and contact import", () => {
  it("fills placeholders and only allows sending when every value is present", () => {
    assert.equal(fillTemplate("Hi {{1}}, order {{2}} shipped.", ["Asha", "A-1"]), "Hi Asha, order A-1 shipped.");
    assert.equal(fillTemplate("Hi {{1}}, order {{2}}", ["Asha", ""]), "Hi Asha, order {{2}}");
    assert.equal(templateReady(2, ["a", "b"]), true);
    assert.equal(templateReady(2, ["a", " "]), false);
    assert.equal(templateReady(0, []), true);
    assert.equal(templateReady(1, []), false);
  });
  it("parses CSV with quotes, embedded commas, aliases and a BOM", () => {
    const csv = ["﻿Full Name,Mobile,Email,Tags", '"Verma, Asha",98765 43210,a@x.com,"vip,demo"', "Ravi,+44 7700 900123,,", "", ""].join("\r\n");
    const r = parseContactsCsv(csv);
    assert.equal(r.problem, undefined);
    assert.deepEqual(r.rows, [
      { name: "Verma, Asha", phone: "98765 43210", email: "a@x.com", tags: "vip,demo" },
      { name: "Ravi", phone: "+44 7700 900123", email: "", tags: "" },
    ]);
  });
  it("rejects files without name and phone columns or without data rows, and unescapes doubled quotes", () => {
    assert.match(parseContactsCsv("name,email\nA,b@c.com").problem ?? "", /name and phone/);
    assert.match(parseContactsCsv("name,phone").problem ?? "", /header row and at least one/);
    assert.equal(parseContactsCsv('name,phone\n"a ""quoted"" name",+919800000001').rows[0].name, 'a "quoted" name');
  });
});

describe("status rendering: sandbox vs real WhatsApp", () => {
  const REAL = ["accepted", "sent", "delivered", "read"] as const;

  it("real messages keep their own, separate labels (Accepted, Sent, Delivered, Read, Failed)", () => {
    for (const state of [...REAL, "failed"] as const) {
      const v = statusView({ state, simulated: false });
      assert.equal(v.state, state);
      assert.equal(v.simulated, false);
      assert.equal(v.path, "whatsapp");
      assert.equal(v.label, stateLabel(state));
    }
    assert.deepEqual(
      REAL.map((s) => statusView({ state: s }).label),
      ["Accepted", "Sent", "Delivered", "Read"],
      "a payload without the simulated flag is treated as real",
    );
  });

  it("a simulated message always reads Simulated, even if its state says sent, delivered or read", () => {
    for (const state of [...REAL, "simulated"] as const) {
      const v = statusView({ state, simulated: true });
      assert.equal(v.label, "Simulated", state);
      assert.equal(v.state, "simulated");
      assert.equal(v.path, "sandbox");
      assert.match(v.help, /Nothing was sent to WhatsApp/);
    }
    assert.equal(statusView({ state: "simulated" }).label, "Simulated", "state alone is enough");
  });

  it("a simulated failure is still shown as Failed (the sandbox did not pretend it worked)", () => {
    const v = statusView({ state: "failed", simulated: true });
    assert.equal(v.label, "Failed");
    assert.equal(v.simulated, true);
    assert.equal(v.path, "sandbox");
  });

  it("only real states claim WhatsApp did something; the help text for Accepted never claims delivery", () => {
    assert.doesNotMatch(STATE_HELP.accepted, /delivered to|has read/i);
    assert.match(STATE_HELP.accepted, /not confirmed it yet/);
    assert.match(STATE_HELP.sent, /not been confirmed on the customer/);
    assert.match(STATE_HELP.simulated, /Sandbox only/);
  });

  it("message details list the real stages in order, and a sandbox message only its simulation time", () => {
    const t = { acceptedAt: "2026-11-19T10:00:00Z", sentAt: "2026-11-19T10:00:02Z", deliveredAt: "2026-11-19T10:00:05Z", readAt: null, failedAt: null };
    assert.deepEqual(
      timelineRows({ simulated: false, timeline: t }).map((r) => r.label),
      ["Accepted by the WhatsApp API", "Sent (confirmed by WhatsApp)", "Delivered"],
    );
    const sim = timelineRows({ simulated: true, timeline: { ...t, deliveredAt: "2026-11-19T10:00:05Z" } });
    assert.deepEqual(sim.map((r) => r.label), ["Simulated by the sandbox"], "no Sent/Delivered rows for a mock");
    assert.deepEqual(timelineRows({ simulated: false }), []);
  });
});
