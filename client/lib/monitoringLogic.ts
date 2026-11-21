/** Pure helpers for the Live Monitoring admin pages (formatting, labels, filters, the live-stream reader). Unit-tested. */

export type SessionRow = {
  id: string; visitorId: string; kind: "guest" | "registered"; userId: string | null; name: string | null; email: string | null;
  online: boolean; status: "online" | "offline"; loginStatus: "guest" | "signed_in" | "signed_out"; currentPath: string | null;
  device: { type: string; browser: string; os: string }; startedAt: string; lastActivityAt: string; endedAt: string | null; endReason: string | null;
  pageViews: number; referrer: string | null; canTerminate: boolean;
};
export type Stats = {
  activeNow: number; activeRegistered: number; activeGuests: number; totalRegisteredUsers: number; loginsToday: number; newRegistrationsToday: number;
  failedLoginsToday: number; sessionsToday: number; onlineTimeoutSeconds: number; serverTime: string;
};
export type Snapshot = { stats: Stats; live: SessionRow[]; total: number };

export const rowTitle = (s: Pick<SessionRow, "kind" | "name" | "email" | "visitorId">): string =>
  s.kind === "registered" ? s.name || s.email || "Registered user" : `Guest ${s.visitorId.slice(-6)}`;

export function relativeTime(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} d ago`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export const sessionLength = (s: Pick<SessionRow, "startedAt" | "lastActivityAt" | "endedAt">): number =>
  Math.max(0, ((s.endedAt ? new Date(s.endedAt) : new Date(s.lastActivityAt)).getTime() - new Date(s.startedAt).getTime()) / 1000);

export const deviceLabel = (d: { type?: string | null; browser?: string | null; os?: string | null }): string =>
  [d.browser && d.browser !== "Unknown" ? d.browser : null, d.os && d.os !== "Unknown" ? d.os : null].filter(Boolean).join(" · ") || "Unknown device";

// ─── events ──────────────────────────────────────────────────────────
export const EVENT_LABELS: Record<string, string> = {
  PAGE_VIEW: "Viewed a page", COURSE_VIEW: "Viewed a course", LESSON_VIEW: "Opened a lesson", FEATURE_USED: "Used a feature",
  LESSON_COMPLETED: "Completed a lesson", TEST_STARTED: "Started a test", TEST_COMPLETED: "Finished a test", PROFILE_UPDATED: "Updated their profile",
  SUBSCRIPTION: "Subscription activity", PAYMENT: "Payment", ENROLLMENT: "Enrolled in a course", ADMIN_CHANGE: "Account changed by an admin",
  REGISTERED: "Registered", EMAIL_VERIFIED: "Verified email", LOGIN_SUCCESS: "Signed in", LOGIN_FAILED: "Failed sign-in", LOGOUT: "Signed out",
  SESSION_EXPIRED: "Session expired", SESSION_TERMINATED: "Session ended by an admin", PASSWORD_CHANGED: "Changed password",
  ACCOUNT_ACTIVATED: "Account activated", ACCOUNT_DEACTIVATED: "Account deactivated",
};
export type EventGroup = "auth" | "browse" | "learning" | "business" | "account";
export const EVENT_GROUPS: Record<string, EventGroup> = {
  PAGE_VIEW: "browse", COURSE_VIEW: "browse", LESSON_VIEW: "learning", FEATURE_USED: "browse", LESSON_COMPLETED: "learning", TEST_STARTED: "learning", TEST_COMPLETED: "learning",
  PROFILE_UPDATED: "account", SUBSCRIPTION: "business", PAYMENT: "business", ENROLLMENT: "business", ADMIN_CHANGE: "account",
  REGISTERED: "auth", EMAIL_VERIFIED: "auth", LOGIN_SUCCESS: "auth", LOGIN_FAILED: "auth", LOGOUT: "auth", SESSION_EXPIRED: "auth", SESSION_TERMINATED: "auth", PASSWORD_CHANGED: "auth",
  ACCOUNT_ACTIVATED: "account", ACCOUNT_DEACTIVATED: "account",
};
export const GROUP_TONE: Record<EventGroup, "ok" | "warn" | "off" | "info"> = { auth: "info", browse: "off", learning: "ok", business: "warn", account: "info" };

/** Filter choices, grouped for the event-type filter. */
export const EVENT_FILTER_GROUPS: Array<{ label: string; types: string[] }> = [
  { label: "Authentication", types: ["REGISTERED", "EMAIL_VERIFIED", "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT", "SESSION_EXPIRED", "SESSION_TERMINATED", "PASSWORD_CHANGED"] },
  { label: "Website activity", types: ["PAGE_VIEW", "COURSE_VIEW", "LESSON_VIEW", "FEATURE_USED", "LESSON_COMPLETED", "TEST_STARTED", "TEST_COMPLETED", "PROFILE_UPDATED"] },
  { label: "Business", types: ["ENROLLMENT", "PAYMENT", "SUBSCRIPTION", "ADMIN_CHANGE", "ACCOUNT_ACTIVATED", "ACCOUNT_DEACTIVATED"] },
];

export type TimelineEvent = { id: string; category: string; type: string; at: string; path: string | null; module: string | null; outcome: string | null; reason: string | null; metadata: Record<string, unknown> | null; device: { type?: string | null; browser?: string | null; os?: string | null } };

export function describeEvent(e: Pick<TimelineEvent, "type" | "path" | "reason" | "metadata">): { title: string; detail: string | null } {
  const title = EVENT_LABELS[e.type] ?? e.type;
  const m = e.metadata ?? {};
  const bits: string[] = [];
  if (e.path && (e.type.endsWith("_VIEW") || e.type === "FEATURE_USED")) bits.push(e.path);
  if (typeof m.course === "string") bits.push(m.course);
  if (typeof m.feature === "string") bits.push(m.feature);
  if (typeof m.amount === "number") bits.push(`₹${m.amount}`);
  if (typeof m.scorePercent === "number") bits.push(`${m.scorePercent}%`);
  if (e.type === "LOGIN_FAILED" && e.reason) bits.push(e.reason.toLowerCase().replace(/_/g, " "));
  if (e.type === "SESSION_TERMINATED") bits.push("by an administrator");
  return { title, detail: bits.length ? bits.join(" · ") : null };
}

// ─── queries ─────────────────────────────────────────────────────────
/** Builds a query string, leaving out empty values. */
export function buildQuery(params: Record<string, string | number | boolean | null | undefined | string[]>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    q.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** A day range ending now, as ISO strings. `days` 0 means "no limit". */
export function rangeFor(days: number, now: Date = new Date()): { from?: string; to?: string } {
  if (!days) return {};
  return { from: new Date(now.getTime() - days * 86_400_000).toISOString(), to: now.toISOString() };
}

export const pageCount = (total: number, pageSize: number): number => Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

// ─── live stream (Server-Sent Events read through fetch) ──────────────────────
/** Splits a buffer into complete SSE messages and the unfinished remainder. Comments (": ...") and unknown fields are ignored. */
export function parseSse(buffer: string): { events: Array<{ event: string; data: string }>; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const events: Array<{ event: string; data: string }> = [];
  for (const block of parts) {
    let event = "message";
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
    }
    if (data.length) events.push({ event, data: data.join("\n") });
  }
  return { events, rest };
}

/** Exponential back-off for stream reconnects, capped. */
export const backoffMs = (attempt: number): number => Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5));

/** Client-side filter for the live table (the stream carries the latest rows). */
export function filterLive(rows: SessionRow[], f: { kind?: string; search?: string }): SessionRow[] {
  const q = (f.search ?? "").trim().toLowerCase();
  return rows.filter((r) => {
    if (f.kind === "guest" && r.kind !== "guest") return false;
    if (f.kind === "registered" && r.kind !== "registered") return false;
    if (!q) return true;
    return [r.name, r.email, r.currentPath, r.device.browser, r.device.os, r.visitorId].some((v) => (v ?? "").toLowerCase().includes(q));
  });
}
