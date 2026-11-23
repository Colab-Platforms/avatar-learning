import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  classifyPath, cleanPath, cleanReferrer, countryFromHeaders, isOnline, isUntrackedPath, isValidVisitorKey, istDayStart, maskIp, monitoringConfig, parseUserAgent, sanitizeMetadata,
} from "../../src/modules/monitoring/monitoring.util.js";
import { NEGATIVE_TTL_MS, RevocationUnavailableError, cacheSizes, clearRevocations, isAuthSessionRevoked, revokeAuthSession, setRevocationLookup, setRevocationTimeout } from "../../src/modules/monitoring/session-revocation.js";

describe("user agent summary (no fingerprinting)", () => {
  it("recognises the common browsers, systems and devices", () => {
    assert.deepEqual(parseUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"), { deviceType: "desktop", browser: "Chrome", os: "Windows" });
    assert.deepEqual(parseUserAgent("Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0"), { deviceType: "desktop", browser: "Edge", os: "Windows" });
    assert.deepEqual(parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"), { deviceType: "mobile", browser: "Safari", os: "iOS" });
    assert.deepEqual(parseUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36"), { deviceType: "mobile", browser: "Chrome", os: "Android" });
    assert.equal(parseUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Safari/604.1").deviceType, "tablet");
    assert.equal(parseUserAgent("Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0").browser, "Firefox");
    assert.equal(parseUserAgent("Googlebot/2.1").deviceType, "bot");
    assert.equal(parseUserAgent(undefined).deviceType, "unknown");
  });
});

describe("identifiers, paths and referrers", () => {
  it("visitor ids must be random URL-safe strings of a sane length", () => {
    assert.equal(isValidVisitorKey("3f2b9c1e-7a4d-4c1b-9d3e-0a1b2c3d4e5f"), true);
    for (const bad of ["", "short", "has spaces in the middle of it", "x".repeat(65), "<script>alert(1)</script>", null, 7]) assert.equal(isValidVisitorKey(bad), false);
  });
  it("paths lose query strings, hashes and hosts; non-paths are rejected", () => {
    assert.equal(cleanPath("/courses/x?token=abc#top"), "/courses/x");
    assert.equal(cleanPath("https://www.avatarindia.com/reset-password?token=abc"), "/reset-password");
    assert.equal(cleanPath("javascript:alert(1)"), null);
    assert.equal(cleanPath("relative/path"), null);
    assert.equal(cleanPath(42), null);
    assert.ok(cleanPath("/" + "a".repeat(500))!.length <= 200);
  });
  it("referrers are reduced to a hostname; admin screens are never tracked", () => {
    assert.equal(cleanReferrer("https://www.google.com/search?q=secret"), "www.google.com");
    assert.equal(cleanReferrer("not a url"), null);
    for (const p of ["/admin", "/admin/users", "/admin-adaption", "/admin-adaption/inbox", "/dev-adaption-login"]) assert.equal(isUntrackedPath(p), true, p);
    for (const p of ["/administer", "/courses", "/"]) assert.equal(isUntrackedPath(p), false, p);
  });
  it("classifies pages", () => {
    assert.equal(classifyPath("/courses/ai-basics").type, "COURSE_VIEW");
    assert.equal(classifyPath("/courses/ai-basics/learn").type, "LESSON_VIEW");
    assert.equal(classifyPath("/courses/ai-basics/assessment/1").module, "assessments");
    assert.deepEqual(classifyPath("/webinar"), { type: "PAGE_VIEW", module: "webinar" });
    assert.deepEqual(classifyPath("/"), { type: "PAGE_VIEW", module: "home" });
  });
});

describe("redaction and masking", () => {
  it("drops every secret-looking key at any depth and caps size", () => {
    const out = sanitizeMetadata({ ok: 1, Password: "p", newPassword: "p", refresh_token: "t", Authorization: "Bearer x", sessionId: "s", otp: "1", cvv: "1", cardNumber: "4", apiKey: "k", deep: { secret: "s", fine: "yes", deeper: { fine: "no" } }, list: [1, "two", { token: "t" }] }) as any;
    assert.deepEqual(out, { ok: 1, deep: { fine: "yes" }, list: [1, "two"] });
    assert.equal(sanitizeMetadata({ password: "p" }), undefined);
    assert.equal(sanitizeMetadata(undefined), undefined);
    assert.equal(Object.keys(sanitizeMetadata(Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`k${i}`, i]))) as object).length, 20);
  });
  it("masks IPv4 and IPv6 hosts", () => {
    assert.equal(maskIp("203.0.113.42"), "203.0.113.xxx");
    assert.equal(maskIp("::ffff:203.0.113.42"), "203.0.113.xxx");
    assert.equal(maskIp("2001:db8:1:2::9"), "2001:db8:1:xxxx");
    assert.equal(maskIp(null), null);
  });
  it("takes a country only from a CDN header, never from the IP", () => {
    assert.equal(countryFromHeaders({ "x-vercel-ip-country": "in" }), "IN");
    assert.equal(countryFromHeaders({ "cf-ipcountry": "XX" }), null);
    assert.equal(countryFromHeaders({}), null);
    assert.equal(countryFromHeaders({ "x-vercel-ip-country": "<script>" }), null);
  });
});

describe("time rules", () => {
  it("online = open session with a recent heartbeat", () => {
    const cfg = monitoringConfig({});
    const now = new Date("2026-11-24T10:00:00Z");
    assert.equal(isOnline({ endedAt: null, lastActivityAt: new Date(now.getTime() - 60_000) }, now, cfg), true);
    assert.equal(isOnline({ endedAt: null, lastActivityAt: new Date(now.getTime() - 120_000) }, now, cfg), false);
    assert.equal(isOnline({ endedAt: now, lastActivityAt: now }, now, cfg), false, "an ended session is never online");
  });
  it("'today' is the India calendar day", () => {
    assert.equal(istDayStart(new Date("2026-11-24T10:00:00Z")).toISOString(), "2026-11-23T18:30:00.000Z");
    assert.equal(istDayStart(new Date("2026-11-24T20:00:00Z")).toISOString(), "2026-11-24T18:30:00.000Z");
  });
});

describe("session revocation (shared lookup + per-instance caches)", () => {
  it("a revoked sign-in is refused until its token would have expired; tokens without a sid are unaffected", async () => {
    clearRevocations();
    setRevocationLookup(async () => false);
    assert.equal(await isAuthSessionRevoked("s1", 500), false);
    revokeAuthSession("s1", 1_000);
    assert.equal(await isAuthSessionRevoked("s1", 2_000), true);
    assert.equal(await isAuthSessionRevoked("s1", 1_000 + 25 * 3600_000), false, "after the access token's lifetime the entry is dropped");
    assert.equal(await isAuthSessionRevoked(undefined), false);
    setRevocationLookup(null);
  });
  it("asks the database, then caches: 'not revoked' for 10s, 'revoked' for good; nothing is asked twice inside the window", async () => {
    clearRevocations();
    let calls = 0;
    let truth = false;
    setRevocationLookup(async () => (calls++, truth));
    assert.equal(await isAuthSessionRevoked("sx", 10_000), false);
    assert.equal(await isAuthSessionRevoked("sx", 10_000 + NEGATIVE_TTL_MS - 1), false);
    assert.equal(calls, 1, "the negative result is cached");
    truth = true; // another instance terminated it meanwhile
    assert.equal(await isAuthSessionRevoked("sx", 10_000 + NEGATIVE_TTL_MS - 1), false, "still inside the window");
    assert.equal(await isAuthSessionRevoked("sx", 10_000 + NEGATIVE_TTL_MS + 1), true, "enforced within ~10 seconds");
    assert.equal(await isAuthSessionRevoked("sx", 10_000 + NEGATIVE_TTL_MS + 2), true);
    assert.equal(calls, 2, "a positive result is cached");
    setRevocationLookup(null);
  });
  it("revoking on this instance clears a cached 'not revoked' at once", async () => {
    clearRevocations();
    setRevocationLookup(async () => false);
    assert.equal(await isAuthSessionRevoked("sy", 1_000), false);
    revokeAuthSession("sy", 1_500);
    assert.equal(await isAuthSessionRevoked("sy", 1_600), true);
    setRevocationLookup(null);
  });
  it("FAIL CLOSED: an unverifiable session throws (never 'not revoked'), and the failure is not cached either way", async () => {
    clearRevocations();
    let calls = 0;
    let fail = true;
    setRevocationLookup(async () => { calls++; if (fail) throw new Error("db down"); return false; });
    await assert.rejects(isAuthSessionRevoked("sz", 1_000), (e: any) => e instanceof RevocationUnavailableError);
    await assert.rejects(isAuthSessionRevoked("sz", 1_001), RevocationUnavailableError);
    assert.equal(calls, 2, "every request asks again: the error was not remembered");
    assert.deepEqual(cacheSizes(), { revoked: 0, notRevoked: 0 }, "nothing is cached for a failure");
    fail = false;
    assert.equal(await isAuthSessionRevoked("sz", 1_002), false, "recovers the moment the database does");
    assert.deepEqual(cacheSizes(), { revoked: 0, notRevoked: 1 }, "only the VERIFIED state is cached");
    setRevocationLookup(null);
  });
  it("a verified state keeps being served from the 10s cache during a later outage (no needless 503 for sessions already verified)", async () => {
    clearRevocations();
    let fail = false;
    setRevocationLookup(async () => { if (fail) throw new Error("db down"); return false; });
    assert.equal(await isAuthSessionRevoked("sv", 5_000), false);
    fail = true;
    assert.equal(await isAuthSessionRevoked("sv", 5_000 + NEGATIVE_TTL_MS - 1), false, "verified moments ago: still trusted");
    await assert.rejects(isAuthSessionRevoked("sv", 5_000 + NEGATIVE_TTL_MS + 1), RevocationUnavailableError);
    setRevocationLookup(null);
  });
  it("a hung database (timeout) is an 'unavailable' failure too, and the timer does not leak", async () => {
    clearRevocations();
    setRevocationTimeout(40);
    setRevocationLookup(() => new Promise<boolean>(() => undefined)); // never answers
    const t0 = Date.now();
    await assert.rejects(isAuthSessionRevoked("st", 1_000), RevocationUnavailableError);
    assert.ok(Date.now() - t0 < 1000, "gave up after the timeout, did not hang");
    assert.deepEqual(cacheSizes(), { revoked: 0, notRevoked: 0 });
    setRevocationTimeout(null);
    setRevocationLookup(null);
  });
});

describe("source-level privacy checks", () => {
  const src = (f: string) => fs.readFileSync(path.resolve(import.meta.dirname, "../../src/modules/monitoring", f), "utf8");
  it("no IP geolocation lookup, no fingerprinting libraries, no request bodies stored", () => {
    for (const f of ["monitoring.service.ts", "monitoring.util.ts", "monitoring.route.ts", "request-context.ts"]) {
      const code = src(f).replace(/^\s*(\/\/|\*|\/\*).*$/gm, "");
      assert.ok(!/fingerprint|canvas|webgl|geoip|ipapi|ipinfo|maxmind|fetch\(/i.test(code), `${f} must not use fingerprinting or geolocation lookups`);
    }
    assert.ok(!/req\.body\b.*monitoringEvent|metadata:\s*req\.body/.test(src("monitoring.route.ts")));
  });
});
