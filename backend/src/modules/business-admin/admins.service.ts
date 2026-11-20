import bcrypt from "bcrypt";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { businessAdminEmails } from "./business-admin.access.js";
import { ADMINS_MODULE, MODULE_KEYS, modulesForRole, normalizeModules, type RoleKey } from "./business-admin.modules.js";

/** Cost 12 for new admin passwords (the shared helper in utils/auth.ts uses 8). Injectable so tests stay fast. */
export const ADMIN_BCRYPT_COST = 12;

export type AdminErrorCode = "EMAIL_EXISTS" | "NOT_FOUND" | "NOT_AN_ADMIN" | "PROTECTED" | "SELF" | "WEAK_PASSWORD" | "ROLE_MISSING";

export class AdminError extends ApiError {
  constructor(
    readonly code: AdminErrorCode,
    message: string,
    statusCode: number,
  ) {
    super(message, statusCode);
    Object.setPrototypeOf(this, AdminError.prototype);
  }
}

export interface AdminsDb {
  user: {
    findMany(args?: any): Promise<any[]>;
    findFirst(args?: any): Promise<any | null>;
    count(args?: any): Promise<number>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
  };
  role: { findUnique(args: any): Promise<{ id: string } | null> };
  businessAdminAccess: {
    findMany(args?: any): Promise<any[]>;
    upsert(args: any): Promise<any>;
  };
  session: { deleteMany(args: any): Promise<{ count: number }> };
  $transaction<T>(fn: (tx: AdminsDb) => Promise<T>): Promise<T>;
}

export interface AdminDto {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  /** Learning-platform role: ADMIN or SUPERADMIN. */
  role: "ADMIN" | "SUPERADMIN";
  roleKey: RoleKey | null;
  modules: string[];
  /** Where the Business Admin access comes from. */
  source: "superadmin" | "permissions" | "allowlist" | "none";
  createdAt: string;
}

const SUPER_NAMES = ["SUPERADMIN", "SUPER_ADMIN"];
const ADMIN_ROLE_NAMES = ["ADMIN", ...SUPER_NAMES];

const splitName = (name: string): { firstName: string; lastName: string | null } => {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0], lastName: parts.length > 1 ? parts.slice(1).join(" ") : null };
};
const fullName = (u: { firstName?: string | null; lastName?: string | null; email: string }) =>
  `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email.split("@")[0];

const COMMON = ["password", "passw0rd", "12345678", "123456789", "qwerty", "letmein", "welcome", "admin123", "avatar"];

/** Returns a user-facing problem, or null when the password is acceptable. Never echoes the password. */
export function passwordProblem(password: unknown, ctx: { email?: string; name?: string } = {}): string | null {
  if (typeof password !== "string") return "Enter a password.";
  if (password.length < 10) return "Use at least 10 characters.";
  if (password.length > 128) return "Use at most 128 characters.";
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  if (classes < 3) return "Mix at least three of: lowercase, uppercase, numbers and symbols.";
  const lower = password.toLowerCase();
  if (COMMON.some((c) => lower.includes(c))) return "That password is too easy to guess.";
  const local = ctx.email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) return "The password must not contain the email name.";
  const first = ctx.name?.trim().split(/\s+/)[0]?.toLowerCase();
  if (first && first.length >= 4 && lower.includes(first)) return "The password must not contain the person's name.";
  return null;
}

export interface AdminsServiceDeps {
  db: AdminsDb;
  env?: Record<string, string | undefined>;
  hash?: (plain: string) => Promise<string>;
  now?: () => Date;
}

export class AdminsService {
  private readonly hash: (plain: string) => Promise<string>;
  constructor(private readonly deps: AdminsServiceDeps) {
    this.hash = deps.hash ?? ((p) => bcrypt.hash(p, ADMIN_BCRYPT_COST));
  }

  private get db() {
    return this.deps.db;
  }

  private toDto(u: any, access: any | undefined): AdminDto {
    const roles: string[] = (u.userRoleMappings ?? []).map((m: any) => m.role.name);
    const isSuper = roles.some((r) => SUPER_NAMES.includes(r));
    const allowlisted = businessAdminEmails(this.deps.env ?? process.env).includes(String(u.email).toLowerCase());
    let source: AdminDto["source"] = "none";
    let modules: string[] = [];
    if (isSuper) {
      source = "superadmin";
      modules = [...MODULE_KEYS, ADMINS_MODULE];
    } else if (access) {
      source = "permissions";
      modules = normalizeModules(access.modules);
    } else if (allowlisted) {
      source = "allowlist";
      modules = [...MODULE_KEYS];
    }
    return {
      id: u.id,
      name: fullName(u),
      email: u.email,
      isActive: u.isActive,
      role: isSuper ? "SUPERADMIN" : "ADMIN",
      roleKey: isSuper ? null : (access?.roleKey ?? null),
      modules,
      source,
      createdAt: new Date(u.createdAt).toISOString(),
    };
  }

  async list(opts: { q?: string; page: number; pageSize: number }): Promise<{ items: AdminDto[]; total: number }> {
    const q = opts.q?.trim();
    const where: any = {
      isDeleted: false,
      userRoleMappings: { some: { role: { name: { in: ADMIN_ROLE_NAMES } } } },
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [users, total] = await Promise.all([
      this.db.user.findMany({
        where,
        include: { userRoleMappings: { include: { role: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
      this.db.user.count({ where }),
    ]);
    const rows = users.length ? await this.db.businessAdminAccess.findMany({ where: { userId: { in: users.map((u) => u.id) } } }) : [];
    const byUser = new Map(rows.map((r) => [r.userId, r]));
    return { items: users.map((u) => this.toDto(u, byUser.get(u.id))), total };
  }

  async create(input: { name: string; email: string; password: string; roleKey: RoleKey; modules?: unknown }, actorId: string): Promise<AdminDto> {
    const email = input.email.trim().toLowerCase();
    const problem = passwordProblem(input.password, { email, name: input.name });
    if (problem) throw new AdminError("WEAK_PASSWORD", problem, STATUS_CODES.BAD_REQUEST);

    // Never take over or promote an existing account through this form.
    const existing = await this.db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
    if (existing) throw new AdminError("EMAIL_EXISTS", "An account with this email already exists.", STATUS_CODES.CONFLICT);

    // Only the ADMIN role can be created here. Super Admin accounts are not creatable through this API at all.
    const role = await this.db.role.findUnique({ where: { name: "ADMIN" } });
    if (!role) throw new AdminError("ROLE_MISSING", "The ADMIN role is not set up in this database.", STATUS_CODES.SERVICE_UNAVAILABLE);

    const modules = modulesForRole(input.roleKey, input.modules);
    const passwordHash = await this.hash(input.password);
    const { firstName, lastName } = splitName(input.name);

    let created: { user: any; access: any };
    try {
      created = await this.createInTransaction(email, input, role.id, modules, passwordHash, firstName, lastName, actorId);
    } catch (err) {
      // Two creates for the same email racing past the check above: the unique index decides, the loser gets a clean 409.
      if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002") {
        throw new AdminError("EMAIL_EXISTS", "An account with this email already exists.", STATUS_CODES.CONFLICT);
      }
      throw err;
    }
    return this.toDto(created.user, created.access);
  }

  private createInTransaction(
    email: string,
    input: { roleKey: RoleKey },
    roleId: string,
    modules: string[],
    passwordHash: string,
    firstName: string,
    lastName: string | null,
    actorId: string,
  ): Promise<{ user: any; access: any }> {
    return this.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          firstName,
          lastName,
          password: passwordHash,
          authProvider: "LOCAL",
          // The Super Admin vouches for the address; without this the first login would ask for an OTP.
          isEmailVerified: true,
          isActive: true,
          profileCompleted: true,
          userRoleMappings: { create: { roleId, assignedBy: actorId } },
        },
        include: { userRoleMappings: { include: { role: true } } },
      });
      const access = await tx.businessAdminAccess.upsert({
        where: { userId: user.id },
        create: { userId: user.id, roleKey: input.roleKey, modules, createdByUserId: actorId },
        update: { roleKey: input.roleKey, modules },
      });
      return { user, access };
    });
  }

  /** Loads an editable target: must exist, must be a plain ADMIN (Super Admins are never changed here). */
  private async target(id: string): Promise<any> {
    const user = await this.db.user.findFirst({
      where: { id, isDeleted: false },
      include: { userRoleMappings: { include: { role: true } } },
    });
    if (!user) throw new AdminError("NOT_FOUND", "Admin not found.", STATUS_CODES.NOT_FOUND);
    const roles: string[] = user.userRoleMappings.map((m: any) => m.role.name);
    if (roles.some((r) => SUPER_NAMES.includes(r))) {
      throw new AdminError("PROTECTED", "Super Admin accounts cannot be changed here.", STATUS_CODES.FORBIDDEN);
    }
    if (!roles.includes("ADMIN")) throw new AdminError("NOT_AN_ADMIN", "This account is not an admin.", STATUS_CODES.UNPROCESSIBLE_ENTITY);
    return user;
  }

  async update(
    id: string,
    patch: { name?: string; roleKey?: RoleKey; modules?: unknown; isActive?: boolean },
    actorId: string,
  ): Promise<AdminDto> {
    const user = await this.target(id);
    if (patch.isActive === false && id === actorId) throw new AdminError("SELF", "You cannot deactivate your own account.", STATUS_CODES.BAD_REQUEST);

    const updated = await this.db.$transaction(async (tx) => {
      const data: Record<string, unknown> = {};
      if (patch.name !== undefined) Object.assign(data, splitName(patch.name));
      if (patch.isActive !== undefined) data.isActive = patch.isActive;
      const u = Object.keys(data).length
        ? await tx.user.update({ where: { id }, data, include: { userRoleMappings: { include: { role: true } } } })
        : user;

      let access: any;
      if (patch.roleKey !== undefined) {
        access = await tx.businessAdminAccess.upsert({
          where: { userId: id },
          create: { userId: id, roleKey: patch.roleKey, modules: modulesForRole(patch.roleKey, patch.modules), createdByUserId: actorId },
          update: { roleKey: patch.roleKey, modules: modulesForRole(patch.roleKey, patch.modules) },
        });
      }
      // Deactivation also ends every refresh session so the person cannot get a new access token.
      if (patch.isActive === false) await tx.session.deleteMany({ where: { userId: id } });
      if (!access) access = (await tx.businessAdminAccess.findMany({ where: { userId: id } }))[0];
      return this.toDto(u, access);
    });
    return updated;
  }

  async resetPassword(id: string, password: string, actorId: string): Promise<void> {
    const user = await this.target(id);
    if (id === actorId) throw new AdminError("SELF", "Change your own password from your profile.", STATUS_CODES.BAD_REQUEST);
    const problem = passwordProblem(password, { email: user.email, name: fullName(user) });
    if (problem) throw new AdminError("WEAK_PASSWORD", problem, STATUS_CODES.BAD_REQUEST);
    const passwordHash = await this.hash(password);
    await this.db.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { password: passwordHash } });
      // Existing sessions were opened with the old password.
      await tx.session.deleteMany({ where: { userId: id } });
    });
  }
}

export { fullName as adminFullName };
