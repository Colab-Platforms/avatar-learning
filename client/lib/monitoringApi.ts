import apiClient from "./apiClient";
import { buildQuery, type SessionRow, type Snapshot, type Stats, type TimelineEvent } from "./monitoringLogic";

// Live Monitoring admin API (Business Admin > Live Monitoring). Every endpoint is enforced server-side; the UI never decides access.
const BASE = "/business-admin/monitoring";
const get = <T>(path: string, params: Record<string, string | number | boolean | null | undefined | string[]> = {}): Promise<T> =>
  apiClient.get(`${BASE}${path}${buildQuery(params)}`).then((r) => r.data.data as T);

export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number }

export const fetchStats = () => get<Stats>("/stats");

export interface SessionQuery { status?: string; kind?: string; search?: string; sort?: string; from?: string; to?: string; page?: number; pageSize?: number }
export const fetchSessions = (q: SessionQuery) => get<Paged<SessionRow> & { serverTime: string }>("/sessions", q as Record<string, string | number>);
export const terminateSession = (id: string) => apiClient.post(`${BASE}/sessions/${encodeURIComponent(id)}/terminate`).then((r) => r.data.data as { terminated: boolean });

export type PersonRow =
  | { id: string; kind: "guest"; label: string; visitorId: string; online: boolean; firstSeenAt: string; lastSeenAt: string; pageViews: number; device: { type: string | null; browser: string | null; os: string | null }; country: string | null; firstPath: string | null; referrer: string | null }
  | { id: string; kind: "registered"; userId: string; label: string; email: string; isActive: boolean; emailVerified: boolean; registeredAt: string; online: boolean; lastSeenAt: string | null; pageViews: number };
export interface PeopleQuery { kind?: "guest" | "registered"; search?: string; online?: boolean; sort?: string; page?: number; pageSize?: number }
export const fetchPeople = (q: PeopleQuery) => get<Paged<PersonRow>>("/people", { ...q, online: q.online ? "1" : undefined } as Record<string, string | number>);

export interface UserDetail {
  account: { id: string; name: string | null; email: string; phone: string | null; isActive: boolean; emailVerified: boolean; phoneVerified: boolean; provider: string; roles: string[]; location: string | null };
  registration: { registeredAt: string; provider: string; emailVerified: boolean };
  online: boolean; currentPath: string | null;
  sessions: SessionRow[];
  logins: Array<{ id: string; type: string; outcome: string | null; reason: string | null; at: string; device: { type: string | null; browser: string | null; os: string | null } }>;
  devices: Array<{ deviceType: string; browser: string; os: string; sessions: number; lastUsedAt: string }>;
  courses: Array<{ courseId: string; title: string; enrolledAt: string; progress: number; completed: boolean }>;
  payments: Array<{ id: string; status: string; amount: number; currency: string; product: string; at: string }>;
  eventCounts: Record<string, number>;
}
export interface VisitorDetail {
  visitor: { id: string; label: string; userId: string | null; firstSeenAt: string; lastSeenAt: string; pageViews: number; firstPath: string | null; referrer: string | null; country: string | null; device: { type: string | null; browser: string | null; os: string | null } };
  online: boolean; currentPath: string | null; sessions: SessionRow[];
}
export const fetchUserDetail = (id: string) => get<UserDetail>(`/users/${encodeURIComponent(id)}`);
export const fetchVisitorDetail = (id: string) => get<VisitorDetail>(`/visitors/${encodeURIComponent(id)}`);

export interface TimelineQuery { types?: string[]; category?: string; from?: string; to?: string; page?: number; pageSize?: number }
export const fetchUserTimeline = (id: string, q: TimelineQuery) => get<Paged<TimelineEvent>>(`/users/${encodeURIComponent(id)}/timeline`, q as Record<string, string | number | string[]>);
export const fetchVisitorTimeline = (id: string, q: TimelineQuery) => get<Paged<TimelineEvent>>(`/visitors/${encodeURIComponent(id)}/timeline`, q as Record<string, string | number | string[]>);

export interface SecurityRow {
  id: string; type: string; outcome: string | null; reason: string | null; at: string; userId: string | null; name: string | null; email: string | null;
  device: { type: string; browser: string; os: string }; ip: string | null; ipMasked: boolean;
  session: { id: string; status: "active" | "idle" | "ended"; lastActivityAt: string; endedAt: string | null; endReason: string | null; canTerminate: boolean } | null;
}
export interface SecurityQuery { status?: string; type?: string; search?: string; userId?: string; device?: string; from?: string; to?: string; page?: number; pageSize?: number }
export const fetchSecurity = (q: SecurityQuery) => get<Paged<SecurityRow>>("/security", q as Record<string, string | number>);

export interface AnalyticsData {
  range: { from: string; to: string };
  totals: { pageViews: number; sessions: number; registeredSessions: number; guestSessions: number; uniqueVisitors: number; avgSessionSeconds: number };
  eventsByType: Array<{ type: string; count: number }>; topPages: Array<{ path: string; views: number }>;
  devices: Array<{ label: string; count: number }>; browsers: Array<{ label: string; count: number }>;
  daily: Array<{ day: string; pageViews: number; logins: number; failedLogins: number; visitors: number }>;
}
export const fetchAnalytics = (q: { from?: string; to?: string }) => get<AnalyticsData>("/analytics", q);

export type { Snapshot };
