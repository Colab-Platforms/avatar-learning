import { randomBytes } from "node:crypto";
import type { InboxDb } from "../inbox.store.js";

// In-memory stand-in for the Prisma client slice the inbox uses. Shared by the unit tests and the dev-only test login (never touches a database).

type Row = Record<string, any>;

const unique = (code = "P2002") => Object.assign(new Error("Unique constraint failed on the fields: (`secret details`)"), { code });

/** Minimal Prisma `where` matcher for the shapes the inbox store uses. */
function matches(row: Row, where: Row | undefined): boolean {
  if (!where) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (key === "OR") {
      if (!(cond as Row[]).some((w) => matches(row, w))) return false;
      continue;
    }
    if (key === "AND") {
      if (!(cond as Row[]).every((w) => matches(row, w))) return false;
      continue;
    }
    const v = row[key];
    if (cond !== null && typeof cond === "object" && !(cond instanceof Date)) {
      const c = cond as Row;
      if ("in" in c && !c.in.includes(v)) return false;
      if ("not" in c && (c.not === null ? v === null || v === undefined : v === c.not)) return false;
      if ("gt" in c && !(v !== null && v !== undefined && v > c.gt)) return false;
      if ("gte" in c && !(v !== null && v !== undefined && v >= c.gte)) return false;
      if ("lt" in c && !(v !== null && v !== undefined && v < c.lt)) return false;
      // Message text search (Prisma `contains`, used with mode: "insensitive").
      if ("contains" in c && !String(v ?? "").toLowerCase().includes(String(c.contains).toLowerCase())) return false;
    } else if (v instanceof Date && cond instanceof Date ? v.getTime() !== cond.getTime() : v !== cond) {
      return false;
    }
  }
  return true;
}

function sort(rows: Row[], orderBy: Row | Row[] | undefined): Row[] {
  const keys = (Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : []).map((o) => Object.entries(o)[0] as [string, "asc" | "desc"]);
  return [...rows].sort((a, b) => {
    for (const [k, dir] of keys) {
      const av = a[k] instanceof Date ? a[k].getTime() : a[k];
      const bv = b[k] instanceof Date ? b[k].getTime() : b[k];
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
    }
    return 0;
  });
}

const pick = (row: Row | undefined, select: Row | undefined) => {
  if (!row) return null;
  if (!select) return { ...row };
  return Object.fromEntries(Object.keys(select).map((k) => [k, row[k]]));
};

let seq = 0;
const cuid = () => `c${Date.now().toString(36)}${(++seq).toString(36).padStart(6, "0")}xxxxxxxx`;

export interface FakeUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  roles: string[];
  isDeleted?: boolean;
}

export class MemoryInboxDb implements InboxDb {
  messages: Row[] = [];
  conversations: Row[] = [];
  events: Row[] = [];
  users: FakeUser[] = [];
  clock = () => new Date();
  /** Set to make the next matching call throw (e.g. a database outage). */
  failOn: { table: string; op: string; error: Error } | null = null;
  calls: string[] = [];

  private guard(table: string, op: string) {
    this.calls.push(`${table}.${op}`);
    if (this.failOn && this.failOn.table === table && this.failOn.op === op) throw this.failOn.error;
  }

  /** Contacts register (consent) used by the Contacts page, conversation profile and the send-consent guard. */
  contactRows: Row[] = [];
  whatsappContact = {
    findMany: async (args: any = {}) => {
      const w = args.where ?? {};
      const rows = this.contactRows
        .filter((r) => {
          if (w.tags?.has && !(r.tags ?? []).includes(w.tags.has)) return false;
          if (w.optInStatus && r.optInStatus !== w.optInStatus) return false;
          if (w.OR && !(w.OR as Row[]).some((o) => { const [field, cond] = Object.entries(o)[0] as [string, any]; return String(r[field] ?? "").toLowerCase().includes(String(cond.contains).toLowerCase()); })) return false;
          return true;
        })
        .sort((a, b) => String(a.name).localeCompare(String(b.name)) || a.id.localeCompare(b.id));
      const start = args.skip ?? 0;
      return rows.slice(start, args.take !== undefined ? start + args.take : undefined).map((r) => ({ ...r }));
    },
    findUnique: async ({ where }: any) => {
      const r = this.contactRows.find((x) => (where.id ? x.id === where.id : x.waId === where.waId));
      return r ? { ...r } : null;
    },
    count: async (args: any = {}) => (await this.whatsappContact.findMany({ where: args.where })).length,
    create: async ({ data }: any) => {
      if (this.contactRows.some((r) => r.waId === data.waId)) throw unique();
      const row = { id: `c${randomBytes(12).toString("hex")}`, email: null, company: null, notes: null, tags: [], source: "manual", optInStatus: "UNKNOWN", optInEvidence: null, optInAt: null, optOutAt: null, optStatusByUserId: null, createdAt: this.clock(), ...data };
      this.contactRows.push(row);
      return { ...row };
    },
    update: async ({ where, data }: any) => {
      const r = this.contactRows.find((x) => x.id === where.id);
      if (!r) throw new Error("not found");
      if (data.waId && this.contactRows.some((x) => x.id !== r.id && x.waId === data.waId)) throw unique();
      Object.assign(r, data);
      return { ...r };
    },
    delete: async ({ where }: any) => {
      this.contactRows = this.contactRows.filter((x) => x.id !== where.id);
      return {};
    },
    upsert: async ({ where, create, update }: any) => {
      const r = this.contactRows.find((x) => x.waId === where.waId);
      if (r) return Object.assign(r, update);
      return this.whatsappContact.create({ data: create });
    },
  };

  whatsappMessage: InboxDb["whatsappMessage"] = {
    count: async (args) => (this.guard("msg", "count"), this.messages.filter((r) => matches(r, args?.where)).length),
    findFirst: async (args) => {
      this.guard("msg", "findFirst");
      return pick(sort(this.messages.filter((r) => matches(r, args?.where)), args?.orderBy)[0], args?.select);
    },
    findUnique: async ({ where }) => {
      this.guard("msg", "findUnique");
      return pick(this.messages.find((r) => Object.entries(where).every(([k, v]) => r[k] === v)), undefined);
    },
    findMany: async (args) => {
      this.guard("msg", "findMany");
      let rows = sort(this.messages.filter((r) => matches(r, args?.where)), args?.orderBy);
      if (args?.take !== undefined) rows = rows.slice(0, args.take);
      return rows.map((r) => pick(r, args?.select) as Row);
    },
    groupBy: async (args) => {
      this.guard("msg", "groupBy");
      const groups = new Map<string, Row[]>();
      for (const r of this.messages.filter((x) => matches(x, args.where))) {
        const key = JSON.stringify(args.by.map((b: string) => r[b]));
        groups.set(key, [...(groups.get(key) ?? []), r]);
      }
      return [...groups.values()].map((rows) => {
        const out: Row = Object.fromEntries(args.by.map((b: string) => [b, rows[0][b]]));
        if (args._count) out._count = { _all: rows.length };
        if (args._max) out._max = { createdAt: new Date(Math.max(...rows.map((r) => r.createdAt.getTime()))) };
        return out;
      });
    },
    create: async ({ data }) => {
      this.guard("msg", "create");
      if (this.messages.some((r) => r.waMessageId === data.waMessageId)) throw unique();
      if (data.clientRequestId && this.messages.some((r) => r.clientRequestId === data.clientRequestId)) throw unique();
      const row: Row = {
        id: cuid(),
        direction: "INBOUND",
        status: "RECEIVED",
        contactName: null,
        phoneNumberId: null,
        messageType: null,
        textBody: null,
        messageTimestamp: null,
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        failedAt: null,
        errorCode: null,
        errorTitle: null,
        errorDetails: null,
        sentByUserId: null,
        clientRequestId: null,
        createdAt: this.clock(),
        ...data,
      };
      this.messages.push(row);
      return { ...row };
    },
    update: async ({ where, data }) => {
      this.guard("msg", "update");
      const row = this.messages.find((r) => r.id === where.id);
      if (!row) throw new Error("not found");
      if (data.waMessageId && this.messages.some((r) => r.id !== row.id && r.waMessageId === data.waMessageId)) throw unique();
      Object.assign(row, data);
      return { ...row };
    },
    updateMany: async ({ where, data }) => {
      this.guard("msg", "updateMany");
      const rows = this.messages.filter((r) => matches(r, where));
      rows.forEach((r) => Object.assign(r, data));
      return { count: rows.length };
    },
    delete: async ({ where }) => {
      this.guard("msg", "delete");
      this.messages = this.messages.filter((r) => r.id !== where.id);
      return {};
    },
  };

  whatsappConversation: InboxDb["whatsappConversation"] = {
    findMany: async () => (this.guard("conv", "findMany"), this.conversations.map((r) => ({ ...r }))),
    findUnique: async ({ where }) => (this.guard("conv", "findUnique"), pick(this.conversations.find((r) => r.contactWaId === where.contactWaId), undefined)),
    upsert: async ({ where, create, update }) => {
      this.guard("conv", "upsert");
      const row = this.conversations.find((r) => r.contactWaId === where.contactWaId);
      if (row) return Object.assign(row, update);
      const made = { id: cuid(), assignedToUserId: null, assignedAt: null, lastReadAt: null, lastReadByUserId: null, ...create };
      this.conversations.push(made);
      return made;
    },
  };

  whatsappConversationEvent: InboxDb["whatsappConversationEvent"] = {
    create: async ({ data }) => {
      this.guard("event", "create");
      const row = { id: cuid(), body: null, authorUserId: null, assigneeUserId: null, createdAt: this.clock(), ...data };
      this.events.push(row);
      return { ...row };
    },
    findMany: async (args) => {
      this.guard("event", "findMany");
      const rows = sort(this.events.filter((r) => matches(r, args?.where)), args?.orderBy);
      return rows.slice(0, args?.take ?? rows.length);
    },
  };

  user: InboxDb["user"] = {
    findMany: async (args) => {
      this.guard("user", "findMany");
      const where = args?.where ?? {};
      const out = (u: FakeUser) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email });
      if (where.id?.in) return this.users.filter((u) => where.id.in.includes(u.id)).map(out);
      // Team query: SUPERADMIN, or ADMIN whose email is allowlisted (shape produced by PrismaInboxStore.teamMembers).
      const or: any[] = where.OR ?? [];
      const adminClause = or.find((o) => o.AND);
      const emails: string[] = adminClause ? adminClause.AND[1].OR.map((e: any) => String(e.email.equals).toLowerCase()) : [];
      return this.users
        .filter((u) => !u.isDeleted)
        .filter((u) => u.roles.includes("SUPERADMIN") || (u.roles.includes("ADMIN") && emails.includes(u.email.toLowerCase())))
        .map(out);
    },
  };

  async $transaction<T>(fn: (tx: InboxDb) => Promise<T>): Promise<T> {
    return fn(this);
  }

  // ─── seeding helpers ──────────────────────────────────────────────────────
  inbound(contactWaId: string, text: string | null, at: Date, extra: Row = {}): Row {
    const row: Row = {
      id: cuid(),
      waMessageId: `wamid.IN${++seq}`,
      direction: "INBOUND",
      status: "RECEIVED",
      contactWaId,
      contactName: null,
      phoneNumberId: null,
      messageType: text === null ? "image" : "text",
      textBody: text,
      messageTimestamp: null,
      sentAt: null,
      deliveredAt: null,
      readAt: null,
      failedAt: null,
      errorCode: null,
      errorTitle: null,
      errorDetails: null,
      sentByUserId: null,
      clientRequestId: null,
      createdAt: at,
      ...extra,
    };
    this.messages.push(row);
    return row;
  }
}
