import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { revokeAuthSession } from "./session-revocation.js";
import {
  ACTIVITY_TYPES, AUTH_TYPES, CLIENT_REPORTABLE, classifyPath, cleanPath, cleanReferrer, clampInt, idleCutoff, isOnline, isUntrackedPath, isValidVisitorKey,
  istDayStart, maskIp, monitoringConfig, onlineCutoff, sanitizeMetadata, type ActivityType, type AuthType, type DeviceInfo, type MonitoringConfig,
} from "./monitoring.util.js";

/** Narrow on purpose: the real Prisma client is passed in production, a small in-memory fake in tests. */
export type MonitoringDb = any;

export interface Ctx { ip: string | null; device: DeviceInfo; country: string | null; visitorKey: string | null }
export interface EventInput {
  category: "ACTIVITY" | "AUTH";
  type: ActivityType | AuthType;
  userId?: string | null; visitorId?: string | null; sessionId?: string | null;
  path?: string | null; module?: string | null; device?: DeviceInfo | null; ip?: string | null;
  outcome?: "SUCCESS" | "FAILURE" | null; reason?: string | null; identifier?: string | null; metadata?: unknown;
}
export interface Page { page: number; pageSize: number }
export const paging = (q: { page?: unknown; pageSize?: unknown }): Page => ({ page: clampInt(q.page, 1, 1, 10_000), pageSize: clampInt(q.pageSize, 25, 1, 100) });
const skipTake = (p: Page) => ({ skip: (p.page - 1) * p.pageSize, take: p.pageSize });
const fullName = (u?: { firstName: string | null; lastName: string | null } | null) => [u?.firstName, u?.lastName].filter(Boolean).join(" ") || null;
/**
 * A sign-in can be terminated while it is open, or after it merely went IDLE (TIMEOUT: the refresh token is valid for 30 days even
 * though the browser stopped sending heartbeats). Logout, expiry and an earlier termination are final.
 */
const terminable = (s: { userId?: string | null; authSessionId?: string | null; endedAt?: Date | null; endReason?: string | null }) =>
  !!(s.userId && s.authSessionId && (!s.endedAt || s.endReason === "TIMEOUT"));
const isUnique = (e: unknown) => (e as { code?: string })?.code === "P2002" || /unique/i.test(String((e as Error)?.message));

export class MonitoringService {
  constructor(private readonly db: MonitoringDb, private readonly clock: () => Date = () => new Date(), private readonly config: () => MonitoringConfig = () => monitoringConfig()) {}
  get cfg() { return this.config(); }
  private now() { return this.clock(); }

  // ───────────────────────── collection ─────────────────────────

  private async ensureVisitor(key: string, ctx: { device: DeviceInfo; country: string | null }, first?: { path: string | null; referrer: string | null }) {
    const now = this.now();
    let v = await this.db.monitoringVisitor.findUnique({ where: { visitorKey: key } });
    if (!v) {
      try {
        v = await this.db.monitoringVisitor.create({
          data: { visitorKey: key, firstSeenAt: now, lastSeenAt: now, firstPath: first?.path ?? null, firstReferrer: first?.referrer ?? null, country: ctx.country, deviceType: ctx.device.deviceType, browser: ctx.device.browser, os: ctx.device.os },
        });
      } catch (e) {
        if (!isUnique(e)) throw e; // two tabs raced to create it: use the one that won
        v = await this.db.monitoringVisitor.findUnique({ where: { visitorKey: key } });
      }
    }
    return v;
  }

  /** Associates a browser's anonymous history with the account that signed in on it. A browser already linked to someone else is NOT re-linked (shared computers). */
  async linkVisitorToUser(visitor: { id: string; userId: string | null }, userId: string): Promise<boolean> {
    if (visitor.userId === userId) return true;
    if (visitor.userId) return false;
    await this.db.monitoringVisitor.update({ where: { id: visitor.id }, data: { userId } });
    await this.db.monitoringEvent.updateMany({ where: { visitorId: visitor.id, userId: null }, data: { userId } });
    await this.db.monitoringSession.updateMany({ where: { visitorId: visitor.id, userId: null }, data: { userId } });
    visitor.userId = userId;
    return true;
  }

  /** The visitor's open, recent session, or a new one. One open session per visitor; a different signed-in person on the same browser starts a new one. */
  private async openSession(visitor: { id: string }, userId: string | null, device: DeviceInfo, referrer: string | null) {
    const now = this.now();
    const cut = idleCutoff(now, this.cfg);
    let s = await this.db.monitoringSession.findFirst({ where: { visitorId: visitor.id, endedAt: null, lastActivityAt: { gt: cut } }, orderBy: { startedAt: "desc" } });
    if (s && userId && s.userId && s.userId !== userId) {
      await this.db.monitoringSession.update({ where: { id: s.id }, data: { endedAt: now, endReason: "LOGOUT" } });
      s = null;
    }
    if (!s) {
      s = await this.db.monitoringSession.create({ data: { visitorId: visitor.id, userId, startedAt: now, lastActivityAt: now, deviceType: device.deviceType, browser: device.browser, os: device.os, referrer } });
    } else if (userId && !s.userId) {
      await this.db.monitoringSession.update({ where: { id: s.id }, data: { userId } });
      s.userId = userId;
    }
    return s;
  }

  async insertEvent(e: EventInput) {
    const meta = sanitizeMetadata(e.metadata);
    await this.db.monitoringEvent.create({
      data: {
        category: e.category, type: e.type, userId: e.userId ?? null, visitorId: e.visitorId ?? null, sessionId: e.sessionId ?? null,
        path: e.path ?? null, module: e.module ?? null, deviceType: e.device?.deviceType ?? null, browser: e.device?.browser ?? null, os: e.device?.os ?? null,
        ip: e.category === "AUTH" ? e.ip ?? null : null, outcome: e.outcome ?? null, reason: e.reason ? String(e.reason).slice(0, 80) : null,
        identifier: e.identifier ? String(e.identifier).toLowerCase().slice(0, 254) : null, ...(meta !== undefined ? { metadata: meta } : {}), createdAt: this.now(),
      },
    });
  }

  /** A page view from the browser. Bots, admin screens and invalid input are ignored (reported as not tracked, never as an error). */
  async pageView(i: { visitorKey: unknown; path: unknown; referrer?: unknown; userId?: string | null; ctx: Pick<Ctx, "device" | "country"> }): Promise<{ tracked: boolean }> {
    if (!this.cfg.enabled || !isValidVisitorKey(i.visitorKey) || i.ctx.device.deviceType === "bot") return { tracked: false };
    const path = cleanPath(i.path);
    if (!path || isUntrackedPath(path)) return { tracked: false };
    const referrer = cleanReferrer(i.referrer);
    const now = this.now();
    const visitor = await this.ensureVisitor(i.visitorKey, i.ctx, { path, referrer });
    if (i.userId) await this.linkVisitorToUser(visitor, i.userId);
    const session = await this.openSession(visitor, i.userId ?? null, i.ctx.device, referrer);
    const cls = classifyPath(path);
    await this.db.monitoringSession.update({ where: { id: session.id }, data: { lastActivityAt: now, currentPath: path, pageViews: { increment: 1 } } });
    await this.db.monitoringVisitor.update({ where: { id: visitor.id }, data: { lastSeenAt: now, pageViews: { increment: 1 }, deviceType: i.ctx.device.deviceType, browser: i.ctx.device.browser, os: i.ctx.device.os } });
    await this.insertEvent({ category: "ACTIVITY", type: cls.type, userId: i.userId ?? visitor.userId ?? null, visitorId: visitor.id, sessionId: session.id, path, module: cls.module, device: i.ctx.device, ...(session.pageViews === 0 && referrer ? { metadata: { referrer } } : {}) });
    return { tracked: true };
  }

  /** Keeps the visitor online. `terminated` tells the browser that an admin ended its sign-in, so it can sign out locally. */
  async heartbeat(i: { visitorKey: unknown; path?: unknown; userId?: string | null; revoked?: boolean; ctx: Pick<Ctx, "device" | "country"> }): Promise<{ tracked: boolean; terminated?: boolean }> {
    if (i.revoked) return { tracked: false, terminated: true };
    if (!this.cfg.enabled || !isValidVisitorKey(i.visitorKey) || i.ctx.device.deviceType === "bot") return { tracked: false };
    const now = this.now();
    const visitor = await this.db.monitoringVisitor.findUnique({ where: { visitorKey: i.visitorKey } });
    if (!visitor) return { tracked: false }; // the first page view creates the visitor; a heartbeat alone never does
    if (i.userId) {
      // An open session (the person signed in again) always wins; only when none is open can the latest one say "terminated".
      const open = await this.db.monitoringSession.findFirst({ where: { visitorId: visitor.id, endedAt: null } });
      if (!open) {
        const last = await this.db.monitoringSession.findFirst({ where: { visitorId: visitor.id }, orderBy: { startedAt: "desc" } });
        if (last?.endReason === "TERMINATED" && last.userId === i.userId && last.endedAt && now.getTime() - last.endedAt.getTime() < 15 * 60_000) return { tracked: false, terminated: true };
      }
      await this.linkVisitorToUser(visitor, i.userId);
    }
    const session = await this.openSession(visitor, i.userId ?? null, i.ctx.device, null);
    const path = cleanPath(i.path);
    await this.db.monitoringSession.update({ where: { id: session.id }, data: { lastActivityAt: now, ...(path && !isUntrackedPath(path) ? { currentPath: path } : {}) } });
    await this.db.monitoringVisitor.update({ where: { id: visitor.id }, data: { lastSeenAt: now } });
    return { tracked: true };
  }

  /** A feature-use event reported by the browser. Only whitelisted types are accepted; metadata is redacted and capped. */
  async feature(i: { visitorKey: unknown; type: unknown; path?: unknown; metadata?: unknown; userId?: string | null; ctx: Pick<Ctx, "device" | "country"> }): Promise<{ tracked: boolean }> {
    if (!this.cfg.enabled || !isValidVisitorKey(i.visitorKey) || i.ctx.device.deviceType === "bot") return { tracked: false };
    if (!(CLIENT_REPORTABLE as readonly string[]).includes(String(i.type))) throw new ApiError("Unsupported event type.", STATUS_CODES.BAD_REQUEST);
    const path = cleanPath(i.path);
    if (isUntrackedPath(path)) return { tracked: false };
    const visitor = await this.ensureVisitor(i.visitorKey, i.ctx);
    if (i.userId) await this.linkVisitorToUser(visitor, i.userId);
    const session = await this.openSession(visitor, i.userId ?? null, i.ctx.device, null);
    await this.db.monitoringSession.update({ where: { id: session.id }, data: { lastActivityAt: this.now() } });
    await this.insertEvent({ category: "ACTIVITY", type: "FEATURE_USED", userId: i.userId ?? visitor.userId ?? null, visitorId: visitor.id, sessionId: session.id, path, device: i.ctx.device, metadata: i.metadata });
    return { tracked: true };
  }

  // ───────────────────────── server-side lifecycle (sign-in etc.) ─────────────────────────

  /** A successful sign-in: attaches the browser's visitor (and its guest history) to the account and records the session so it can be listed and terminated. */
  async onLogin(i: { userId: string; authSessionId: string; ctx: Ctx }) {
    const now = this.now();
    const key = i.ctx.visitorKey ?? `u_${i.userId}`; // a client without a visitor id still gets one session per account
    const visitor = await this.ensureVisitor(key, i.ctx);
    await this.linkVisitorToUser(visitor, i.userId);
    let session = await this.openSession(visitor, i.userId, i.ctx.device, null);
    if (session.authSessionId && session.authSessionId !== i.authSessionId) {
      // A SECOND sign-in on the same browser: it is its own session (its own refresh token), so each can be listed and terminated
      // separately. Reusing the row would forget the first refresh token and leave it alive behind a "terminated" session.
      session = await this.db.monitoringSession.create({ data: { visitorId: visitor.id, userId: i.userId, startedAt: now, lastActivityAt: now, deviceType: i.ctx.device.deviceType, browser: i.ctx.device.browser, os: i.ctx.device.os } });
    }
    await this.db.monitoringSession.update({ where: { id: session.id }, data: { authSessionId: i.authSessionId, userId: i.userId, lastActivityAt: now } });
    session = { ...session, authSessionId: i.authSessionId };
    await this.db.monitoringVisitor.update({ where: { id: visitor.id }, data: { lastSeenAt: now } });
    await this.insertEvent({ category: "AUTH", type: "LOGIN_SUCCESS", outcome: "SUCCESS", userId: i.userId, visitorId: visitor.id, sessionId: session.id, device: i.ctx.device, ip: i.ctx.ip });
  }

  async onLoginFailed(i: { identifier: string; userId?: string | null; reason: string; ctx: Ctx }) {
    const visitor = i.ctx.visitorKey ? await this.db.monitoringVisitor.findUnique({ where: { visitorKey: i.ctx.visitorKey } }) : null;
    await this.insertEvent({ category: "AUTH", type: "LOGIN_FAILED", outcome: "FAILURE", reason: i.reason, identifier: i.identifier, userId: i.userId ?? null, visitorId: visitor?.id ?? null, device: i.ctx.device, ip: i.ctx.ip });
  }

  /** The refresh-token row was replaced: keep the monitoring session pointing at the live one. */
  async onSessionRotated(oldId: string, newId: string) {
    await this.db.monitoringSession.updateMany({ where: { authSessionId: oldId, endedAt: null }, data: { authSessionId: newId } });
  }

  async onLogout(i: { authSessionId: string; userId: string | null; ctx: Ctx }) {
    const now = this.now();
    const s = await this.db.monitoringSession.findFirst({ where: { authSessionId: i.authSessionId, endedAt: null } });
    if (s) await this.db.monitoringSession.update({ where: { id: s.id }, data: { endedAt: now, endReason: "LOGOUT" } });
    await this.insertEvent({ category: "AUTH", type: "LOGOUT", outcome: "SUCCESS", userId: i.userId ?? s?.userId ?? null, visitorId: s?.visitorId ?? null, sessionId: s?.id ?? null, device: i.ctx.device, ip: i.ctx.ip });
  }

  /** Account-level events (registered, verified, password, activation, business events). */
  async onAccountEvent(type: ActivityType | AuthType, i: { userId: string; ctx?: Ctx; metadata?: unknown; module?: string; reason?: string }) {
    const isAuth = (AUTH_TYPES as readonly string[]).includes(type);
    if (!isAuth && !(ACTIVITY_TYPES as readonly string[]).includes(type)) return;
    const visitor = i.ctx?.visitorKey ? await this.db.monitoringVisitor.findUnique({ where: { visitorKey: i.ctx.visitorKey } }) : null;
    await this.insertEvent({ category: isAuth ? "AUTH" : "ACTIVITY", type, userId: i.userId, visitorId: visitor?.id ?? null, module: i.module ?? null, device: i.ctx?.device ?? null, ip: i.ctx?.ip ?? null, metadata: i.metadata, reason: i.reason, outcome: isAuth ? "SUCCESS" : null });
  }

  // ───────────────────────── admin: sessions & termination ─────────────────────────

  private async usersById(ids: string[]) {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) return new Map<string, any>();
    const rows = await this.db.user.findMany({ where: { id: { in: unique } }, select: { id: true, firstName: true, lastName: true, email: true, isActive: true, isDeleted: true } });
    return new Map<string, any>(rows.map((u: any) => [u.id, u]));
  }

  private async userIdsMatching(search: string): Promise<string[]> {
    const q = search.trim();
    if (!q) return [];
    const rows = await this.db.user.findMany({ where: { isDeleted: false, OR: [{ email: { contains: q, mode: "insensitive" } }, { firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] }, select: { id: true }, take: 50 });
    return rows.map((r: any) => r.id);
  }

  private sessionDto(s: any, users: Map<string, any>) {
    const now = this.now();
    const u = s.userId ? users.get(s.userId) : null;
    const online = isOnline(s, now, this.cfg);
    return {
      id: s.id, visitorId: s.visitorId, kind: s.userId ? "registered" : "guest", userId: s.userId ?? null,
      name: s.userId ? fullName(u) ?? u?.email ?? "Registered user" : null, email: u?.email ?? null,
      online, status: online ? "online" : "offline",
      loginStatus: !s.userId ? "guest" : s.endedAt ? "signed_out" : "signed_in",
      currentPath: s.currentPath ?? null, device: { type: s.deviceType ?? "unknown", browser: s.browser ?? "Unknown", os: s.os ?? "Unknown" },
      startedAt: s.startedAt, lastActivityAt: s.lastActivityAt, endedAt: s.endedAt ?? null, endReason: s.endReason ?? null, pageViews: s.pageViews ?? 0, referrer: s.referrer ?? null,
      canTerminate: terminable(s),
    };
  }

  async listSessions(q: { status?: string; kind?: string; search?: string; sort?: string; from?: Date; to?: Date } & { page?: unknown; pageSize?: unknown }) {
    const now = this.now();
    const cut = onlineCutoff(now, this.cfg);
    const p = paging(q);
    const and: any[] = [];
    if (q.status === "online") and.push({ endedAt: null, lastActivityAt: { gt: cut } });
    else if (q.status === "offline") and.push({ OR: [{ endedAt: { not: null } }, { lastActivityAt: { lte: cut } }] });
    else if (q.status === "active") and.push({ endedAt: null });
    if (q.kind === "guest") and.push({ userId: null });
    if (q.kind === "registered") and.push({ userId: { not: null } });
    if (q.from) and.push({ lastActivityAt: { gte: q.from } });
    if (q.to) and.push({ lastActivityAt: { lte: q.to } });
    if (q.status !== "online" && q.status !== "active" && !q.from) and.push({ lastActivityAt: { gte: new Date(now.getTime() - 24 * 3600_000) } }); // offline/all default to the last 24h
    if (q.search?.trim()) {
      const ids = await this.userIdsMatching(q.search);
      and.push({ OR: [...(ids.length ? [{ userId: { in: ids } }] : []), { visitor: { visitorKey: { startsWith: q.search.trim() } } }, { currentPath: { contains: q.search.trim(), mode: "insensitive" } }] });
    }
    const where = and.length ? { AND: and } : {};
    const orderBy = q.sort === "started" ? { startedAt: "desc" } : q.sort === "pages" ? { pageViews: "desc" } : { lastActivityAt: "desc" };
    const [rows, total] = await Promise.all([this.db.monitoringSession.findMany({ where, orderBy, ...skipTake(p) }), this.db.monitoringSession.count({ where })]);
    const users = await this.usersById(rows.map((r: any) => r.userId));
    return { items: rows.map((r: any) => this.sessionDto(r, users)), total, ...p, serverTime: now.toISOString() };
  }

  /** Ends one signed-in session: the refresh token is deleted (no new access tokens), the current access token is blocked, the browser is told on its next heartbeat. */
  async terminateSession(sessionId: string, actor: { id: string; email?: string | null; isSuperAdmin: boolean }) {
    const s = await this.db.monitoringSession.findUnique({ where: { id: sessionId } });
    if (!s) throw new ApiError("Session not found.", STATUS_CODES.NOT_FOUND);
    if (!s.userId || !s.authSessionId) throw new ApiError("Guest visitors have no sign-in to terminate.", STATUS_CODES.BAD_REQUEST);
    if (!terminable(s)) throw new ApiError("This session has already ended.", STATUS_CODES.CONFLICT);
    if (s.userId === actor.id) throw new ApiError("You cannot terminate your own session here. Use Logout.", STATUS_CODES.FORBIDDEN);
    if (!actor.isSuperAdmin) {
      const targetRoles = (await this.db.userRoleMapping.findMany({ where: { userId: s.userId }, include: { role: true } })).map((m: any) => m.role.name);
      if (targetRoles.includes("SUPERADMIN") || targetRoles.includes("SUPER_ADMIN")) throw new ApiError("Only a Super Admin can terminate a Super Admin's session.", STATUS_CODES.FORBIDDEN);
    }
    // ONE transaction: mark the session terminated (what every instance and every restart reads) AND delete its refresh token.
    // Both happen or neither does, so a half-done termination can never leave a usable refresh token behind a "terminated" session,
    // or a deleted refresh token with no record of why. The conditional update also makes two admins terminating at once safe.
    const authSessionId: string = s.authSessionId;
    try {
      const ended = await this.db.$transaction(async (tx: MonitoringDb) => {
        const r = await tx.monitoringSession.updateMany({ where: { id: s.id, OR: [{ endedAt: null }, { endReason: "TIMEOUT" }] }, data: { endedAt: s.endedAt ?? this.now(), endReason: "TERMINATED" } });
        if (r.count !== 1) return false;
        await tx.session.deleteMany({ where: { id: authSessionId } });
        return true;
      });
      if (!ended) throw new ApiError("This session has already ended.", STATUS_CODES.CONFLICT);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError("The session could not be terminated right now and nothing was changed. Please try again.", STATUS_CODES.SERVICE_UNAVAILABLE);
    }
    revokeAuthSession(authSessionId); // enforced on this instance at once (other instances read the database)
    await this.insertEvent({ category: "AUTH", type: "SESSION_TERMINATED", outcome: "SUCCESS", userId: s.userId, visitorId: s.visitorId, sessionId: s.id, metadata: { byAdminId: actor.id } });
    try {
      const target = await this.db.user.findUnique({ where: { id: s.userId }, select: { email: true } });
      await this.db.businessAdminAuditLog.create({ data: { actorUserId: actor.id, actorEmail: actor.email ?? null, action: "SESSION_TERMINATED", targetUserId: s.userId, targetEmail: target?.email ?? null, details: { sessionId: s.id } } });
    } catch {
      /* the audit table may not exist on an older database; the monitoring event above is the record */
    }
    return { terminated: true, sessionId: s.id };
  }

  // ───────────────────────── admin: stats, people, details ─────────────────────────

  /** The all-time user count changes slowly and the dashboard asks every few seconds: cache it for a minute. */
  private totalCache: { at: number; n: number } | null = null;
  private async registeredTotal(now: Date): Promise<number> {
    if (this.totalCache && now.getTime() - this.totalCache.at < 60_000) return this.totalCache.n;
    const n = await this.db.user.count({ where: { isDeleted: false } });
    this.totalCache = { at: now.getTime(), n };
    return n;
  }

  async stats() {
    const now = this.now();
    const cut = onlineCutoff(now, this.cfg);
    const today = istDayStart(now);
    const open = { endedAt: null, lastActivityAt: { gt: cut } };
    const [active, activeRegistered, registeredTotal, loginsToday, newToday, failedToday, sessionsToday] = await Promise.all([
      this.db.monitoringSession.count({ where: open }),
      this.db.monitoringSession.count({ where: { ...open, userId: { not: null } } }),
      this.registeredTotal(now),
      this.db.monitoringEvent.count({ where: { category: "AUTH", type: "LOGIN_SUCCESS", createdAt: { gte: today } } }),
      this.db.user.count({ where: { isDeleted: false, createdAt: { gte: today } } }),
      this.db.monitoringEvent.count({ where: { category: "AUTH", type: "LOGIN_FAILED", createdAt: { gte: today } } }),
      this.db.monitoringSession.count({ where: { startedAt: { gte: today } } }),
    ]);
    return { activeNow: active, activeRegistered, activeGuests: active - activeRegistered, totalRegisteredUsers: registeredTotal, loginsToday, newRegistrationsToday: newToday, failedLoginsToday: failedToday, sessionsToday, onlineTimeoutSeconds: this.cfg.onlineTimeoutSeconds, serverTime: now.toISOString() };
  }

  async people(q: { kind?: string; search?: string; online?: string; sort?: string } & { page?: unknown; pageSize?: unknown }) {
    const now = this.now();
    const cut = onlineCutoff(now, this.cfg);
    const p = paging(q);
    if (q.kind === "guest") {
      const and: any[] = [{ userId: null }];
      if (q.search?.trim()) and.push({ OR: [{ visitorKey: { startsWith: q.search.trim() } }, { firstPath: { contains: q.search.trim(), mode: "insensitive" } }] });
      const where = { AND: and };
      const orderBy = q.sort === "first" ? { firstSeenAt: "desc" } : q.sort === "pages" ? { pageViews: "desc" } : { lastSeenAt: "desc" };
      const [rows, total] = await Promise.all([this.db.monitoringVisitor.findMany({ where, orderBy, ...skipTake(p) }), this.db.monitoringVisitor.count({ where })]);
      const onlineRows = await this.db.monitoringSession.findMany({ where: { visitorId: { in: rows.map((r: any) => r.id) }, endedAt: null, lastActivityAt: { gt: cut } }, select: { visitorId: true } });
      const on = new Set(onlineRows.map((r: any) => r.visitorId));
      return { items: rows.map((v: any) => ({ id: v.id, kind: "guest", label: `Guest ${v.visitorKey.slice(0, 8)}`, visitorId: v.id, online: on.has(v.id), firstSeenAt: v.firstSeenAt, lastSeenAt: v.lastSeenAt, pageViews: v.pageViews, device: { type: v.deviceType, browser: v.browser, os: v.os }, country: v.country, firstPath: v.firstPath, referrer: v.firstReferrer })), total, ...p };
    }
    const and: any[] = [{ isDeleted: false }];
    if (q.search?.trim()) and.push({ OR: [{ email: { contains: q.search.trim(), mode: "insensitive" } }, { firstName: { contains: q.search.trim(), mode: "insensitive" } }, { lastName: { contains: q.search.trim(), mode: "insensitive" } }] });
    if (q.online === "1") {
      const onlineUsers = await this.db.monitoringSession.findMany({ where: { endedAt: null, lastActivityAt: { gt: cut }, userId: { not: null } }, select: { userId: true }, take: 1000 });
      and.push({ id: { in: [...new Set(onlineUsers.map((r: any) => r.userId))] } });
    }
    const where = { AND: and };
    const orderBy = q.sort === "name" ? { firstName: "asc" } : { createdAt: "desc" };
    const [rows, total] = await Promise.all([
      this.db.user.findMany({ where, orderBy, ...skipTake(p), select: { id: true, firstName: true, lastName: true, email: true, isActive: true, isEmailVerified: true, createdAt: true } }),
      this.db.user.count({ where }),
    ]);
    const ids = rows.map((r: any) => r.id);
    const [vis, onlineRows] = await Promise.all([
      ids.length ? this.db.monitoringVisitor.findMany({ where: { userId: { in: ids } }, select: { userId: true, lastSeenAt: true, pageViews: true } }) : [],
      ids.length ? this.db.monitoringSession.findMany({ where: { userId: { in: ids }, endedAt: null, lastActivityAt: { gt: cut } }, select: { userId: true } }) : [],
    ]);
    const agg = new Map<string, { last: Date | null; pages: number }>();
    for (const v of vis) { const a = agg.get(v.userId) ?? { last: null, pages: 0 }; a.pages += v.pageViews ?? 0; if (!a.last || v.lastSeenAt > a.last) a.last = v.lastSeenAt; agg.set(v.userId, a); }
    const on = new Set(onlineRows.map((r: any) => r.userId));
    return { items: rows.map((u: any) => ({ id: u.id, kind: "registered", userId: u.id, label: fullName(u) ?? u.email, email: u.email, isActive: u.isActive, emailVerified: u.isEmailVerified, registeredAt: u.createdAt, online: on.has(u.id), lastSeenAt: agg.get(u.id)?.last ?? null, pageViews: agg.get(u.id)?.pages ?? 0 })), total, ...p };
  }

  async userDetail(userId: string) {
    const u = await this.db.user.findFirst({ where: { id: userId, isDeleted: false }, select: { id: true, firstName: true, lastName: true, email: true, phoneNo: true, isActive: true, isEmailVerified: true, isPhoneVerified: true, authProvider: true, createdAt: true, state: true, city: true, country: true } });
    if (!u) throw new ApiError("User not found.", STATUS_CODES.NOT_FOUND);
    const now = this.now();
    const [roles, sessions, logins, openSession, enrollments, payments, typeCounts] = await Promise.all([
      this.db.userRoleMapping.findMany({ where: { userId }, include: { role: true } }),
      this.db.monitoringSession.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, take: 30 }),
      this.db.monitoringEvent.findMany({ where: { userId, category: "AUTH", type: { in: ["LOGIN_SUCCESS", "LOGIN_FAILED"] } }, orderBy: { createdAt: "desc" }, take: 20 }),
      this.db.monitoringSession.findFirst({ where: { userId, endedAt: null, lastActivityAt: { gt: onlineCutoff(now, this.cfg) } }, orderBy: { lastActivityAt: "desc" } }),
      this.db.courseUserMapper.findMany({ where: { userId }, orderBy: { enrolledAt: "desc" }, take: 10, select: { courseId: true, enrolledAt: true, progress: true, isCompleted: true } }),
      this.db.paymentOrder.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, status: true, amount: true, currency: true, productType: true, createdAt: true } }),
      this.db.monitoringEvent.groupBy({ by: ["type"], where: { userId }, _count: { _all: true } }),
    ]);
    const courses = enrollments.length ? await this.db.courses.findMany({ where: { id: { in: enrollments.map((e: any) => e.courseId) } }, select: { id: true, title: true } }) : [];
    const title = new Map<string, string>(courses.map((c: any) => [c.id, c.title]));
    const devices = new Map<string, { deviceType: string; browser: string; os: string; sessions: number; lastUsedAt: Date }>();
    for (const s of sessions) {
      const k = `${s.deviceType}|${s.browser}|${s.os}`;
      const d = devices.get(k) ?? { deviceType: s.deviceType ?? "unknown", browser: s.browser ?? "Unknown", os: s.os ?? "Unknown", sessions: 0, lastUsedAt: s.lastActivityAt };
      d.sessions++; if (s.lastActivityAt > d.lastUsedAt) d.lastUsedAt = s.lastActivityAt; devices.set(k, d);
    }
    const counts: Record<string, number> = {};
    for (const e of typeCounts) counts[e.type] = e._count._all;
    return {
      account: { id: u.id, name: fullName(u), email: u.email, phone: u.phoneNo, isActive: u.isActive, emailVerified: u.isEmailVerified, phoneVerified: u.isPhoneVerified, provider: u.authProvider, roles: roles.map((r: any) => r.role.name), location: [u.city, u.state, u.country].filter(Boolean).join(", ") || null },
      registration: { registeredAt: u.createdAt, provider: u.authProvider, emailVerified: u.isEmailVerified },
      online: !!openSession, currentPath: openSession?.currentPath ?? null,
      sessions: sessions.map((s: any) => this.sessionDto(s, new Map([[u.id, u]]))),
      logins: logins.map((e: any) => ({ id: e.id, type: e.type, outcome: e.outcome, reason: e.reason, at: e.createdAt, device: { type: e.deviceType, browser: e.browser, os: e.os } })),
      devices: [...devices.values()].sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime()),
      courses: enrollments.map((e: any) => ({ courseId: e.courseId, title: title.get(e.courseId) ?? "Course", enrolledAt: e.enrolledAt, progress: e.progress, completed: e.isCompleted })),
      payments: payments.map((p: any) => ({ id: p.id, status: p.status, amount: p.amount / 100, currency: p.currency, product: p.productType, at: p.createdAt })),
      eventCounts: counts,
    };
  }

  async visitorDetail(visitorId: string) {
    const v = await this.db.monitoringVisitor.findUnique({ where: { id: visitorId } });
    if (!v) throw new ApiError("Visitor not found.", STATUS_CODES.NOT_FOUND);
    const now = this.now();
    const sessions = await this.db.monitoringSession.findMany({ where: { visitorId }, orderBy: { startedAt: "desc" }, take: 30 });
    const open = sessions.find((s: any) => isOnline(s, now, this.cfg));
    return {
      visitor: { id: v.id, label: `Guest ${v.visitorKey.slice(0, 8)}`, userId: v.userId, firstSeenAt: v.firstSeenAt, lastSeenAt: v.lastSeenAt, pageViews: v.pageViews, firstPath: v.firstPath, referrer: v.firstReferrer, country: v.country, device: { type: v.deviceType, browser: v.browser, os: v.os } },
      online: !!open, currentPath: open?.currentPath ?? null, sessions: sessions.map((s: any) => this.sessionDto(s, new Map())),
    };
  }

  async timeline(q: { userId?: string; visitorId?: string; from?: Date; to?: Date; types?: string; category?: string } & { page?: unknown; pageSize?: unknown }) {
    const p = paging({ page: q.page, pageSize: q.pageSize ?? 50 });
    const where: any = {};
    if (q.userId) where.userId = q.userId;
    if (q.visitorId) where.visitorId = q.visitorId;
    if (q.category === "ACTIVITY" || q.category === "AUTH") where.category = q.category;
    const types = (q.types ?? "").split(",").map((t) => t.trim()).filter((t) => (ACTIVITY_TYPES as readonly string[]).includes(t) || (AUTH_TYPES as readonly string[]).includes(t));
    if (types.length) where.type = { in: types };
    if (q.from || q.to) where.createdAt = { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) };
    const [rows, total] = await Promise.all([this.db.monitoringEvent.findMany({ where, orderBy: { createdAt: "desc" }, ...skipTake(p) }), this.db.monitoringEvent.count({ where })]);
    return { items: rows.map((e: any) => ({ id: e.id, category: e.category, type: e.type, at: e.createdAt, path: e.path, module: e.module, outcome: e.outcome, reason: e.reason, metadata: e.metadata ?? null, device: { type: e.deviceType, browser: e.browser, os: e.os } })), total, ...p };
  }

  async security(q: { from?: Date; to?: Date; status?: string; type?: string; search?: string; userId?: string; device?: string } & { page?: unknown; pageSize?: unknown }, canSeeIp: boolean) {
    const p = paging(q);
    const and: any[] = [{ category: "AUTH" }];
    if (q.status === "success") and.push({ outcome: "SUCCESS", type: "LOGIN_SUCCESS" });
    else if (q.status === "failed") and.push({ type: "LOGIN_FAILED" });
    if (q.type && (AUTH_TYPES as readonly string[]).includes(q.type)) and.push({ type: q.type });
    if (q.userId) and.push({ userId: q.userId });
    if (q.device && ["desktop", "mobile", "tablet", "unknown"].includes(q.device)) and.push({ deviceType: q.device });
    if (q.from) and.push({ createdAt: { gte: q.from } });
    if (q.to) and.push({ createdAt: { lte: q.to } });
    if (q.search?.trim()) {
      const ids = await this.userIdsMatching(q.search);
      and.push({ OR: [{ identifier: { contains: q.search.trim().toLowerCase() } }, ...(ids.length ? [{ userId: { in: ids } }] : [])] });
    }
    const where = { AND: and };
    const [rows, total] = await Promise.all([this.db.monitoringEvent.findMany({ where, orderBy: { createdAt: "desc" }, ...skipTake(p) }), this.db.monitoringEvent.count({ where })]);
    const users = await this.usersById(rows.map((r: any) => r.userId));
    const sids = [...new Set(rows.map((r: any) => r.sessionId).filter(Boolean))] as string[];
    const sess = sids.length ? await this.db.monitoringSession.findMany({ where: { id: { in: sids } } }) : [];
    const sm = new Map<string, any>(sess.map((s: any) => [s.id, s]));
    const now = this.now();
    return {
      items: rows.map((e: any) => {
        const s = e.sessionId ? sm.get(e.sessionId) : null;
        const u = e.userId ? users.get(e.userId) : null;
        return {
          id: e.id, type: e.type, outcome: e.outcome, reason: e.reason, at: e.createdAt, userId: e.userId, name: fullName(u), email: u?.email ?? e.identifier ?? null,
          device: { type: e.deviceType ?? "unknown", browser: e.browser ?? "Unknown", os: e.os ?? "Unknown" }, ip: canSeeIp ? e.ip : maskIp(e.ip), ipMasked: !canSeeIp,
          session: s ? { id: s.id, status: s.endedAt ? "ended" : isOnline(s, now, this.cfg) ? "active" : "idle", lastActivityAt: s.lastActivityAt, endedAt: s.endedAt ?? null, endReason: s.endReason ?? null, canTerminate: terminable(s) } : null,
        };
      }),
      total, ...p,
    };
  }

  async analytics(q: { from?: Date; to?: Date }) {
    const now = this.now();
    const to = q.to ?? now;
    const from = q.from ?? new Date(to.getTime() - 7 * 86_400_000);
    const maxMs = 90 * 86_400_000;
    const start = to.getTime() - from.getTime() > maxMs ? new Date(to.getTime() - maxMs) : from;
    const evWhere = { createdAt: { gte: start, lte: to } };
    const pv = { ...evWhere, category: "ACTIVITY", type: { in: ["PAGE_VIEW", "COURSE_VIEW", "LESSON_VIEW"] } };
    const [byType, topPages, byDevice, byBrowser, perDay, dur, totals] = await Promise.all([
      this.db.monitoringEvent.groupBy({ by: ["type"], where: evWhere, _count: { _all: true }, orderBy: { _count: { type: "desc" } } }),
      this.db.monitoringEvent.groupBy({ by: ["path"], where: { ...pv, path: { not: null } }, _count: { _all: true }, orderBy: { _count: { path: "desc" } }, take: 10 }),
      this.db.monitoringSession.groupBy({ by: ["deviceType"], where: { startedAt: { gte: start, lte: to } }, _count: { _all: true } }),
      this.db.monitoringSession.groupBy({ by: ["browser"], where: { startedAt: { gte: start, lte: to } }, _count: { _all: true } }),
      this.db.$queryRaw`SELECT to_char((created_at AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD') AS day,
          count(*) FILTER (WHERE type IN ('PAGE_VIEW','COURSE_VIEW','LESSON_VIEW'))::int AS page_views,
          count(*) FILTER (WHERE type = 'LOGIN_SUCCESS')::int AS logins,
          count(*) FILTER (WHERE type = 'LOGIN_FAILED')::int AS failed_logins,
          count(DISTINCT visitor_id)::int AS visitors
        FROM monitoring_events WHERE created_at >= ${start} AND created_at <= ${to} GROUP BY 1 ORDER BY 1`,
      this.db.$queryRaw`SELECT COALESCE(avg(EXTRACT(EPOCH FROM (last_activity_at - started_at))), 0)::float AS avg_seconds, count(*)::int AS sessions,
          count(*) FILTER (WHERE user_id IS NOT NULL)::int AS registered_sessions, count(DISTINCT visitor_id)::int AS visitors
        FROM monitoring_sessions WHERE started_at >= ${start} AND started_at <= ${to}`,
      this.db.monitoringEvent.count({ where: pv }),
    ]);
    const d = (dur as any[])[0] ?? {};
    return {
      range: { from: start.toISOString(), to: to.toISOString() },
      totals: { pageViews: totals, sessions: d.sessions ?? 0, registeredSessions: d.registered_sessions ?? 0, guestSessions: (d.sessions ?? 0) - (d.registered_sessions ?? 0), uniqueVisitors: d.visitors ?? 0, avgSessionSeconds: Math.round(d.avg_seconds ?? 0) },
      eventsByType: byType.map((r: any) => ({ type: r.type, count: r._count._all })),
      topPages: topPages.map((r: any) => ({ path: r.path, views: r._count._all })),
      devices: byDevice.map((r: any) => ({ label: r.deviceType ?? "unknown", count: r._count._all })),
      browsers: byBrowser.map((r: any) => ({ label: r.browser ?? "Unknown", count: r._count._all })),
      daily: (perDay as any[]).map((r) => ({ day: r.day, pageViews: r.page_views, logins: r.logins, failedLogins: r.failed_logins, visitors: r.visitors })),
    };
  }

  // ───────────────────────── maintenance ─────────────────────────

  /** Closes idle sessions (TIMEOUT, or EXPIRED when their sign-in is gone). Safe to run often. */
  async closeIdleSessions(limit = 500): Promise<number> {
    const now = this.now();
    const stale = await this.db.monitoringSession.findMany({ where: { endedAt: null, lastActivityAt: { lt: idleCutoff(now, this.cfg) } }, take: limit });
    if (!stale.length) return 0;
    const authIds = stale.map((s: any) => s.authSessionId).filter(Boolean);
    const alive = new Set((authIds.length ? await this.db.session.findMany({ where: { id: { in: authIds } }, select: { id: true } }) : []).map((r: any) => r.id));
    for (const s of stale) {
      const expired = !!s.authSessionId && !alive.has(s.authSessionId);
      await this.db.monitoringSession.update({ where: { id: s.id }, data: { endedAt: s.lastActivityAt, endReason: expired ? "EXPIRED" : "TIMEOUT" } });
      if (expired && s.userId) await this.insertEvent({ category: "AUTH", type: "SESSION_EXPIRED", outcome: "SUCCESS", userId: s.userId, visitorId: s.visitorId, sessionId: s.id });
    }
    return stale.length;
  }

  /** Deletes data past its retention (activity and security are separate periods). Bounded batches. */
  async purge(batch = 1000): Promise<{ events: number; sessions: number; visitors: number }> {
    const now = this.now();
    const day = 86_400_000;
    const out = { events: 0, sessions: 0, visitors: 0 };
    const del = async (model: string, where: any) => {
      const ids = (await this.db[model].findMany({ where, select: { id: true }, take: batch })).map((r: any) => r.id);
      if (ids.length) await this.db[model].deleteMany({ where: { id: { in: ids } } });
      return ids.length;
    };
    out.events += await del("monitoringEvent", { category: "ACTIVITY", createdAt: { lt: new Date(now.getTime() - this.cfg.retentionDays * day) } });
    out.events += await del("monitoringEvent", { category: "AUTH", createdAt: { lt: new Date(now.getTime() - this.cfg.securityRetentionDays * day) } });
    out.sessions += await del("monitoringSession", { endedAt: { not: null }, startedAt: { lt: new Date(now.getTime() - this.cfg.retentionDays * day) } });
    out.visitors += await del("monitoringVisitor", { userId: null, lastSeenAt: { lt: new Date(now.getTime() - this.cfg.retentionDays * day) } });
    return out;
  }
}
