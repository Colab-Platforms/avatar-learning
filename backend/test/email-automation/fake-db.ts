/** Minimal in-memory stand-in for the Prisma calls Email Automation makes. Test-only. */
type Row = Record<string, any>;
let seq = 0;
const cuid = () => `c${String(++seq).padStart(8, "0")}x`;

const isOp = (v: unknown): v is Record<string, any> => typeof v === "object" && v !== null && !(v instanceof Date) && !Array.isArray(v);
const cmp = (a: any, b: any) => (a instanceof Date ? a.getTime() : a) - (b instanceof Date ? b.getTime() : b);

class Table {
  rows: Row[] = [];
  constructor(
    private db: FakeDb,
    private defaults: () => Row,
    private uniques: string[] = [],
    private relations: Record<string, { table: string; fk: string }> = {},
  ) {}

  match(row: Row, where: Row = {}): boolean {
    return Object.entries(where).every(([k, cond]) => {
      if (k === "OR") return (cond as Row[]).some((w) => this.match(row, w));
      if (k === "AND") return (cond as Row[]).every((w) => this.match(row, w));
      if (this.relations[k]) {
        const rel = this.relations[k];
        const target = this.db.tables[rel.table].rows.find((r) => r.id === row[rel.fk]);
        return !!target && this.db.tables[rel.table].match(target, cond);
      }
      const v = row[k];
      if (!isOp(cond)) return v === cond || (v == null && cond == null);
      if ("in" in cond && !cond.in.includes(v)) return false;
      if ("not" in cond && v === cond.not) return false;
      if ("lt" in cond && !(v != null && cmp(v, cond.lt) < 0)) return false;
      if ("lte" in cond && !(v != null && cmp(v, cond.lte) <= 0)) return false;
      if ("gt" in cond && !(v != null && cmp(v, cond.gt) > 0)) return false;
      if ("contains" in cond && !String(v ?? "").toLowerCase().includes(String(cond.contains).toLowerCase())) return false;
      return true;
    });
  }

  private checkUnique(row: Row, ignoreId?: string) {
    for (const u of this.uniques) {
      if (row[u] != null && this.rows.some((r) => r.id !== ignoreId && r[u] === row[u])) throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    }
  }
  private apply(row: Row, data: Row) {
    for (const [k, v] of Object.entries(data)) row[k] = isOp(v) && "increment" in v ? (row[k] ?? 0) + v.increment : v;
  }
  private withInclude(row: Row, include?: Row) {
    if (!include) return { ...row };
    const out: Row = { ...row };
    for (const k of Object.keys(include)) {
      const rel = this.relations[k];
      if (rel) out[k] = this.db.tables[rel.table].rows.find((r) => r.id === row[rel.fk]) ?? null;
    }
    return out;
  }

  async create({ data }: { data: Row }) {
    const row = { id: cuid(), createdAt: this.db.now(), updatedAt: this.db.now(), ...this.defaults(), ...data };
    this.checkUnique(row);
    this.rows.push(row);
    return { ...row };
  }
  async createMany({ data, skipDuplicates }: { data: Row[]; skipDuplicates?: boolean }) {
    let count = 0;
    for (const d of data) {
      try {
        await this.create({ data: d });
        count++;
      } catch (e) {
        if (!skipDuplicates) throw e;
      }
    }
    return { count };
  }
  async findUnique({ where, include }: { where: Row; include?: Row }) {
    const row = this.rows.find((r) => Object.entries(where).every(([k, v]) => r[k] === v));
    return row ? this.withInclude(row, include) : null;
  }
  async findMany({ where, orderBy, take, skip, cursor, include, select }: Row = {}) {
    let rows = this.rows.filter((r) => this.match(r, where));
    if (orderBy) {
      const [[k, dir]] = Object.entries(orderBy as Row);
      rows = [...rows].sort((a, b) => cmp(a[k], b[k]) * (dir === "desc" ? -1 : 1));
    }
    if (cursor) rows = rows.slice(rows.findIndex((r) => r.id === cursor.id) + (skip ?? 0));
    else if (skip) rows = rows.slice(skip);
    if (take != null) rows = rows.slice(0, take);
    return rows.map((r) => (select ? Object.fromEntries(Object.keys(select).map((k) => [k, r[k]])) : this.withInclude(r, include)));
  }
  async count({ where }: { where?: Row } = {}) {
    return this.rows.filter((r) => this.match(r, where)).length;
  }
  async update({ where, data }: { where: Row; data: Row }) {
    const row = this.rows.find((r) => Object.entries(where).every(([k, v]) => r[k] === v));
    if (!row) throw new Error("Record not found");
    const next = { ...row };
    this.apply(next, data);
    this.checkUnique(next, row.id);
    Object.assign(row, next, { updatedAt: this.db.now() });
    return { ...row };
  }
  async updateMany({ where, data }: { where?: Row; data: Row }) {
    const hit = this.rows.filter((r) => this.match(r, where));
    for (const r of hit) {
      this.apply(r, data);
      r.updatedAt = this.db.now();
    }
    return { count: hit.length };
  }
  async deleteMany({ where }: { where?: Row } = {}) {
    const before = this.rows.length;
    this.rows = this.rows.filter((r) => !this.match(r, where));
    return { count: before - this.rows.length };
  }
  async delete({ where }: { where: Row }) {
    this.rows = this.rows.filter((r) => !Object.entries(where).every(([k, v]) => r[k] === v));
  }
  async groupBy({ by, where }: { by: string[]; where?: Row; _count?: unknown }) {
    const groups = new Map<string, Row>();
    for (const r of this.rows.filter((x) => this.match(x, where))) {
      const key = by.map((b) => r[b]).join("|");
      const g = groups.get(key) ?? { ...Object.fromEntries(by.map((b) => [b, r[b]])), _count: { _all: 0 } };
      g._count._all++;
      groups.set(key, g);
    }
    return [...groups.values()];
  }
}

export class FakeDb {
  clock = new Date("2026-11-21T10:00:00.000Z");
  now = () => new Date(this.clock);
  advance(ms: number) {
    this.clock = new Date(this.clock.getTime() + ms);
  }
  tables: Record<string, Table> = {};
  emailTemplate: Table;
  emailAutomation: Table;
  emailMessage: Table;
  adoptionUser: Table;
  adoptionSession: Table;
  emailWebhookEvent: Table;
  constructor() {
    this.emailTemplate = this.tables.emailTemplate = new Table(this, () => ({ type: "TRANSACTIONAL", status: "ACTIVE", textBody: null }));
    this.emailAutomation = this.tables.emailAutomation = new Table(this, () => ({ delayMinutes: 0, anchorEvent: null, scheduledAt: null, firedAt: null, expiredAt: null, isActive: false }), [], { template: { table: "emailTemplate", fk: "templateId" } });
    this.emailMessage = this.tables.emailMessage = new Table(
      this,
      () => ({ status: "QUEUED", attempts: 0, retryEpoch: 0, lockedAt: null, resendId: null, sentAt: null, deliveredAt: null, failureReason: null, isTest: false, userId: null, automationId: null, templateId: null, scheduledFor: this.now(), bodyHtml: null, bodyText: null, listUnsubscribe: null, contentHash: null, templateType: "TRANSACTIONAL", maybeAccepted: false, firstAttemptAt: null }),
      ["dedupeKey", "resendId"],
      { template: { table: "emailTemplate", fk: "templateId" }, automation: { table: "emailAutomation", fk: "automationId" } },
    );
    this.adoptionUser = this.tables.adoptionUser = new Table(this, () => ({ isActive: true, emailVerified: true, marketingEmailOptIn: false, emailUnsubscribedAt: null, companyName: null, googleId: null, passwordHash: "hash" }));
    this.adoptionSession = this.tables.adoptionSession = new Table(this, () => ({}));
    this.emailWebhookEvent = this.tables.emailWebhookEvent = new Table(this, () => ({ detail: null, appliedAt: null, receivedAt: this.now() }), ["svixId"]);
  }
}
