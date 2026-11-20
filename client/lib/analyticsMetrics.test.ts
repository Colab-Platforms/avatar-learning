import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { METRICS, compareToPrevious, formatMetric, metricByKey, share, trendPoints } from "./analyticsMetrics.js";
import type { ClarityHistoryItem, ClarityTotals } from "./businessAdminApi.js";

const totals = (o: Partial<ClarityTotals>): ClarityTotals => ({
  sessions: null, botSessions: null, distinctUsers: null, pagesPerSession: null, scrollDepthPercent: null, totalTimeSeconds: null,
  activeTimeSeconds: null, rageClickSessions: null, deadClickSessions: null, quickbackSessions: null, excessiveScrollSessions: null, scriptErrorSessions: null, ...o,
});
const item = (iso: string, days: number, sessions: number | null): ClarityHistoryItem => ({ fetchedAt: iso, numOfDays: days, totals: totals({ sessions }) });

describe("formatMetric", () => {
  it("shows a dash for missing values rather than 0", () => {
    assert.equal(formatMetric(null, "number"), "—");
    assert.equal(formatMetric(undefined, "seconds"), "—");
    assert.equal(formatMetric(Number.NaN, "percent"), "—");
  });
  it("formats each kind", () => {
    assert.equal(formatMetric(12345, "number"), "12,345");
    assert.equal(formatMetric(2.456, "decimal"), "2.46");
    assert.equal(formatMetric(41.25, "percent"), "41.3%");
    assert.equal(formatMetric(42, "seconds"), "42s");
    assert.equal(formatMetric(125, "seconds"), "2m 5s");
    assert.equal(formatMetric(3725, "seconds"), "1h 2m");
    assert.equal(formatMetric(0, "number"), "0");
  });
});

describe("compareToPrevious", () => {
  const cur = { fetchedAt: "2026-11-20T10:00:00Z", numOfDays: 3 };
  it("returns null with no usable earlier snapshot (Clarity cannot give past periods)", () => {
    assert.equal(compareToPrevious([], cur, "sessions", 10), null);
    assert.equal(compareToPrevious([item("2026-11-20T04:00:00Z", 3, 5)], cur, "sessions", 10), null); // same day, under 12h
    assert.equal(compareToPrevious([item("2026-11-19T04:00:00Z", 1, 5)], cur, "sessions", 10), null); // different window
    assert.equal(compareToPrevious([item("2026-11-19T04:00:00Z", 3, null)], cur, "sessions", 10), null);
    assert.equal(compareToPrevious([item("2026-11-19T04:00:00Z", 3, 5)], cur, "sessions", null), null);
  });
  it("uses the most recent eligible earlier snapshot", () => {
    const h = [item("2026-11-17T10:00:00Z", 3, 50), item("2026-11-19T10:00:00Z", 3, 80), item("2026-11-20T09:00:00Z", 3, 99)];
    const c = compareToPrevious(h, cur, "sessions", 100)!;
    assert.equal(c.previous, 80);
    assert.equal(c.delta, 20);
    assert.equal(c.percent, 25);
    assert.equal(c.previousAt, "2026-11-19T10:00:00Z");
  });
  it("has no percentage when the previous value was zero", () => {
    const c = compareToPrevious([item("2026-11-19T10:00:00Z", 3, 0)], cur, "sessions", 5)!;
    assert.equal(c.percent, null);
    assert.equal(c.delta, 5);
  });
});

describe("trendPoints / share / metrics table", () => {
  it("keeps only the same window and drops empty values, oldest first", () => {
    const h = [item("2026-11-19T00:00:00Z", 3, 7), item("2026-11-18T00:00:00Z", 3, 5), item("2026-11-18T00:00:00Z", 1, 9), item("2026-11-17T00:00:00Z", 3, null)];
    assert.deepEqual(trendPoints(h, 3, "sessions"), [{ at: "2026-11-18T00:00:00Z", value: 5 }, { at: "2026-11-19T00:00:00Z", value: 7 }]);
  });
  it("share is bounded and safe", () => {
    assert.equal(share(5, 0), 0);
    assert.equal(share(null, 10), 0);
    assert.equal(share(5, 10), 50);
    assert.equal(share(50, 10), 100);
  });
  it("every metric has a unique key and a lookup", () => {
    assert.equal(new Set(METRICS.map((m) => m.key)).size, METRICS.length);
    for (const m of METRICS) assert.equal(metricByKey(m.key), m);
    assert.equal(metricByKey("nope"), undefined);
  });
});
