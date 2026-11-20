import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { logger } from "@/utils/logger.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { ACTIONS, ADMINS_MODULE, MODULE_KEYS, normalizePermissions, modulesOfPermissions, permissionsFromModules, type Action, type PermissionMap } from "./business-admin.modules.js";

type Env = Record<string, string | undefined>;

/** Comma-separated BUSINESS_ADMIN_EMAILS, lower-cased. Read at call time. */
export const businessAdminEmails = (env: Env = process.env): string[] =>
  (env.BUSINESS_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export type AccessVia = "superadmin" | "permissions" | "allowlist";

/** What the database says about the signed-in user (looked up on EVERY request so changes apply immediately). */
export interface BusinessAccount {
  email: string | null;
  isActive: boolean;
  isDeleted: boolean;
  /** Modules from the user's business_admin_access row; null = no row. */
  modules: string[] | null;
  /** Per-module actions from the same row; null/undefined = an older row (every action on its modules). */
  permissions?: unknown;
}

export interface ResolvedAccess {
  via: AccessVia;
  isSuperAdmin: boolean;
  /** Modules this person may use (a SUPERADMIN also gets "admins"). */
  modules: string[];
  /** What they may do in each module (a SUPERADMIN also gets "admins"). */
  permissions: Record<string, Action[]>;
}

const allActions = (): Action[] => [...ACTIONS];
const full = (modules: readonly string[]): Record<string, Action[]> => Object.fromEntries(modules.map((m) => [m, allActions()]));

/**
 * Business Admin is a separate permission from Learning Admin:
 *  - SUPERADMIN always has everything, including Admin Management.
 *  - ADMIN has the modules a Super Admin granted them (business_admin_access). An ADMIN with no row only has access
 *    if their email is on the legacy BUSINESS_ADMIN_EMAILS list, which grants every module except Admin Management.
 *  - USER never has it.
 *  - Deactivated or deleted accounts never have it, whatever their token says.
 */
export function resolveAccess(role: string | undefined, account: BusinessAccount | null, env: Env = process.env): ResolvedAccess | null {
  if (!account || !account.isActive || account.isDeleted) return null;
  if (role === "SUPERADMIN") return { via: "superadmin", isSuperAdmin: true, modules: [...MODULE_KEYS, ADMINS_MODULE], permissions: full([...MODULE_KEYS, ADMINS_MODULE]) };
  // BUSINESS_ADMIN is the staff role created in Admin Management: it only ever has what its permission row grants (no allowlist).
  if (role !== "ADMIN" && role !== "BUSINESS_ADMIN") return null;
  if (account.modules !== null) {
    // New rows carry per-action permissions; older rows only a module list (= every action). Only listed modules count.
    // `modules` is the coarse gate: a permission for a module that is not listed there never counts.
    const listed = new Set(account.modules);
    const base: PermissionMap = account.permissions ? normalizePermissions(account.permissions) : permissionsFromModules(account.modules);
    const perms = Object.fromEntries(Object.entries(base).filter(([m]) => listed.has(m))) as PermissionMap;
    const modules = modulesOfPermissions(perms);
    return modules.length > 0 ? { via: "permissions", isSuperAdmin: false, modules, permissions: perms as Record<string, Action[]> } : null;
  }
  if (role === "ADMIN" && account.email && businessAdminEmails(env).includes(account.email.trim().toLowerCase())) {
    return { via: "allowlist", isSuperAdmin: false, modules: [...MODULE_KEYS], permissions: full(MODULE_KEYS) };
  }
  return null;
}

/** Pure legacy helper kept for callers that only know role + email. */
export function evaluateBusinessAccess(role: string | undefined, email: string | null | undefined, env: Env = process.env): AccessVia | null {
  return resolveAccess(role, { email: email ?? null, isActive: true, isDeleted: false, modules: null }, env)?.via ?? null;
}

export interface AccessDeps {
  /** Account state for the signed-in user. Preferred. */
  findAccount?: (userId: string) => Promise<BusinessAccount | null>;
  /** Email only (older callers, e.g. the dev test login). Treated as an active account with no permission row. */
  findEmail?: (userId: string) => Promise<string | null>;
  env?: Env;
}

export type BusinessRequest = AuthRequest & { businessAccess?: AccessVia; businessModules?: string[]; businessPermissions?: Record<string, Action[]>; businessIsSuper?: boolean };

/** Must run after auth("ADMIN"). Answers 403 (never revealing the allowlist) to anyone without access. */
export function requireBusinessAdmin({ findAccount, findEmail, env }: AccessDeps): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      if (!user) throw new ApiError("Authentication required", STATUS_CODES.UNAUTHORIZED);
      const e = env ?? process.env;
      let account: BusinessAccount | null = null;
      if (user.role === "SUPERADMIN" || user.role === "ADMIN" || user.role === "BUSINESS_ADMIN") {
        try {
          if (findAccount) account = await findAccount(user.id);
          else if (findEmail) account = { email: await findEmail(user.id), isActive: true, isDeleted: false, modules: null };
        } catch (lookupErr) {
          // Fail closed with a generic message: raw database errors must not reach the client or the logs.
          logger.error(`[BusinessAdmin] Access check failed: ${lookupErr instanceof Error ? lookupErr.name : "unknown error"}`);
          throw new ApiError("Could not verify access. Please try again.", STATUS_CODES.SERVER_ERROR);
        }
      }
      const resolved = resolveAccess(user.role, account, e);
      if (!resolved) throw new ApiError("Business admin access is required.", STATUS_CODES.FORBIDDEN);
      const r = req as BusinessRequest;
      r.businessAccess = resolved.via;
      r.businessModules = resolved.modules;
      r.businessPermissions = resolved.permissions;
      r.businessIsSuper = resolved.isSuperAdmin;
      next();
    } catch (err) {
      next(err);
    }
  };
}

const AUTO_ACTION: Record<string, Action> = { GET: "view", HEAD: "view", OPTIONS: "view", POST: "create", PUT: "edit", PATCH: "edit", DELETE: "delete" };

/**
 * Per-route permission, enforced on the server for every endpoint: allowed when the person holds the action in ANY of the
 * listed modules. "auto" derives the action from the HTTP method (GET view, POST create, PUT/PATCH edit, DELETE delete); routes
 * whose meaning differs from their method (marking read, assigning, recording consent, submitting to Meta) name it explicitly.
 * Unknown methods and missing permissions fail closed.
 */
export function requireAccess(action: Action | "auto", ...keys: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const perms = (req as BusinessRequest).businessPermissions ?? {};
    const needed = action === "auto" ? AUTO_ACTION[req.method.toUpperCase()] : action;
    if (needed && keys.some((k) => perms[k]?.includes(needed))) return next();
    next(new ApiError("You do not have permission to use this part of Business Admin.", STATUS_CODES.FORBIDDEN));
  };
}

/** Per-route permission by module (the action follows the HTTP method). */
export const requireModule = (...keys: string[]): RequestHandler => requireAccess("auto", ...keys);
