import { MemoryInboxDb, type FakeUser } from "../../src/modules/business-admin/devtest/memory.db.js";

export interface AdminFakeUser extends FakeUser {
  isActive?: boolean;
  password?: string | null;
  isEmailVerified?: boolean;
  profileCompleted?: boolean;
  authProvider?: string;
  createdAt?: Date;
}

let seq = 0;
const newId = () => `cadm${Date.now().toString(36)}${(++seq).toString(36).padStart(6, "0")}xx`;

/**
 * In-memory database for the permission and admin-management features: users with roles and active flag, the
 * business_admin_access table and refresh sessions. Extends the shared inbox fake so one object serves the whole API.
 */
export class AdminFakeDb extends MemoryInboxDb {
  accessRows: Array<{ id: string; userId: string; roleKey: string; modules: string[]; permissions?: unknown; createdByUserId?: string | null }> = [];
  auditRows: Array<Record<string, any>> = [];
  /** Set to make audit writes fail (proves a logging failure never breaks the change). */
  failAudit = false;
  sessions: Array<{ id: string; userId: string }> = [];
  rolesTable = [
    { id: "role-user", name: "USER" },
    { id: "role-admin", name: "ADMIN" },
    { id: "role-super", name: "SUPERADMIN" },
    { id: "role-staff", name: "BUSINESS_ADMIN" },
  ];
  /** Set to make the next matching call throw. */
  failUser: Error | null = null;

  private get all() {
    return this.users as AdminFakeUser[];
  }

  private withRoles(u: AdminFakeUser) {
    return { ...u, createdAt: u.createdAt ?? new Date(0), isActive: u.isActive !== false, userRoleMappings: u.roles.map((n) => ({ role: { name: n } })) };
  }

  private matchUser(u: AdminFakeUser, where: any): boolean {
    if (typeof where.id === "string" && u.id !== where.id) return false;
    if (where.id?.in && !where.id.in.includes(u.id)) return false;
    if (where.isActive !== undefined && (u.isActive !== false) !== where.isActive) return false;
    if (where.isDeleted !== undefined && !!u.isDeleted !== where.isDeleted) return false;
    if (where.email?.equals && u.email.toLowerCase() !== String(where.email.equals).toLowerCase()) return false;
    const names: string[] | undefined = where.userRoleMappings?.some?.role?.name?.in;
    if (names && !u.roles.some((r) => names.includes(r))) return false;
    if (where.OR) {
      const hit = (where.OR as any[]).some((o) => {
        const [field, cond] = Object.entries(o)[0] as [string, any];
        return String((u as any)[field] ?? "").toLowerCase().includes(String(cond.contains).toLowerCase());
      });
      if (!hit) return false;
    }
    return true;
  }

  // Overrides the base `user` delegate: handles the inbox lookups (names, team) AND the admin-management queries.
  user: any = {
    findMany: async (args: any) => {
      if (this.failUser) throw this.failUser;
      const where = args?.where ?? {};
      if (args?.include) {
        const rows = this.all
          .filter((u) => this.matchUser(u, where))
          .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0) || a.id.localeCompare(b.id));
        const start = args.skip ?? 0;
        return rows.slice(start, start + (args.take ?? rows.length)).map((u) => this.withRoles(u));
      }
      const out = (u: AdminFakeUser) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email });
      if (where.id?.in) return this.all.filter((u) => where.id.in.includes(u.id)).map(out);
      // Team query (shape produced by PrismaInboxStore.teamMembers).
      const or: any[] = where.OR ?? [];
      const ands = or.filter((o) => o.AND).map((o) => o.AND as any[]);
      const emails: string[] = ands.flatMap((a) => (a[1]?.OR ? a[1].OR.map((e: any) => String(e.email.equals).toLowerCase()) : []));
      const granted: string[] = ands.flatMap((a) => (a[1]?.id?.in ? a[1].id.in : []));
      return this.all
        .filter((u) => !u.isDeleted && (where.isActive === undefined || (u.isActive !== false) === where.isActive))
        .filter((u) => u.roles.includes("SUPERADMIN") || ((u.roles.includes("ADMIN") || u.roles.includes("BUSINESS_ADMIN")) && (emails.includes(u.email.toLowerCase()) || granted.includes(u.id))))
        .map(out);
    },
    findFirst: async (args: any) => {
      if (this.failUser) throw this.failUser;
      const u = this.all.find((x) => this.matchUser(x, args.where));
      return u ? this.withRoles(u) : null;
    },
    findUnique: async ({ where }: any) => {
      const u = this.all.find((x) => x.id === where.id);
      return u ? { email: u.email, isActive: u.isActive !== false, isDeleted: !!u.isDeleted } : null;
    },
    count: async (args: any) => this.all.filter((u) => this.matchUser(u, args.where)).length,
    create: async ({ data }: any) => {
      const roleId: string | undefined = data.userRoleMappings?.create?.roleId;
      const u: AdminFakeUser = {
        id: newId(),
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        email: data.email,
        roles: roleId ? [this.rolesTable.find((r) => r.id === roleId)!.name] : [],
        password: data.password,
        isActive: data.isActive,
        isEmailVerified: data.isEmailVerified,
        profileCompleted: data.profileCompleted,
        authProvider: data.authProvider,
        createdAt: new Date(),
      };
      this.users.push(u);
      return this.withRoles(u);
    },
    update: async ({ where, data }: any) => {
      const u = this.all.find((x) => x.id === where.id)!;
      Object.assign(u, data);
      return this.withRoles(u);
    },
  };

  businessAdminAccess = {
    findMany: async (args?: any) => {
      const w = args?.where ?? {};
      return this.accessRows
        .filter((r) => (w.userId?.in ? w.userId.in.includes(r.userId) : typeof w.userId === "string" ? r.userId === w.userId : true))
        .filter((r) => (w.modules?.has ? r.modules.includes(w.modules.has) : true))
        .map((r) => ({ ...r }));
    },
    findUnique: async ({ where }: any) => {
      const r = this.accessRows.find((x) => x.userId === where.userId);
      return r ? { ...r } : null;
    },
    upsert: async ({ where, create, update }: any) => {
      const r = this.accessRows.find((x) => x.userId === where.userId);
      if (r) return Object.assign(r, update);
      const made = { id: newId(), ...create };
      this.accessRows.push(made);
      return { ...made };
    },
  };

  businessAdminAuditLog = {
    create: async ({ data }: any) => {
      if (this.failAudit) throw new Error("audit down");
      const row = { id: newId(), createdAt: new Date(), ...data };
      this.auditRows.push(row);
      return row;
    },
    findMany: async (args: any = {}) => {
      const w = args.where ?? {};
      const rows = this.auditRows.filter((r) => (w.targetUserId ? r.targetUserId === w.targetUserId : true)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const start = args.skip ?? 0;
      return rows.slice(start, start + (args.take ?? rows.length));
    },
    count: async (args: any = {}) => this.auditRows.filter((r) => (args.where?.targetUserId ? r.targetUserId === args.where.targetUserId : true)).length,
  };

  role = { findUnique: async ({ where }: any) => this.rolesTable.find((r) => r.name === where.name) ?? null };

  contactRows: any[] = [];

  whatsappContact = {
    findMany: async (args: any = {}) => {
      const w = args.where ?? {};
      const has = (r: any) => {
        if (w.tags?.has && !(r.tags ?? []).includes(w.tags.has)) return false;
        if (w.optInStatus && r.optInStatus !== w.optInStatus) return false;
        if (w.OR) {
          const hit = (w.OR as any[]).some((o) => {
            const [field, cond] = Object.entries(o)[0] as [string, any];
            return String(r[field] ?? "").toLowerCase().includes(String(cond.contains).toLowerCase());
          });
          if (!hit) return false;
        }
        return true;
      };
      const rows = this.contactRows.filter(has).sort((a, b) => String(a.name).localeCompare(String(b.name)) || a.id.localeCompare(b.id));
      const start = args.skip ?? 0;
      return rows.slice(start, args.take !== undefined ? start + args.take : undefined).map((r) => ({ ...r }));
    },
    findUnique: async ({ where }: any) => {
      const r = this.contactRows.find((x) => (where.id ? x.id === where.id : x.waId === where.waId));
      return r ? { ...r } : null;
    },
    count: async (args: any = {}) => (await this.whatsappContact.findMany({ where: args.where })).length,
    create: async ({ data }: any) => {
      if (this.contactRows.some((r) => r.waId === data.waId)) throw Object.assign(new Error("Unique constraint failed on the fields: (`wa_id`)"), { code: "P2002" });
      const row = { id: newId(), email: null, company: null, notes: null, tags: [], source: "manual", optInStatus: "UNKNOWN", optInEvidence: null, optInAt: null, optOutAt: null, optStatusByUserId: null, createdAt: new Date(), ...data };
      this.contactRows.push(row);
      return { ...row };
    },
    update: async ({ where, data }: any) => {
      const r = this.contactRows.find((x) => x.id === where.id);
      if (!r) throw new Error("not found");
      if (data.waId && this.contactRows.some((x) => x.id !== r.id && x.waId === data.waId)) throw Object.assign(new Error("Unique"), { code: "P2002" });
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

  constructor() {
    super();
    // Text search (`textBody: { contains, mode: "insensitive" }`) is not understood by the shared matcher: add it here.
    const base = this.whatsappMessage.findMany;
    this.whatsappMessage.findMany = async (args?: any) => {
      const contains = args?.where?.textBody?.contains;
      if (!contains) return base(args);
      const { textBody: _t, ...rest } = args.where;
      const rows = (await base({ ...args, where: rest, take: undefined })).filter((r) => String(r.textBody ?? "").toLowerCase().includes(String(contains).toLowerCase()));
      return args.take !== undefined ? rows.slice(0, args.take) : rows;
    };
  }

  session = {
    deleteMany: async ({ where }: any) => {
      const before = this.sessions.length;
      this.sessions = this.sessions.filter((s) => s.userId !== where.userId);
      return { count: before - this.sessions.length };
    },
  };
}
