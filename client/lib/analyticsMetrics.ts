import type { ClarityHistoryItem, ClarityTotals } from "./businessAdminApi";

export type MetricFormat = "number" | "percent" | "decimal" | "seconds";

export interface MetricDef {
  key: string;
  label: string;
  field: keyof ClarityTotals;
  format: MetricFormat;
  /** Sessions/users can be split by every Clarity dimension; the other metrics only exist as an overall number. */
  breakdown: boolean;
  /** For "bad" metrics (errors, rage clicks) an increase is not good news. */
  higherIsBetter: boolean;
  description: string;
}

export const METRICS: MetricDef[] = [
  { key: "sessions", label: "Sessions", field: "sessions", format: "number", breakdown: true, higherIsBetter: true, description: "Visits to the website recorded by Clarity (bot traffic excluded by Clarity)." },
  { key: "users", label: "Distinct visitors", field: "distinctUsers", format: "number", breakdown: true, higherIsBetter: true, description: "Distinct visitors Clarity identified in the period. A visitor is a browser, not a person." },
  { key: "pages-per-session", label: "Pages per session", field: "pagesPerSession", format: "decimal", breakdown: false, higherIsBetter: true, description: "Average number of pages viewed in a session." },
  { key: "active-time", label: "Active time", field: "activeTimeSeconds", format: "seconds", breakdown: false, higherIsBetter: true, description: "Time visitors were actively interacting (not an idle tab), as reported by Clarity." },
  { key: "total-time", label: "Total time", field: "totalTimeSeconds", format: "seconds", breakdown: false, higherIsBetter: true, description: "Time visitors had the site open, as reported by Clarity." },
  { key: "scroll-depth", label: "Scroll depth", field: "scrollDepthPercent", format: "percent", breakdown: false, higherIsBetter: true, description: "How far down the page visitors scrolled on average." },
  { key: "rage-clicks", label: "Rage clicks", field: "rageClickSessions", format: "number", breakdown: false, higherIsBetter: false, description: "Sessions where a visitor clicked repeatedly in frustration. Watch the recordings in Clarity to see where." },
  { key: "dead-clicks", label: "Dead clicks", field: "deadClickSessions", format: "number", breakdown: false, higherIsBetter: false, description: "Sessions with clicks that did nothing." },
  { key: "quick-backs", label: "Quick backs", field: "quickbackSessions", format: "number", breakdown: false, higherIsBetter: false, description: "Sessions where the visitor went back almost immediately after arriving on a page." },
  { key: "excessive-scroll", label: "Excessive scrolling", field: "excessiveScrollSessions", format: "number", breakdown: false, higherIsBetter: false, description: "Sessions with unusually fast or long scrolling, which can mean visitors cannot find something." },
  { key: "js-errors", label: "JavaScript errors", field: "scriptErrorSessions", format: "number", breakdown: false, higherIsBetter: false, description: "Sessions where a script error happened in the visitor's browser." },
];

export const metricByKey = (key: string): MetricDef | undefined => METRICS.find((m) => m.key === key);

/** Breakdown tables offered on a detail page (the dimensions Clarity supports). */
export const DIMENSION_LABELS: Record<string, string> = {
  Source: "Traffic source",
  Medium: "Medium",
  Campaign: "Campaign",
  Channel: "Channel",
  Device: "Device",
  Browser: "Browser",
  OS: "Operating system",
  "Country/Region": "Country / region",
  URL: "Pages",
};

export function formatMetric(value: number | null | undefined, format: MetricFormat): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  switch (format) {
    case "number":
      return Math.round(value).toLocaleString("en-IN");
    case "decimal":
      return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
    case "percent":
      return `${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`;
    case "seconds": {
      const s = Math.round(value);
      if (s < 60) return `${s}s`;
      const m = Math.floor(s / 60);
      return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
    }
  }
}

export interface Comparison {
  previous: number;
  delta: number;
  /** null when the previous value was 0 (a percentage is meaningless). */
  percent: number | null;
  previousAt: string;
}

const MIN_GAP_MS = 12 * 60 * 60 * 1000;

/**
 * Compares the current value with the most recent EARLIER stored snapshot for the same window length (at least 12 hours
 * older, so two reads of the same day are not presented as a trend). Returns null when no such snapshot exists:
 * Clarity itself cannot return past periods, so there is nothing to compare against until snapshots accumulate.
 */
export function compareToPrevious(history: ClarityHistoryItem[], current: { fetchedAt: string; numOfDays: number }, field: keyof ClarityTotals, currentValue: number | null): Comparison | null {
  if (currentValue === null) return null;
  const now = new Date(current.fetchedAt).getTime();
  if (Number.isNaN(now)) return null;
  let best: ClarityHistoryItem | null = null;
  for (const h of history) {
    if (h.numOfDays !== current.numOfDays) continue;
    const t = new Date(h.fetchedAt).getTime();
    if (Number.isNaN(t) || now - t < MIN_GAP_MS || h.totals[field] === null) continue;
    if (!best || t > new Date(best.fetchedAt).getTime()) best = h;
  }
  if (!best) return null;
  const previous = best.totals[field] as number;
  const delta = currentValue - previous;
  return { previous, delta, percent: previous === 0 ? null : (delta / previous) * 100, previousAt: best.fetchedAt };
}

/** Points for a trend chart: one point per stored snapshot for this window length that has a value, oldest first. */
export function trendPoints(history: ClarityHistoryItem[], numOfDays: number, field: keyof ClarityTotals): Array<{ at: string; value: number }> {
  return history
    .filter((h) => h.numOfDays === numOfDays && h.totals[field] !== null)
    .map((h) => ({ at: h.fetchedAt, value: h.totals[field] as number }))
    .sort((a, b) => a.at.localeCompare(b.at));
}

/** Share of the total for table bars; never divides by zero. */
export const share = (value: number | null, total: number): number => (value === null || total <= 0 ? 0 : Math.max(0, Math.min(100, (value / total) * 100)));
