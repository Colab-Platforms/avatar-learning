/**
 * Pure helpers for Live Monitoring (no database, no network), so every rule here is unit-tested.
 * Privacy rules live here: no fingerprinting (only the User-Agent header the browser already sends is summarised), query strings and
 * hashes are never stored, secrets are redacted from metadata, IPs are masked for anyone who is not a Super Admin.
 */

export interface MonitoringConfig {
  enabled: boolean;
  /** A visitor with no heartbeat for this long is OFFLINE. The page heartbeats every 30s. */
  onlineTimeoutSeconds: number;
  /** A session idle this long is closed (TIMEOUT) and the next visit starts a new one. */
  sessionIdleMinutes: number;
  /** Activity events (page views etc.) are deleted after this many days. */
  retentionDays: number;
  /** Sign-in / security events are kept longer for auditing, then deleted. */
  securityRetentionDays: number;
}

const int = (v: string | undefined, d: number, min: number, max: number) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};

/** Read at call time, so a change in the environment applies without a code change. */
export const monitoringConfig = (env: Record<string, string | undefined> = process.env): MonitoringConfig => ({
  // On unless MONITORING_ENABLED=false. Inside the Node test runner it is off unless a test asks for it, so unrelated tests never write.
  enabled: env.MONITORING_ENABLED !== undefined ? String(env.MONITORING_ENABLED).trim().toLowerCase() !== "false" : !env.NODE_TEST_CONTEXT,
  onlineTimeoutSeconds: int(env.MONITORING_ONLINE_TIMEOUT_SECONDS, 90, 20, 900),
  sessionIdleMinutes: int(env.MONITORING_SESSION_IDLE_MINUTES, 30, 5, 720),
  retentionDays: int(env.MONITORING_RETENTION_DAYS, 180, 7, 3650),
  securityRetentionDays: int(env.MONITORING_SECURITY_RETENTION_DAYS, 365, 30, 3650),
});

export const onlineCutoff = (now: Date, cfg: MonitoringConfig): Date => new Date(now.getTime() - cfg.onlineTimeoutSeconds * 1000);
export const idleCutoff = (now: Date, cfg: MonitoringConfig): Date => new Date(now.getTime() - cfg.sessionIdleMinutes * 60_000);

/** A session is ONLINE only when it is open AND its last heartbeat is recent. Nothing else (a login, an account) makes anyone online. */
export const isOnline = (s: { endedAt: Date | null; lastActivityAt: Date }, now: Date, cfg: MonitoringConfig): boolean =>
  s.endedAt === null && s.lastActivityAt.getTime() > onlineCutoff(now, cfg).getTime();

/** Start of today in India time (the business's day), as a UTC Date. */
export const istDayStart = (now: Date): Date => {
  const IST = 5.5 * 3600_000;
  const local = new Date(now.getTime() + IST);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - IST);
};

// ─── identifiers ───────────────────────────────────────────────────────────
/** The first-party visitor id the browser generates: random, URL-safe, 20-64 chars. Anything else is rejected. */
export const isValidVisitorKey = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{20,64}$/.test(v);

// ─── user agent (summary only; no fingerprinting) ───────────────────────────
export interface DeviceInfo { deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown"; browser: string; os: string }

export function parseUserAgent(ua: string | undefined | null): DeviceInfo {
  const s = String(ua ?? "").slice(0, 400);
  if (!s) return { deviceType: "unknown", browser: "Unknown", os: "Unknown" };
  if (/bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|monitor|facebookexternalhit|preview/i.test(s)) {
    return { deviceType: "bot", browser: "Bot", os: "Unknown" };
  }
  const tablet = /iPad|Tablet|Android(?!.*Mobile)/i.test(s);
  const mobile = !tablet && /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(s);
  const browser = /Edg(e|A|iOS)?\//.test(s) ? "Edge"
    : /OPR\/|Opera/.test(s) ? "Opera"
    : /SamsungBrowser/.test(s) ? "Samsung Internet"
    : /(Firefox|FxiOS)\//.test(s) ? "Firefox"
    : /(Chrome|CriOS)\//.test(s) ? "Chrome"
    : /Safari\//.test(s) && /Version\//.test(s) ? "Safari"
    : "Other";
  const os = /Windows NT/.test(s) ? "Windows"
    : /Android/.test(s) ? "Android"
    : /(iPhone|iPad|iPod|iOS)/.test(s) ? "iOS"
    : /Mac OS X|Macintosh/.test(s) ? "macOS"
    : /CrOS/.test(s) ? "ChromeOS"
    : /Linux/.test(s) ? "Linux"
    : "Other";
  return { deviceType: tablet ? "tablet" : mobile ? "mobile" : "desktop", browser, os };
}

// ─── paths ──────────────────────────────────────────────────────────────────
/** A site path only: no scheme/host, no query string, no hash (reset tokens, emails and ids in query strings are never stored). */
export function cleanPath(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let p = input.trim();
  if (!p) return null;
  try {
    if (/^https?:\/\//i.test(p)) p = new URL(p).pathname;
  } catch {
    return null;
  }
  p = p.split("#")[0].split("?")[0];
  if (!p.startsWith("/")) return null;
  return p.replace(/[\u0000-\u001f]/g, "").slice(0, 200);
}

/** Referrer reduced to its hostname (where the visit came from), or null. */
export function cleanReferrer(input: unknown): string | null {
  if (typeof input !== "string" || !input.trim()) return null;
  try {
    const h = new URL(input.trim()).hostname.toLowerCase();
    return h ? h.slice(0, 120) : null;
  } catch {
    return null;
  }
}

/** Admin screens are never tracked: administrators' own use of the dashboards is not "visitor activity". */
export const isUntrackedPath = (p: string | null): boolean => !p || /^\/(admin|admin-adaption|dev-adaption-login)(\/|$)/i.test(p);

export type ActivityType =
  | "PAGE_VIEW" | "COURSE_VIEW" | "LESSON_VIEW" | "FEATURE_USED"
  | "LESSON_COMPLETED" | "TEST_STARTED" | "TEST_COMPLETED" | "PROFILE_UPDATED"
  | "SUBSCRIPTION" | "PAYMENT" | "ENROLLMENT" | "ADMIN_CHANGE";
export type AuthType =
  | "REGISTERED" | "EMAIL_VERIFIED" | "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT" | "SESSION_EXPIRED" | "SESSION_TERMINATED"
  | "PASSWORD_CHANGED" | "ACCOUNT_ACTIVATED" | "ACCOUNT_DEACTIVATED";

export const ACTIVITY_TYPES: readonly ActivityType[] = ["PAGE_VIEW", "COURSE_VIEW", "LESSON_VIEW", "FEATURE_USED", "LESSON_COMPLETED", "TEST_STARTED", "TEST_COMPLETED", "PROFILE_UPDATED", "SUBSCRIPTION", "PAYMENT", "ENROLLMENT", "ADMIN_CHANGE"];
export const AUTH_TYPES: readonly AuthType[] = ["REGISTERED", "EMAIL_VERIFIED", "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT", "SESSION_EXPIRED", "SESSION_TERMINATED", "PASSWORD_CHANGED", "ACCOUNT_ACTIVATED", "ACCOUNT_DEACTIVATED"];

/** The browser may only report these (everything business-critical is recorded server-side, never taken from the client). */
export const CLIENT_REPORTABLE: readonly ActivityType[] = ["FEATURE_USED"];

/** What kind of page view this is, from the path alone. */
export function classifyPath(path: string): { type: ActivityType; module: string } {
  const p = path.toLowerCase();
  if (/^\/courses\/[^/]+\/(learn|lesson|topic)(\/|$)/.test(p)) return { type: "LESSON_VIEW", module: "courses" };
  if (/^\/courses\/[^/]+\/(assessment|test)(\/|$)/.test(p)) return { type: "PAGE_VIEW", module: "assessments" };
  if (/^\/courses\/[^/]+(\/|$)/.test(p)) return { type: "COURSE_VIEW", module: "courses" };
  const first = p.split("/")[1] || "home";
  return { type: "PAGE_VIEW", module: first };
}

// ─── redaction ──────────────────────────────────────────────────────────────
const SENSITIVE_KEY = /pass(word|wd)?|secret|token|otp|cookie|authorization|auth|session|cvv|card|iban|account.?no|pin\b|signature|api.?key|private|credential|bearer|refresh/i;

/** Drops secret-looking keys, caps depth/size/length, keeps only plain JSON values. Used for every metadata object. */
export function sanitizeMetadata(input: unknown, depth = 0): unknown {
  if (input === null || input === undefined) return undefined;
  if (typeof input === "string") return input.length > 200 ? `${input.slice(0, 200)}…` : input;
  if (typeof input === "number") return Number.isFinite(input) ? input : undefined;
  if (typeof input === "boolean") return input;
  if (depth >= 2) return undefined;
  if (Array.isArray(input)) return input.slice(0, 20).map((v) => sanitizeMetadata(v, depth + 1)).filter((v) => v !== undefined);
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>).slice(0, 20)) {
      if (SENSITIVE_KEY.test(k)) continue;
      const clean = sanitizeMetadata(v, depth + 1);
      if (clean !== undefined) out[k.slice(0, 60)] = clean;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return undefined;
}

// ─── IP ─────────────────────────────────────────────────────────────────────
/** Keeps the network, hides the host part: 203.0.113.42 -> 203.0.113.xxx ; 2001:db8:1:2::9 -> 2001:db8:1:xxxx. */
export function maskIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const v4 = ip.replace(/^::ffff:/i, "");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v4)) return v4.replace(/\.\d{1,3}$/, ".xxx");
  if (ip.includes(":")) return ip.split(":").slice(0, 3).join(":") + ":xxxx";
  return "hidden";
}

/** Client IP as the server sees it (Express trust proxy is already set), trimmed and length-capped. */
export const cleanIp = (ip: string | undefined | null): string | null => (ip ? String(ip).slice(0, 64) : null);

/** Only a country code a CDN/proxy already added to the request; never looked up from the IP. */
export function countryFromHeaders(h: Record<string, string | string[] | undefined>): string | null {
  const raw = (h["x-vercel-ip-country"] ?? h["cf-ipcountry"] ?? h["cloudfront-viewer-country"]) as string | undefined;
  const v = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  return /^[A-Z]{2}$/.test(v) && v !== "XX" && v !== "T1" ? v : null;
}

export const clampInt = (v: unknown, d: number, min: number, max: number): number => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};

/** An optional ISO date/datetime query value, or undefined if absent/invalid. */
export const parseDate = (v: unknown): Date | undefined => {
  if (typeof v !== "string" || !v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
