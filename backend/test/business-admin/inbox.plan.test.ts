import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  WINDOW_MS,
  STALE_SENDING_MS,
  decodeCursor,
  displayName,
  encodeCursor,
  isUnread,
  messageState,
  planConversationList,
  retryKeyFor,
  toMessageDto,
  windowState,
  type ContactAggregate,
  type ConversationState,
} from "../../src/modules/business-admin/inbox.plan.js";
import type { StoredMessage } from "../../src/modules/business-admin/inbox.types.js";

const T0 = new Date("2026-11-19T12:00:00Z");
const ago = (ms: number) => new Date(T0.getTime() - ms);
const H = 3600_000;

describe("24-hour customer service window", () => {
  it("is open for a customer message 23h59m ago and closed at exactly 24h", () => {
    assert.equal(windowState(ago(WINDOW_MS - 60_000), T0).open, true);
    assert.equal(windowState(ago(WINDOW_MS), T0).open, false);
    assert.equal(windowState(ago(WINDOW_MS + 1), T0).open, false);
  });
  it("is closed when the customer has never written, and reports when it expires", () => {
    assert.deepEqual(windowState(null, T0), { open: false, expiresAt: null });
    const w = windowState(ago(H), T0);
    assert.equal(w.expiresAt?.toISOString(), new Date(ago(H).getTime() + WINDOW_MS).toISOString());
  });
});

const agg = (id: string, lastAt: Date, over: Partial<ContactAggregate> = {}): ContactAggregate => ({
  contactWaId: id,
  messageCount: 1,
  lastAt,
  lastInboundAt: lastAt,
  names: [],
  ...over,
});
const state = (id: string, over: Partial<ConversationState> = {}): ConversationState => ({ contactWaId: id, assignedToUserId: null, lastReadAt: null, ...over });

describe("unread", () => {
  it("a contact is unread when the last inbound message is newer than the read marker (or never read)", () => {
    const c = agg("1", ago(H));
    assert.equal(isUnread(c, undefined), true);
    assert.equal(isUnread(c, state("1", { lastReadAt: ago(2 * H) })), true);
    assert.equal(isUnread(c, state("1", { lastReadAt: ago(H) })), false);
    assert.equal(isUnread(c, state("1", { lastReadAt: T0 })), false);
  });
  it("a contact with only outbound messages is never unread", () => {
    assert.equal(isUnread(agg("1", ago(H), { lastInboundAt: null }), undefined), false);
  });
});

describe("planConversationList", () => {
  const contacts = [
    agg("919800000001", ago(5 * H), { names: ["Asha Verma"] }),
    agg("919800000002", ago(1 * H), { names: ["Ravi Kumar", "Ravi K"] }),
    agg("919800000003", ago(3 * H), { names: [] }),
    agg("447700900123", ago(2 * H), { names: ["Chloe Brown"] }),
  ];
  const states = new Map<string, ConversationState>([
    ["919800000001", state("919800000001", { assignedToUserId: "me", lastReadAt: T0 })],
    ["919800000002", state("919800000002", { assignedToUserId: "other", lastReadAt: ago(10 * H) })],
    ["919800000003", state("919800000003", { lastReadAt: T0 })],
  ]);
  const run = (over: object = {}) => planConversationList({ contacts, states, filter: "all", meId: "me", page: 1, pageSize: 25, ...over });
  const ids = (r: ReturnType<typeof run>) => r.pageContacts.map((c) => c.contactWaId);

  it("sorts by latest activity, newest first", () => {
    assert.deepEqual(ids(run()), ["919800000002", "447700900123", "919800000003", "919800000001"]);
  });
  it("breaks ties deterministically", () => {
    const tie = [agg("2", T0), agg("1", T0)];
    assert.deepEqual(planConversationList({ contacts: tie, states: new Map(), filter: "all", meId: "m", page: 1, pageSize: 5 }).pageContacts.map((c) => c.contactWaId), ["1", "2"]);
  });
  it("Unread filter: only conversations with newer inbound than the read marker (never-read counts as unread)", () => {
    assert.deepEqual(ids(run({ filter: "unread" })), ["919800000002", "447700900123"]);
  });
  it("Assigned to Me: only conversations assigned to the signed-in member", () => {
    assert.deepEqual(ids(run({ filter: "mine" })), ["919800000001"]);
    assert.deepEqual(ids(run({ filter: "mine", meId: "nobody" })), []);
  });
  it("Unassigned: no conversation row or no assignee", () => {
    assert.deepEqual(ids(run({ filter: "unassigned" })), ["447700900123", "919800000003"]);
  });
  it("filters by a specific team member and combines with other filters", () => {
    assert.deepEqual(ids(run({ assignee: "other" })), ["919800000002"]);
    assert.deepEqual(ids(run({ assignee: "other", filter: "unread" })), ["919800000002"]);
    assert.deepEqual(ids(run({ assignee: "other", filter: "mine" })), []);
  });
  it("searches by name (case-insensitive, any known name) and by phone digits however they are typed", () => {
    assert.deepEqual(ids(run({ q: "ASHA" })), ["919800000001"]);
    assert.deepEqual(ids(run({ q: "ravi k" })), ["919800000002"]);
    assert.deepEqual(ids(run({ q: "+91 98000-00003" })), ["919800000003"]);
    assert.deepEqual(ids(run({ q: "4477009" })), ["447700900123"]);
    assert.deepEqual(ids(run({ q: "nobody" })), []);
  });
  it("a one-digit query does not match every phone number", () => {
    assert.deepEqual(ids(run({ q: "9" })), []);
  });
  it("paginates and reports the filtered total and the whole-inbox unread total", () => {
    const p1 = run({ pageSize: 2, page: 1 });
    const p2 = run({ pageSize: 2, page: 2 });
    const p3 = run({ pageSize: 2, page: 3 });
    assert.deepEqual([ids(p1), ids(p2), ids(p3)], [["919800000002", "447700900123"], ["919800000003", "919800000001"], []]);
    assert.equal(p1.total, 4);
    assert.equal(run({ filter: "mine" }).unreadTotal, 2, "unreadTotal ignores filters");
  });
});

const stored = (over: Partial<StoredMessage> = {}): StoredMessage => ({
  id: "cmsg00000001",
  waMessageId: "wamid.1",
  direction: "OUTBOUND",
  status: "SENT",
  contactWaId: "919800000001",
  messageType: "text",
  textBody: "hi",
  messageTimestamp: null,
  createdAt: ago(H),
  errorCode: null,
  errorTitle: null,
  errorDetails: null,
  sentByUserId: "u1",
  clientRequestId: "req-1",
  ...over,
});

describe("message states", () => {
  it("maps outbound statuses to sending / sent / delivered / read / failed and inbound to received", () => {
    const s = (status: StoredMessage["status"], direction: StoredMessage["direction"] = "OUTBOUND") => messageState({ direction, status, createdAt: ago(1000) }, T0);
    assert.deepEqual(
      [s("SENDING"), s("SENT"), s("DELIVERED"), s("READ"), s("FAILED"), s("RECEIVED", "INBOUND")],
      ["sending", "accepted", "delivered", "read", "failed", "received"],
      "SENT without a WhatsApp confirmation (no sentAt) is only accepted by the API",
    );
  });
  it("a SENDING row that never completed becomes 'unconfirmed' instead of spinning forever", () => {
    assert.equal(messageState({ direction: "OUTBOUND", status: "SENDING", createdAt: ago(STALE_SENDING_MS - 1000) }, T0), "sending");
    assert.equal(messageState({ direction: "OUTBOUND", status: "SENDING", createdAt: ago(STALE_SENDING_MS + 1000) }, T0), "unconfirmed");
  });
  it("DTO: prefers the WhatsApp timestamp, names the sender, marks only un-retried failures retryable", () => {
    const names = new Map([["u1", "Asha Ops"]]);
    const ok = toMessageDto(stored({ messageTimestamp: ago(2 * H) }), { now: T0, names, retriedIds: new Set() });
    assert.equal(ok.at, ago(2 * H).toISOString());
    assert.deepEqual(ok.sentBy, { id: "u1", name: "Asha Ops" });
    assert.equal(ok.canRetry, false);
    const failed = stored({ status: "FAILED", errorCode: 131047, errorTitle: "Outside window" });
    assert.equal(toMessageDto(failed, { now: T0, names, retriedIds: new Set() }).canRetry, true);
    assert.equal(toMessageDto(failed, { now: T0, names, retriedIds: new Set([failed.id]) }).canRetry, false);
    assert.deepEqual(toMessageDto(failed, { now: T0, names, retriedIds: new Set() }).error, { code: 131047, title: "Outside window", ambiguous: false });
    const amb = toMessageDto(stored({ status: "FAILED", errorDetails: "ambiguous_outcome", errorTitle: "t" }), { now: T0, names, retriedIds: new Set() });
    assert.equal(amb.error?.ambiguous, true);
  });
  it("inbound messages are never retryable and carry no sender", () => {
    const d = toMessageDto(stored({ direction: "INBOUND", status: "RECEIVED", sentByUserId: null }), { now: T0, names: new Map(), retriedIds: new Set() });
    assert.equal(d.canRetry, false);
    assert.equal(d.sentBy, null);
  });
});

describe("cursors and helpers", () => {
  it("cursor round-trips and rejects garbage", () => {
    const c = encodeCursor(new Date("2026-11-19T12:00:00.123Z"), "cabc12345678");
    assert.deepEqual(decodeCursor(c), { createdAt: new Date("2026-11-19T12:00:00.123Z"), id: "cabc12345678" });
    for (const bad of ["", "x", "123_abc", "99999999999999999_abcdef", "1763553600000_a b c d e", "1763553600000_'; drop"]) assert.equal(decodeCursor(bad), null, bad);
  });
  it("retry key is deterministic and cannot collide with a user-supplied request id (':' is not allowed there)", () => {
    assert.equal(retryKeyFor("cabc"), "retry-of:cabc");
    assert.ok(!/^[A-Za-z0-9_-]{8,64}$/.test(retryKeyFor("cabc12345678")));
  });
  it("display names fall back to the email local part, never the full address", () => {
    assert.equal(displayName({ firstName: "Asha", lastName: "Ops" }), "Asha Ops");
    assert.equal(displayName({ firstName: null, lastName: null, email: "ops@example.com" }), "ops");
    assert.equal(displayName({}), "Team member");
  });
});
