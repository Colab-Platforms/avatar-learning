// Run with: npm run test:logic
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getOrCreateVisitorId, heartbeatBody, isValidVisitorId, newVisitorId, pageViewBody, readConsent, trackablePath, trackingAllowed, VISITOR_KEY, wasTerminated } from "./activityTracker.js";
import { backoffMs, buildQuery, deviceLabel, describeEvent, filterLive, formatDuration, pageCount, parseSse, rangeFor, relativeTime, rowTitle, sessionLength, type SessionRow } from "./monitoringLogic.js";

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

describe("visitor id (first-party, random, no fingerprinting)", () => {
  it("creates a valid random id once and reuses it", () => {
    const s = mem();
    const a = getOrCreateVisitorId(s);
    const b = getOrCreateVisitorId(s);
    assert.ok(a && isValidVisitorId(a));
    assert.equal(a, b);
    assert.equal(s.m.get(VISITOR_KEY), a);
    assert.notEqual(newVisitorId(), newVisitorId());
  });
  it("replaces a tampered id, and creates nothing when storage is blocked (no id per page load)", () => {
    const s = mem();
    s.setItem(VISITOR_KEY, "<script>alert(1)</script>");
    const id = getOrCreateVisitorId(s)!;
    assert.ok(isValidVisitorId(id) && id !== "<script>alert(1)</script>");
    assert.equal(getOrCreateVisitorId({ getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } }), null);
    assert.equal(getOrCreateVisitorId({ getItem: () => null, setItem: () => undefined }), null, "a write that did not persist is treated as blocked");
    assert.equal(getOrCreateVisitorId(null), null);
  });
});

describe("what is tracked", () => {
  it("only with consent (the cookie-banner choice); the owner can relax it, but a refusal always wins", () => {
    assert.equal(trackingAllowed({ consent: "granted" }), true);
    assert.equal(trackingAllowed({ consent: null }), false);
    assert.equal(trackingAllowed({ consent: "denied" }), false);
    assert.equal(trackingAllowed({ consent: null, requireConsent: false }), true);
    assert.equal(trackingAllowed({ consent: "denied", requireConsent: false }), false);
  });
  it("never on administrator screens", () => {
    for (const p of ["/admin", "/admin/users", "/admin-adaption", "/admin-adaption/monitoring", "/dev-adaption-login"]) assert.equal(trackablePath(p), false, p);
    for (const p of ["/", "/courses", "/administer", "/dashboard"]) assert.equal(trackablePath(p), true, p);
    assert.equal(trackablePath(null), false);
    assert.equal(trackablePath("courses"), false);
  });
  it("payloads carry only the id, the path and (first time) the referrer", () => {
    assert.deepEqual(pageViewBody("id", "/x"), { visitorId: "id", path: "/x" });
    assert.deepEqual(pageViewBody("id", "/x", "https://google.com/"), { visitorId: "id", path: "/x", referrer: "https://google.com/" });
    assert.deepEqual(heartbeatBody("id", "/x"), { visitorId: "id", path: "/x" });
  });
  it("reads the existing consent choice and recognises a terminated sign-in", () => {
    const s = mem();
    assert.equal(readConsent(s), null);
    s.setItem("avatar-analytics-consent", "granted");
    assert.equal(readConsent(s), "granted");
    assert.equal(wasTerminated({ terminated: true }), true);
    assert.equal(wasTerminated({ tracked: true }), false);
    assert.equal(wasTerminated(null), false);
  });
});

const row = (over: Partial<SessionRow> = {}): SessionRow => ({
  id: "s1", visitorId: "visitor-key-aaaaaaaaaaaaaaaa1", kind: "guest", userId: null, name: null, email: null, online: true, status: "online", loginStatus: "guest", currentPath: "/courses",
  device: { type: "desktop", browser: "Chrome", os: "Windows" }, startedAt: "2026-11-24T10:00:00Z", lastActivityAt: "2026-11-24T10:05:00Z", endedAt: null, endReason: null, pageViews: 3, referrer: null, canTerminate: false, ...over,
});

describe("live dashboard helpers", () => {
  it("names rows, formats times and durations, labels devices", () => {
    assert.equal(rowTitle(row()), "Guest aaaaa1");
    assert.equal(rowTitle(row({ kind: "registered", name: "Asha Rao" })), "Asha Rao");
    assert.equal(rowTitle(row({ kind: "registered", name: null, email: "a@b.co" })), "a@b.co");
    const now = new Date("2026-11-24T10:10:00Z").getTime();
    assert.equal(relativeTime("2026-11-24T10:09:55Z", now), "just now");
    assert.equal(relativeTime("2026-11-24T10:09:20Z", now), "40s ago");
    assert.equal(relativeTime("2026-11-24T10:05:00Z", now), "5 min ago");
    assert.equal(relativeTime("2026-11-24T07:10:00Z", now), "3 hr ago");
    assert.equal(relativeTime("2026-11-21T10:10:00Z", now), "3 d ago");
    assert.equal(relativeTime(null), "—");
    assert.deepEqual([formatDuration(45), formatDuration(125), formatDuration(3700)], ["45s", "2m 5s", "1h 1m"]);
    assert.equal(sessionLength(row()), 300);
    assert.equal(sessionLength(row({ endedAt: "2026-11-24T10:20:00Z" })), 1200);
    assert.equal(deviceLabel({ browser: "Chrome", os: "Windows" }), "Chrome · Windows");
    assert.equal(deviceLabel({ browser: "Unknown", os: "Unknown" }), "Unknown device");
  });

  it("describes events without exposing anything sensitive", () => {
    assert.deepEqual(describeEvent({ type: "PAGE_VIEW", path: "/courses", reason: null, metadata: null }), { title: "Viewed a page", detail: "/courses" });
    assert.deepEqual(describeEvent({ type: "PAYMENT", path: null, reason: null, metadata: { amount: 499, status: "PAID" } }), { title: "Payment", detail: "₹499" });
    assert.equal(describeEvent({ type: "LOGIN_FAILED", path: null, reason: "BAD_PASSWORD", metadata: null }).detail, "bad password");
    assert.equal(describeEvent({ type: "TEST_COMPLETED", path: null, reason: null, metadata: { scorePercent: 82 } }).detail, "82%");
    assert.equal(describeEvent({ type: "SOMETHING_NEW", path: null, reason: null, metadata: null }).title, "SOMETHING_NEW");
  });

  it("builds queries without empty values, ranges, and page counts", () => {
    assert.equal(buildQuery({ status: "online", search: "", page: 2, kind: undefined, types: ["LOGIN_SUCCESS", "LOGOUT"], flag: false }), "?status=online&page=2&types=LOGIN_SUCCESS%2CLOGOUT");
    assert.equal(buildQuery({}), "");
    assert.deepEqual(rangeFor(0), {});
    const r = rangeFor(7, new Date("2026-11-24T00:00:00Z"));
    assert.deepEqual([r.from, r.to], ["2026-11-17T00:00:00.000Z", "2026-11-24T00:00:00.000Z"]);
    assert.deepEqual([pageCount(0, 25), pageCount(26, 25), pageCount(50, 25)], [1, 2, 2]);
  });

  it("filters the live rows", () => {
    const rows = [row({ id: "g" }), row({ id: "r", kind: "registered", name: "Asha Rao", email: "asha@example.com", currentPath: "/dashboard" })];
    assert.deepEqual(filterLive(rows, { kind: "guest" }).map((r) => r.id), ["g"]);
    assert.deepEqual(filterLive(rows, { kind: "registered" }).map((r) => r.id), ["r"]);
    assert.deepEqual(filterLive(rows, { search: "ASHA" }).map((r) => r.id), ["r"]);
    assert.deepEqual(filterLive(rows, { search: "/dash" }).map((r) => r.id), ["r"]);
    assert.equal(filterLive(rows, {}).length, 2);
  });
});

describe("live stream reader (real-time updates)", () => {
  it("splits complete messages from a partial one and ignores comments", () => {
    const a = parseSse(": connected\n\nevent: snapshot\ndata: {\"n\":1}\n\nevent: snapshot\ndata: {\"n\"");
    assert.deepEqual(a.events, [{ event: "snapshot", data: "{\"n\":1}" }]);
    assert.equal(a.rest, "event: snapshot\ndata: {\"n\"");
    const b = parseSse(a.rest + ":2}\n\n");
    assert.deepEqual(b.events, [{ event: "snapshot", data: "{\"n\":2}" }]);
    assert.equal(b.rest, "");
  });
  it("handles error events, multi-line data and empty input; reconnect back-off is capped", () => {
    assert.deepEqual(parseSse("event: error\ndata: {\"message\":\"x\"}\n\n").events, [{ event: "error", data: "{\"message\":\"x\"}" }]);
    assert.deepEqual(parseSse("data: a\ndata: b\n\n").events, [{ event: "message", data: "a\nb" }]);
    assert.deepEqual(parseSse(""), { events: [], rest: "" });
    assert.deepEqual([backoffMs(0), backoffMs(1), backoffMs(3), backoffMs(10)], [1000, 2000, 8000, 30000]);
  });
});
