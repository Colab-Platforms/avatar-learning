// Microsoft Clarity "Data Export API" integration (project-live-insights). This is the ONLY Clarity data source here:
// nothing is scraped from the Clarity dashboard and no capability is assumed beyond what the documented endpoint returns.
//
// Documented limits this module is built around (verify against Clarity's current docs before relying on them):
//  - data covers the last 1, 2 or 3 days only (numOfDays)
//  - at most 10 requests per project per day
//  - up to 3 dimensions, from: Browser, Device, Country/Region, OS, Source, Medium, Campaign, Channel, URL
//  - authentication: a project API token as a Bearer token
// NOT available through any Clarity API: live visitor count, individual sessions, session recordings, heatmaps,
// entry/exit pages, visitor journeys, new-vs-returning. The UI says so instead of showing numbers for them.
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";

export const CLARITY_ENDPOINT = "https://www.clarity.ms/export-data/api/v1/project-live-insights";
export const DIMENSIONS = ["Browser", "Device", "Country/Region", "OS", "Source", "Medium", "Campaign", "Channel", "URL"] as const;
export type Dimension = (typeof DIMENSIONS)[number];
export const isDimension = (v: unknown): v is Dimension => typeof v === "string" && (DIMENSIONS as readonly string[]).includes(v);

/** Clarity allows 10/day; keep headroom for manual use of the same token elsewhere. */
export const DAILY_BUDGET = 8;
export const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export type ClarityErrorCode = "NOT_CONFIGURED" | "INVALID_TOKEN" | "DAILY_LIMIT" | "UPSTREAM" | "BAD_REQUEST";
export class ClarityError extends ApiError {
  constructor(readonly code: ClarityErrorCode, message: string, statusCode: number) {
    super(message, statusCode);
    Object.setPrototypeOf(this, ClarityError.prototype);
  }
}

// ─── parsing ─────────────────────────────────────────────────────────────────
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v.trim().slice(0, 300) : null);

export interface Totals {
  sessions: number | null;
  botSessions: number | null;
  distinctUsers: number | null;
  pagesPerSession: number | null;
  scrollDepthPercent: number | null;
  totalTimeSeconds: number | null;
  activeTimeSeconds: number | null;
  rageClickSessions: number | null;
  deadClickSessions: number | null;
  quickbackSessions: number | null;
  excessiveScrollSessions: number | null;
  scriptErrorSessions: number | null;
}

export interface Row {
  label: string;
  sessions: number | null;
  users: number | null;
  /** The labelled dimension values of this row (e.g. { Device: "Mobile" }). */
  dims: Record<string, string>;
}

const metric = (data: unknown, name: string): Obj[] => {
  if (!Array.isArray(data)) return [];
  const m = data.find((x) => isObj(x) && String(x.metricName ?? "").toLowerCase() === name.toLowerCase());
  return isObj(m) && Array.isArray(m.information) ? (m.information.filter(isObj) as Obj[]) : [];
};
const first = (o: Obj[]): Obj => o[0] ?? {};
/** Field lookup that ignores case and accepts alternative spellings (Microsoft's own sample writes "distantUserCount" and "PagesPerSessionPercentage"). */
const field = (o: Obj, ...names: string[]): unknown => {
  const wanted = names.map((n) => n.toLowerCase());
  const key = Object.keys(o).find((k) => wanted.includes(k.toLowerCase()));
  return key === undefined ? undefined : o[key];
};
const sum = (rows: Obj[], ...keys: string[]): number | null => {
  const vals = rows.map((r) => num(field(r, ...keys))).filter((n): n is number => n !== null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
};

/** Reads the unfiltered ("overall") response. Missing metrics stay null: never zero, never guessed. */
export function parseTotals(data: unknown): Totals {
  const traffic = metric(data, "Traffic");
  const t = first(traffic);
  const eng = first(metric(data, "EngagementTime"));
  const scroll = first(metric(data, "ScrollDepth"));
  const sessionsOf = (name: string) => sum(metric(data, name), "sessionsCount") ?? sum(metric(data, name), "subTotal");
  return {
    sessions: sum(traffic, "totalSessionCount"),
    botSessions: sum(traffic, "totalBotSessionCount"),
    distinctUsers: sum(traffic, "distinctUserCount", "distantUserCount"),
    pagesPerSession: num(field(t, "pagesPerSessionPercentage")),
    scrollDepthPercent: num(scroll.averageScrollDepth),
    totalTimeSeconds: num(eng.totalTime),
    activeTimeSeconds: num(eng.activeTime),
    rageClickSessions: sessionsOf("RageClickCount"),
    deadClickSessions: sessionsOf("DeadClickCount"),
    quickbackSessions: sessionsOf("QuickbackClick"),
    excessiveScrollSessions: sessionsOf("ExcessiveScroll"),
    scriptErrorSessions: sessionsOf("ScriptErrorCount"),
  };
}

const DIM_KEYS: Record<Dimension, string[]> = {
  Browser: ["Browser"],
  Device: ["Device"],
  "Country/Region": ["Country", "CountryRegion", "Country/Region"],
  OS: ["OS"],
  Source: ["Source"],
  Medium: ["Medium"],
  Campaign: ["Campaign"],
  Channel: ["Channel"],
  URL: ["Url", "URL"],
};

/** Rows of a single-dimension response, taken from its Traffic metric, largest first. */
export function parseRows(data: unknown, dimension: Dimension): Row[] {
  const rows = metric(data, "Traffic").map((r): Row | null => {
    const key = DIM_KEYS[dimension].find((k) => str(r[k]) !== null);
    const label = key ? str(r[key]) : null;
    if (!label) return null;
    return { label, sessions: num(r.totalSessionCount), users: num(field(r, "distinctUserCount", "distantUserCount")), dims: { [dimension]: label } };
  });
  return (rows.filter(Boolean) as Row[]).sort((a, b) => (b.sessions ?? 0) - (a.sessions ?? 0));
}

/** "Popular pages" (URL dimension) from the PopularPages metric, with Traffic as a fallback. */
export function parsePages(data: unknown): Array<{ url: string; visits: number | null }> {
  const popular = metric(data, "PopularPages").map((r) => ({ url: str(r.url) ?? str(r.Url) ?? "", visits: num(r.visitsCount) }));
  const rows = popular.length ? popular : parseRows(data, "URL").map((r) => ({ url: r.label, visits: r.sessions }));
  return rows.filter((r) => r.url).sort((a, b) => (b.visits ?? 0) - (a.visits ?? 0));
}

// ─── HTTP client ─────────────────────────────────────────────────────────────
type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export async function fetchInsights(
  token: string,
  opts: { numOfDays: 1 | 2 | 3; dimension?: Dimension },
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<unknown> {
  const url = `${CLARITY_ENDPOINT}?numOfDays=${opts.numOfDays}${opts.dimension ? `&dimension1=${encodeURIComponent(opts.dimension)}` : ""}`;
  let res;
  try {
    res = await fetchImpl(url, { method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(20_000) });
  } catch {
    // Never include the cause: it can echo the URL or headers.
    throw new ClarityError("UPSTREAM", "Could not reach Microsoft Clarity. Try again later.", STATUS_CODES.SERVICE_UNAVAILABLE);
  }
  if (res.status === 401 || res.status === 403) throw new ClarityError("INVALID_TOKEN", "Clarity rejected the API token. Create a new Data Export token in Clarity (Settings, Data Export) and update CLARITY_API_TOKEN.", STATUS_CODES.CONFLICT);
  if (res.status === 429) throw new ClarityError("DAILY_LIMIT", "Clarity's daily request limit (10 per project) has been reached. Data refreshes again tomorrow.", STATUS_CODES.TOO_MANY_REQUESTS);
  if (res.status === 400) throw new ClarityError("BAD_REQUEST", "Clarity did not accept this report request.", STATUS_CODES.BAD_REQUEST);
  if (!res.ok) throw new ClarityError("UPSTREAM", `Microsoft Clarity answered with an error (${res.status}).`, STATUS_CODES.SERVICE_UNAVAILABLE);
  return res.json().catch(() => {
    throw new ClarityError("UPSTREAM", "Microsoft Clarity returned an unreadable response.", STATUS_CODES.SERVICE_UNAVAILABLE);
  });
}

// ─── storage + service ───────────────────────────────────────────────────────
export interface SnapshotRow {
  id: string;
  numOfDays: number;
  dimension: string;
  payload: unknown;
  fetchedAt: Date;
}
export interface SnapshotStore {
  latest(numOfDays: number, dimension: string): Promise<SnapshotRow | null>;
  countSince(since: Date): Promise<number>;
  save(row: { numOfDays: number; dimension: string; payload: unknown; fetchedAt: Date }): Promise<void>;
  history(dimension: string, limit: number): Promise<SnapshotRow[]>;
}

export interface ClarityConfig {
  token?: string;
  projectId?: string;
}
export const readClarityConfig = (env: Record<string, string | undefined> = process.env): ClarityConfig => ({
  token: env.CLARITY_API_TOKEN?.trim() || undefined,
  projectId: env.CLARITY_PROJECT_ID?.trim() || undefined,
});

const startOfUtcDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

export interface ReportMeta {
  numOfDays: number;
  dimension: string;
  fetchedAt: string;
  source: "cache" | "clarity";
  stale: boolean;
}

export class ClarityService {
  constructor(
    private readonly deps: {
      store: SnapshotStore;
      getConfig: () => ClarityConfig;
      fetchImpl?: FetchLike;
      now?: () => Date;
    },
  ) {}
  private now() {
    return (this.deps.now ?? (() => new Date()))();
  }

  /** Non-secret status for the connection screen: booleans, counts and links only, never the token. */
  async status() {
    const c = this.deps.getConfig();
    const used = await this.deps.store.countSince(startOfUtcDay(this.now()));
    const base = c.projectId ? `https://clarity.microsoft.com/projects/view/${encodeURIComponent(c.projectId)}` : null;
    return {
      tokenConfigured: Boolean(c.token),
      projectIdConfigured: Boolean(c.projectId),
      requestsUsedToday: used,
      requestsAllowedPerDay: DAILY_BUDGET,
      cacheMinutes: CACHE_TTL_MS / 60_000,
      dashboardLinks: base ? { dashboard: `${base}/dashboard`, recordings: `${base}/impressions`, heatmaps: `${base}/heatmaps`, settings: `${base}/settings` } : null,
      dimensions: [...DIMENSIONS],
    };
  }

  /**
   * Returns a stored report when it is fresh; otherwise asks Clarity (within the daily budget). If Clarity cannot be
   * asked (limit/err) and an older snapshot exists, that snapshot is returned marked stale rather than nothing.
   */
  async report(numOfDays: 1 | 2 | 3, dimension: Dimension | "", opts: { refresh?: boolean } = {}): Promise<{ data: unknown; meta: ReportMeta }> {
    const cfg = this.deps.getConfig();
    if (!cfg.token) throw new ClarityError("NOT_CONFIGURED", "Clarity is not connected. Set CLARITY_API_TOKEN on the server (a Data Export API token from your Clarity project).", STATUS_CODES.SERVICE_UNAVAILABLE);
    const { store } = this.deps;
    const now = this.now();
    const cached = await store.latest(numOfDays, dimension);
    const fresh = cached && now.getTime() - cached.fetchedAt.getTime() < CACHE_TTL_MS;
    const meta = (row: SnapshotRow, source: ReportMeta["source"], stale: boolean): ReportMeta => ({ numOfDays, dimension, fetchedAt: row.fetchedAt.toISOString(), source, stale });
    if (cached && fresh && !opts.refresh) return { data: cached.payload, meta: meta(cached, "cache", false) };

    const fallback = (err: ClarityError) => {
      if (cached) return { data: cached.payload, meta: meta(cached, "cache", true) };
      throw err;
    };
    const used = await store.countSince(startOfUtcDay(now));
    if (used >= DAILY_BUDGET) return fallback(new ClarityError("DAILY_LIMIT", "This server has used its daily budget of Clarity requests (kept below Clarity's limit of 10). Data refreshes tomorrow.", STATUS_CODES.TOO_MANY_REQUESTS));
    try {
      const payload = await fetchInsights(cfg.token, { numOfDays, dimension: dimension || undefined }, this.deps.fetchImpl);
      const fetchedAt = this.now();
      await store.save({ numOfDays, dimension, payload, fetchedAt });
      return { data: payload, meta: { numOfDays, dimension, fetchedAt: fetchedAt.toISOString(), source: "clarity", stale: false } };
    } catch (err) {
      if (err instanceof ClarityError && err.code !== "INVALID_TOKEN" && err.code !== "BAD_REQUEST") return fallback(err);
      throw err;
    }
  }

  /** Stored overall snapshots, oldest first: the only source of history beyond Clarity's 3-day window. */
  async history(limit = 60): Promise<Array<{ fetchedAt: string; numOfDays: number; totals: Totals }>> {
    const rows = await this.deps.store.history("", limit);
    return rows.map((r) => ({ fetchedAt: r.fetchedAt.toISOString(), numOfDays: r.numOfDays, totals: parseTotals(r.payload) })).reverse();
  }
}

/** Prisma-backed snapshot store. */
export interface ClarityDb {
  claritySnapshot: {
    findFirst(args: any): Promise<any | null>;
    findMany(args: any): Promise<any[]>;
    count(args: any): Promise<number>;
    create(args: any): Promise<any>;
  };
}
export class PrismaSnapshotStore implements SnapshotStore {
  constructor(private readonly db: ClarityDb) {}
  async latest(numOfDays: number, dimension: string) {
    return this.db.claritySnapshot.findFirst({ where: { numOfDays, dimension }, orderBy: { fetchedAt: "desc" } });
  }
  countSince(since: Date) {
    return this.db.claritySnapshot.count({ where: { fetchedAt: { gte: since } } });
  }
  async save(row: { numOfDays: number; dimension: string; payload: unknown; fetchedAt: Date }) {
    await this.db.claritySnapshot.create({ data: row });
  }
  history(dimension: string, limit: number) {
    return this.db.claritySnapshot.findMany({ where: { dimension }, orderBy: { fetchedAt: "desc" }, take: limit });
  }
}
