// A small in-memory database for the Live Monitoring service: just enough of the Prisma query language (equality, null, not, in,
// gt/gte/lt/lte, contains, startsWith, AND/OR/NOT, one relation) to run the REAL service code. No network, no real database.
type Row = Record<string, any>;
let seq = 0;
export const nid = (p: string) => `${p}_${++seq}`;

const cmp = (v: any, c: any): boolean => {
  if (c === null) return v === null || v === undefined;
  if (c instanceof Date) return v instanceof Date && v.getTime() === c.getTime();
  if (c && typeof c === "object" && !Array.isArray(c)) {
    const insens = c.mode === "insensitive";
    const norm = (x: any) => (insens && typeof x === "string" ? x.toLowerCase() : x);
    return Object.entries(c).every(([op, arg]) => {
      if (op === "mode") return true;
      if (op === "equals") return norm(v) === norm(arg);
      if (op === "not") return arg === null ? v !== null && v !== undefined : v !== arg;
      if (op === "in") return (arg as any[]).includes(v);
      if (op === "gt") return v != null && v > (arg as any);
      if (op === "gte") return v != null && v >= (arg as any);
      if (op === "lt") return v != null && v < (arg as any);
      if (op === "lte") return v != null && v <= (arg as any);
      if (op === "contains") return typeof v === "string" && norm(v).includes(norm(arg as string));
      if (op === "startsWith") return typeof v === "string" && norm(v).startsWith(norm(arg as string));
      throw new Error(`fake db: unsupported operator ${op}`);
    });
  }
  return v === c;
};

export class FakeMonitoringDb {
  visitors: Row[] = [];
  sessions: Row[] = [];
  events: Row[] = [];
  users: Row[] = [];
  roleMappings: Array<{ userId: string; role: { name: string } }> = [];
  authSessions: Row[] = [];
  audit: Row[] = [];
  enrollments: Row[] = [];
  payments: Row[] = [];
  courseRows: Row[] = [];
  now = new Date("2026-11-24T10:00:00Z");

  private match = (table: string, row: Row, where: Row = {}): boolean =>
    Object.entries(where).every(([k, c]) => {
      if (k === "AND") return (c as Row[]).every((w) => this.match(table, row, w));
      if (k === "OR") return (c as Row[]).some((w) => this.match(table, row, w));
      if (k === "NOT") return !this.match(table, row, c as Row);
      if (k === "visitor" && table === "sessions") return this.match("visitors", this.visitors.find((v) => v.id === row.visitorId) ?? {}, c as Row);
      return cmp(row[k], c);
    });

  private order(rows: Row[], orderBy?: Row) {
    if (!orderBy) return rows;
    const [[k, dir]] = Object.entries(orderBy);
    return [...rows].sort((a, b) => ((a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * (dir === "desc" ? -1 : 1)));
  }

  private model(name: string, rows: () => Row[], opts: { defaults?: () => Row; remove?: (ids: Set<string>) => void } = {}) {
    const find = (args: Row = {}) => this.order(rows().filter((r) => this.match(name, r, args.where)), args.orderBy);
    const apply = (row: Row, data: Row) => {
      for (const [k, v] of Object.entries(data)) row[k] = v && typeof v === "object" && !(v instanceof Date) && "increment" in v ? (row[k] ?? 0) + v.increment : v;
    };
    return {
      findUnique: async ({ where }: Row) => rows().find((r) => Object.entries(where).every(([k, v]) => r[k] === v)) ?? null,
      findFirst: async (args: Row) => find(args)[0] ?? null,
      findMany: async (args: Row = {}) => {
        const all = find(args);
        const s = args.skip ?? 0;
        return (args.take !== undefined ? all.slice(s, s + args.take) : all.slice(s)).map((r) => ({ ...r }));
      },
      count: async (args: Row = {}) => find(args).length,
      create: async ({ data }: Row) => {
        const row = { id: nid(name), ...(opts.defaults?.() ?? {}), ...data };
        if (name === "visitors" && rows().some((r) => r.visitorKey === row.visitorKey)) throw Object.assign(new Error("Unique constraint"), { code: "P2002" });
        rows().push(row);
        return { ...row };
      },
      update: async ({ where, data }: Row) => {
        const row = rows().find((r) => r.id === where.id);
        if (!row) throw new Error("fake db: record not found");
        apply(row, data);
        return { ...row };
      },
      updateMany: async ({ where, data }: Row) => {
        const hit = find({ where });
        hit.forEach((r) => apply(r, data));
        return { count: hit.length };
      },
      deleteMany: async ({ where }: Row) => {
        const ids = new Set(find({ where }).map((r) => r.id as string));
        opts.remove?.(ids);
        return { count: ids.size };
      },
    };
  }

  monitoringVisitor = this.model("visitors", () => this.visitors, { defaults: () => ({ userId: null, pageViews: 0, firstPath: null, firstReferrer: null, country: null }), remove: (ids) => (this.visitors = this.visitors.filter((r) => !ids.has(r.id))) });
  monitoringSession: any = this.model("sessions", () => this.sessions, { defaults: () => ({ userId: null, endedAt: null, endReason: null, pageViews: 0, currentPath: null, authSessionId: null, referrer: null }), remove: (ids) => (this.sessions = this.sessions.filter((r) => !ids.has(r.id))) });
  monitoringEvent: any = this.model("events", () => this.events, { defaults: () => ({ userId: null, visitorId: null, sessionId: null, path: null, ip: null, outcome: null, reason: null, identifier: null, metadata: null }), remove: (ids) => (this.events = this.events.filter((r) => !ids.has(r.id))) });
  user = { ...this.model("users", () => this.users), findFirst: async ({ where }: Row) => this.users.find((u) => this.match("users", u, where)) ?? null };
  userRoleMapping = { findMany: async ({ where }: Row) => this.roleMappings.filter((m) => m.userId === where.userId) };
  session = {
    deleteMany: async ({ where }: Row) => {
      if (this.failRefreshDelete) { const e = this.failRefreshDelete; this.failRefreshDelete = null; throw e; }
      const before = this.authSessions.length;
      this.authSessions = this.authSessions.filter((s) => !this.match("auth", s, where));
      return { count: before - this.authSessions.length };
    },
    findMany: async ({ where }: Row) => this.authSessions.filter((s) => this.match("auth", s, where)),
  };
  businessAdminAuditLog = { create: async ({ data }: Row) => (this.audit.push(data), data) };
  courseUserMapper = this.model("enroll", () => this.enrollments);
  paymentOrder = this.model("pay", () => this.payments);
  courses = this.model("courses", () => this.courseRows);

  /** Simulate trouble: the next refresh-token delete throws (then clears itself). */
  failRefreshDelete: Error | null = null;
  /** All-or-nothing: if the callback throws, every table is restored to how it was. Used to prove terminate is atomic. */
  $transaction = async <T,>(fn: (tx: this) => Promise<T>): Promise<T> => {
    const copy = (rows: Row[]) => rows.map((r) => ({ ...r }));
    const before = { sessions: copy(this.sessions), authSessions: copy(this.authSessions), events: copy(this.events), visitors: copy(this.visitors) };
    try {
      return await fn(this);
    } catch (e) {
      this.sessions = before.sessions; this.authSessions = before.authSessions; this.events = before.events; this.visitors = before.visitors;
      throw e;
    }
  };

  constructor() {
    this.monitoringEvent.groupBy = async (a: Row) => this.groupedEvents(a);
    this.monitoringSession.groupBy = async (a: Row) => this.groupedSessions(a);
  }

  /** Only what the analytics endpoint needs: group by one column and count. */
  private group(rows: Row[], key: string, args: Row) {
    const counts = new Map<any, number>();
    for (const r of rows.filter((x) => this.match("g", x, args.where))) counts.set(r[key], (counts.get(r[key]) ?? 0) + 1);
    const out = [...counts].map(([v, n]) => ({ [key]: v, _count: { _all: n } })).sort((a: any, b: any) => b._count._all - a._count._all);
    return args.take ? out.slice(0, args.take) : out;
  }
  groupedEvents = (args: Row) => this.group(this.events, args.by[0], args);
  groupedSessions = (args: Row) => this.group(this.sessions, args.by[0], args);
  /** Tagged-template stand-in: the SQL text decides the (empty) shape. */
  $queryRaw = async (strings: TemplateStringsArray) => (strings.join(" ").includes("monitoring_sessions") ? [{ avg_seconds: 0, sessions: this.sessions.length, registered_sessions: this.sessions.filter((s) => s.userId).length, visitors: this.visitors.length }] : []);
}
