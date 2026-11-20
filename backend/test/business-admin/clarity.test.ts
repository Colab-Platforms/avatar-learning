import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CACHE_TTL_MS,
  CLARITY_ENDPOINT,
  ClarityError,
  ClarityService,
  DAILY_BUDGET,
  fetchInsights,
  parsePages,
  parseRows,
  parseTotals,
  type SnapshotRow,
  type SnapshotStore,
} from "../../src/modules/business-admin/clarity.service.js";
import { ADMIN_OK, asSuper, call, startInboxApp, tokenFor, type InboxApp } from "./app.js";

const TOKEN = "clarity_test_token_value_8841";

// Shaped like Clarity's documented project-live-insights response. UNVERIFIED against a live project.
const OVERALL = [
  { metricName: "Traffic", information: [{ totalSessionCount: "1200", totalBotSessionCount: "80", distinctUserCount: "900", pagesPerSessionPercentage: 2.4 }] },
  { metricName: "EngagementTime", information: [{ totalTime: "240", activeTime: "130" }] },
  { metricName: "ScrollDepth", information: [{ averageScrollDepth: 61.5 }] },
  { metricName: "RageClickCount", information: [{ sessionsCount: "12", sessionsWithMetricPercentage: 1, subTotal: "12" }] },
  { metricName: "DeadClickCount", information: [{ sessionsCount: "70", subTotal: "70" }] },
  { metricName: "QuickbackClick", information: [{ sessionsCount: "30" }] },
  { metricName: "ScriptErrorCount", information: [{ sessionsCount: "9" }] },
];
const DEVICES = [{ metricName: "Traffic", information: [{ Device: "Mobile", totalSessionCount: "800", distinctUserCount: "600" }, { Device: "PC", totalSessionCount: "350", distinctUserCount: "280" }, { Device: "Tablet", totalSessionCount: "50", distinctUserCount: "40" }, { Device: "", totalSessionCount: "5" }] }];
const PAGES = [{ metricName: "PopularPages", information: [{ url: "https://avatarindia.com/", visitsCount: "500" }, { url: "https://avatarindia.com/courses", visitsCount: "700" }] }];

describe("Clarity response parsing (defensive)", () => {
  it("reads totals and leaves anything Clarity did not return as null (never zero)", () => {
    const t = parseTotals(OVERALL);
    assert.deepEqual([t.sessions, t.botSessions, t.distinctUsers, t.pagesPerSession, t.scrollDepthPercent, t.totalTimeSeconds, t.activeTimeSeconds], [1200, 80, 900, 2.4, 61.5, 240, 130]);
    assert.deepEqual([t.rageClickSessions, t.deadClickSessions, t.quickbackSessions, t.scriptErrorSessions, t.excessiveScrollSessions], [12, 70, 30, 9, null]);
    const empty = parseTotals([]);
    assert.ok(Object.values(empty).every((v) => v === null));
    for (const junk of [null, undefined, "x", 5, {}, [null, 1, { metricName: "Traffic" }, { metricName: "Traffic", information: "no" }]]) assert.doesNotThrow(() => parseTotals(junk));
  });

  it("breakdown rows are sorted largest first and skip rows with no label", () => {
    const rows = parseRows(DEVICES, "Device");
    assert.deepEqual(rows.map((r) => [r.label, r.sessions, r.users]), [["Mobile", 800, 600], ["PC", 350, 280], ["Tablet", 50, 40]]);
    assert.deepEqual(parseRows(null, "Device"), []);
    assert.equal(parseRows([{ metricName: "Traffic", information: [{ Country: "India", totalSessionCount: 3 }] }], "Country/Region")[0].label, "India");
  });

  it("popular pages come from PopularPages, falling back to the URL breakdown", () => {
    assert.deepEqual(parsePages(PAGES).map((p) => [p.url, p.visits]), [["https://avatarindia.com/courses", 700], ["https://avatarindia.com/", 500]]);
    assert.deepEqual(parsePages([{ metricName: "Traffic", information: [{ Url: "https://x.com/a", totalSessionCount: 4 }] }]), [{ url: "https://x.com/a", visits: 4 }]);
  });
});

// Verbatim from Microsoft's Data Export API page (https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api), dimension1=OS.
const MICROSOFT_SAMPLE = [
  {
    metricName: "Traffic",
    information: [
      { totalSessionCount: "9554", totalBotSessionCount: "8369", distantUserCount: "189733", PagesPerSessionPercentage: 1.0931, OS: "Other" },
      { totalSessionCount: "291942", totalBotSessionCount: "31076", distantUserCount: "212836", PagesPerSessionPercentage: 2.2609, OS: "Android" },
    ],
  },
];

describe("Clarity parsing against Microsoft's documented sample", () => {
  it("reads distantUserCount (Microsoft's spelling) and PagesPerSessionPercentage (exact case)", () => {
    const t = parseTotals(MICROSOFT_SAMPLE);
    assert.equal(t.sessions, 9554 + 291942);
    assert.equal(t.botSessions, 8369 + 31076);
    assert.equal(t.distinctUsers, 189733 + 212836);
    assert.equal(t.pagesPerSession, 1.0931, "first row of the Traffic metric");
  });

  it("per-row visitors come from distantUserCount and rows are sorted by sessions", () => {
    const rows = parseRows(MICROSOFT_SAMPLE, "OS");
    assert.deepEqual(rows.map((r) => [r.label, r.sessions, r.users]), [["Android", 291942, 212836], ["Other", 9554, 189733]]);
  });

  it("still accepts the other spellings and any key case", () => {
    const info = (o: Record<string, unknown>) => [{ metricName: "Traffic", information: [{ totalSessionCount: 10, ...o }] }];
    assert.equal(parseTotals(info({ distinctUserCount: 7 })).distinctUsers, 7);
    assert.equal(parseTotals(info({ DISTANTUSERCOUNT: "8" })).distinctUsers, 8);
    assert.equal(parseTotals(info({ pagesPerSessionPercentage: 3.5 })).pagesPerSession, 3.5);
    assert.equal(parseTotals(info({ pagespersessionpercentage: 4.5 })).pagesPerSession, 4.5);
  });

  it("a missing field stays null (never zero) and other metrics are unchanged", () => {
    const t = parseTotals([{ metricName: "Traffic", information: [{ totalSessionCount: "5" }] }, { metricName: "DeadClickCount", information: [{ sessionsCount: 3 }] }]);
    assert.equal(t.distinctUsers, null);
    assert.equal(t.pagesPerSession, null);
    assert.equal(t.sessions, 5);
    assert.equal(t.deadClickSessions, 3);
  });
});

describe("Clarity HTTP client (mocked network)", () => {
  const call1 = (status: number, body: unknown = {}) => {
    const calls: Array<{ url: string; headers: Record<string, string> }> = [];
    const impl = async (url: string, init: any) => (calls.push({ url, headers: init.headers }), { ok: status >= 200 && status < 300, status, json: async () => body });
    return { calls, impl: impl as never };
  };

  it("sends the documented request: numOfDays, one dimension, Bearer token in the header only", async () => {
    const { calls, impl } = call1(200, OVERALL);
    assert.deepEqual(await fetchInsights(TOKEN, { numOfDays: 2, dimension: "Country/Region" }, impl), OVERALL);
    assert.equal(calls[0].url, `${CLARITY_ENDPOINT}?numOfDays=2&dimension1=Country%2FRegion`);
    assert.equal(calls[0].headers.Authorization, `Bearer ${TOKEN}`);
    assert.ok(!calls[0].url.includes(TOKEN));
    assert.equal(call1(200).calls.length, 0);
    const overall = call1(200, []);
    await fetchInsights(TOKEN, { numOfDays: 3 }, overall.impl);
    assert.equal(overall.calls[0].url, `${CLARITY_ENDPOINT}?numOfDays=3`);
  });

  it("maps failures to clear, safe errors that never contain the token", async () => {
    for (const [status, code] of [[401, "INVALID_TOKEN"], [403, "INVALID_TOKEN"], [429, "DAILY_LIMIT"], [400, "BAD_REQUEST"], [500, "UPSTREAM"], [503, "UPSTREAM"]] as const) {
      await assert.rejects(() => fetchInsights(TOKEN, { numOfDays: 1 }, call1(status).impl), (e: any) => e instanceof ClarityError && e.code === code && !e.message.includes(TOKEN), String(status));
    }
    const down = async () => { throw new Error(`connect ECONNREFUSED https://www.clarity.ms Bearer ${TOKEN}`); };
    await assert.rejects(() => fetchInsights(TOKEN, { numOfDays: 1 }, down as never), (e: any) => e.code === "UPSTREAM" && !e.message.includes(TOKEN));
    const bad = async () => ({ ok: true, status: 200, json: async () => { throw new Error("not json"); } });
    await assert.rejects(() => fetchInsights(TOKEN, { numOfDays: 1 }, bad as never), (e: any) => e.code === "UPSTREAM");
  });
});

class MemStore implements SnapshotStore {
  rows: SnapshotRow[] = [];
  async latest(n: number, d: string) { return this.rows.filter((r) => r.numOfDays === n && r.dimension === d).sort((a, b) => b.fetchedAt.getTime() - a.fetchedAt.getTime())[0] ?? null; }
  async countSince(since: Date) { return this.rows.filter((r) => r.fetchedAt >= since).length; }
  async save(r: { numOfDays: number; dimension: string; payload: unknown; fetchedAt: Date }) { this.rows.push({ id: `s${this.rows.length}`, ...r }); }
  async history(d: string, limit: number) { return this.rows.filter((r) => r.dimension === d).sort((a, b) => b.fetchedAt.getTime() - a.fetchedAt.getTime()).slice(0, limit); }
}

describe("ClarityService: cache, daily budget and stale fallback", () => {
  let store: MemStore;
  let now = new Date("2026-11-19T10:00:00Z");
  let token: string | undefined;
  let calls: number;
  let respond: () => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
  const svc = () => new ClarityService({ store, getConfig: () => ({ token, projectId: "proj123" }), now: () => now, fetchImpl: (async () => (calls++, respond())) as never });
  beforeEach(() => {
    store = new MemStore();
    now = new Date("2026-11-19T10:00:00Z");
    token = TOKEN;
    calls = 0;
    respond = async () => ({ ok: true, status: 200, json: async () => OVERALL });
  });

  it("is not connected without a token: a clear error and no network call", async () => {
    token = undefined;
    await assert.rejects(() => svc().report(3, ""), (e: any) => e.code === "NOT_CONFIGURED" && e.statusCode === 503);
    assert.equal(calls, 0);
    const st = await svc().status();
    assert.deepEqual([st.tokenConfigured, st.projectIdConfigured], [false, true]);
  });

  it("fetches once, then serves the stored report for 6 hours without calling Clarity again", async () => {
    const a = await svc().report(3, "");
    assert.equal(a.meta.source, "clarity");
    const b = await svc().report(3, "");
    assert.equal(b.meta.source, "cache");
    assert.equal(calls, 1);
    now = new Date(now.getTime() + CACHE_TTL_MS - 1000);
    assert.equal((await svc().report(3, "")).meta.source, "cache");
    now = new Date(now.getTime() + 2000);
    assert.equal((await svc().report(3, "")).meta.source, "clarity");
    assert.equal(calls, 2);
  });

  it("caches per (days, dimension): a different window or dimension is a separate request", async () => {
    await svc().report(3, "");
    await svc().report(1, "");
    await svc().report(3, "Device");
    assert.equal(calls, 3);
  });

  it("an explicit refresh asks Clarity again, but never beyond the daily budget", async () => {
    for (let i = 0; i < DAILY_BUDGET; i++) await svc().report(3, "", { refresh: true });
    assert.equal(calls, DAILY_BUDGET);
    const over = await svc().report(3, "", { refresh: true });
    assert.equal(calls, DAILY_BUDGET, "no request beyond the budget");
    assert.equal(over.meta.stale, true);
    assert.equal(over.meta.source, "cache");
    await assert.rejects(() => svc().report(3, "Browser"), (e: any) => e.code === "DAILY_LIMIT" && e.statusCode === 429, "nothing stored for this dimension to fall back on");
    assert.ok(DAILY_BUDGET < 10, "stays under Clarity's own limit of 10");
  });

  it("the budget resets at the next UTC day", async () => {
    for (let i = 0; i < DAILY_BUDGET; i++) await svc().report(3, "", { refresh: true });
    now = new Date("2026-11-20T00:00:05Z");
    assert.equal((await svc().report(3, "", { refresh: true })).meta.source, "clarity");
    assert.equal((await svc().status()).requestsUsedToday, 1);
  });

  it("if Clarity fails and an older snapshot exists it is returned marked stale; with none the error is shown", async () => {
    await svc().report(3, "");
    now = new Date(now.getTime() + CACHE_TTL_MS + 1000);
    respond = async () => ({ ok: false, status: 500, json: async () => ({}) });
    const stale = await svc().report(3, "");
    assert.deepEqual([stale.meta.stale, stale.meta.source], [true, "cache"]);
    await assert.rejects(() => svc().report(2, ""), (e: any) => e.code === "UPSTREAM");
  });

  it("a rejected token is never masked by old data", async () => {
    await svc().report(3, "");
    now = new Date(now.getTime() + CACHE_TTL_MS + 1000);
    respond = async () => ({ ok: false, status: 401, json: async () => ({}) });
    await assert.rejects(() => svc().report(3, ""), (e: any) => e.code === "INVALID_TOKEN");
  });

  it("status shows dashboard deep links (recordings, heatmaps) and never the token", async () => {
    const st = await svc().status();
    assert.match(st.dashboardLinks?.recordings ?? "", /^https:\/\/clarity\.microsoft\.com\/projects\/view\/proj123\//);
    assert.ok(!JSON.stringify(st).includes(TOKEN));
    token = undefined;
    const noProject = new ClarityService({ store, getConfig: () => ({ token: undefined, projectId: undefined }) });
    assert.equal((await noProject.status()).dashboardLinks, null);
  });

  it("history lists stored overall snapshots oldest first, parsed", async () => {
    await svc().report(3, "", { refresh: true });
    now = new Date(now.getTime() + 3600_000);
    await svc().report(3, "", { refresh: true });
    const h = await svc().history();
    assert.equal(h.length, 2);
    assert.ok(h[0].fetchedAt < h[1].fetchedAt);
    assert.equal(h[0].totals.sessions, 1200);
  });
});

describe("analytics endpoints (HTTP, real auth and permissions)", () => {
  let app: InboxApp;
  before(async () => {
    process.env.CLARITY_API_TOKEN = TOKEN;
    process.env.CLARITY_PROJECT_ID = "proj123";
    app = await startInboxApp({ env: {} });
  });
  after(async () => {
    await app.close();
    delete process.env.CLARITY_API_TOKEN;
    delete process.env.CLARITY_PROJECT_ID;
  });

  it("every analytics endpoint needs the Analytics module: 401, 403 for users and for an admin without it", async () => {
    for (const p of ["/analytics/status", "/analytics/overview", "/analytics/breakdown?dimension=Device", "/analytics/history"]) {
      assert.equal((await call(app, "GET", p)).status, 401, p);
      assert.equal((await call(app, "GET", p, { token: tokenFor("USER") })).status, 403, p);
      app.db.accessRows = [{ id: "a1", userId: ADMIN_OK.id, roleKey: "SUPPORT_AGENT", modules: ["dashboard", "inbox"] }];
      assert.equal((await call(app, "GET", p, { token: tokenFor("ADMIN", ADMIN_OK.id) })).status, 403, p);
      app.db.accessRows = [{ id: "a2", userId: ADMIN_OK.id, roleKey: "ANALYST", modules: ["dashboard", "analytics"] }];
      assert.notEqual((await call(app, "GET", p, { token: tokenFor("ADMIN", ADMIN_OK.id) })).status, 403, p);
      app.db.accessRows = [];
    }
  });

  it("status reports the connection without secrets and lists what Clarity cannot provide", async () => {
    const r = await asSuper(app, "GET", "/analytics/status");
    assert.equal(r.status, 200);
    assert.equal(r.json.data.tokenConfigured, true);
    assert.ok(!JSON.stringify(r.json).includes(TOKEN));
    const keys = r.json.data.unavailable.map((u: any) => u.key);
    for (const k of ["live", "newReturning", "entryExit", "journeys", "recordings", "heatmaps", "longRange"]) assert.ok(keys.includes(k), k);
  });

  it("validates inputs: days must be 1-3 and the dimension must be a real Clarity dimension", async () => {
    for (const q of ["days=0", "days=4", "days=abc", "days=1.5"]) assert.equal((await asSuper(app, "GET", `/analytics/overview?${q}`)).status, 400, q);
    for (const q of ["dimension=Nope", "dimension=", "dimension=Device;drop"]) assert.equal((await asSuper(app, "GET", `/analytics/breakdown?${q}`)).status, 400, q);
  });
});
