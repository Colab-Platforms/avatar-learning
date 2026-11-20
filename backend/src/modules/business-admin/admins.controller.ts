import type { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { logger } from "@/utils/logger.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { AdminError, type AdminsService } from "./admins.service.js";
import { ACTIONS, ACTION_LABELS, MODULE_KEYS, MODULE_LABELS, ROLE_PRESETS, isAction, isModuleKey, isRoleKey } from "./business-admin.modules.js";

const ID = /^[A-Za-z0-9_-]{8,64}$/;
// Conservative on purpose: these values are reused in HTML emails and sheets elsewhere, and because they are read from
// the raw body the global HTML sanitizer does not run on them. No angle brackets, quotes or whitespace can get through.
const EMAIL = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const NAME = /^[\p{L}\p{M}][\p{L}\p{M}\p{N} .'’-]{1,79}$/u;
// Control characters (incl. NUL) never belong in names or passwords and break Postgres text columns.
const CONTROL = new RegExp("[\\u0000-\\u001F\\u007F]", "g");

/**
 * Read from the RAW JSON body: the global sanitizer HTML-escapes strings (it would turn a password like "a<b&c" into
 * "a&lt;b&amp;c" and silently change it). Values are validated here instead and React escapes on display.
 */
function readBody(req: Request): Record<string, unknown> {
  const raw = (req as Request & { rawBody?: string }).rawBody;
  if (typeof raw === "string" && raw.length > 0) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      /* fall through */
    }
  }
  return req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};
}

const cleanName = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const n = v.replace(CONTROL, "").trim().replace(/\s+/g, " ");
  return NAME.test(n) ? n : null;
};

export function createAdminsController(service: AdminsService) {
  // Never log the body: it contains passwords. Only the error class/code.
  const fail = (res: Response, what: string, err: unknown) => {
    if (err instanceof AdminError) return void sendResponse(res, false, { code: err.code }, err.message, err.statusCode);
    const kind = err instanceof Error ? `${err.name}${(err as { code?: string }).code ? ` (${(err as { code?: string }).code})` : ""}` : "unknown error";
    logger.error(`[BusinessAdmin] admins ${what} failed: ${kind}`);
    sendResponse(res, false, null, "Something went wrong. Please try again.", STATUS_CODES.SERVER_ERROR);
  };
  const bad = (res: Response, message: string, field?: string) => sendResponse(res, false, field ? { field } : null, message, STATUS_CODES.BAD_REQUEST);
  const actor = (req: Request) => (req as AuthRequest).user?.id as string;
  const run = (what: string, fn: (req: Request, res: Response) => Promise<void>) => async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (err) {
      fail(res, what, err);
    }
  };

  /** Validates role + modules shared by create and update. Returns null after answering 400. */
  const roleInput = (res: Response, body: Record<string, unknown>, required: boolean) => {
    if (body.roleKey === undefined) {
      if (required) bad(res, "Choose a role.", "roleKey");
      return required ? null : { roleKey: undefined, modules: undefined, permissions: undefined as unknown };
    }
    if (!isRoleKey(body.roleKey)) return void bad(res, "Choose a valid role.", "roleKey"), null;
    if (body.permissions !== undefined) {
      const p = body.permissions;
      const okShape = !!p && typeof p === "object" && !Array.isArray(p) && Object.entries(p as Record<string, unknown>).every(([m, a]) => isModuleKey(m) && Array.isArray(a) && a.every(isAction));
      if (!okShape) return void bad(res, "One of the selected permissions is not valid.", "permissions"), null;
      if (body.roleKey === "CUSTOM" && !Object.values(p as Record<string, unknown[]>).some((a) => a.length > 0)) {
        return void bad(res, "Select at least one permission for a custom role.", "permissions"), null;
      }
      return { roleKey: body.roleKey, modules: undefined, permissions: p };
    }
    if (body.modules !== undefined) {
      if (!Array.isArray(body.modules) || !body.modules.every(isModuleKey)) return void bad(res, "One of the selected modules is not valid.", "modules"), null;
    }
    if (body.roleKey === "CUSTOM" && (!Array.isArray(body.modules) || body.modules.length === 0)) {
      return void bad(res, "Select at least one module for a custom role.", "modules"), null;
    }
    return { roleKey: body.roleKey, modules: body.modules, permissions: undefined as unknown };
  };

  return {
    meta(_req: Request, res: Response) {
      sendResponse(res, true, { actions: ACTIONS.map((key) => ({ key, label: ACTION_LABELS[key] })), modules: MODULE_KEYS.map((key) => ({ key, label: MODULE_LABELS[key] })), roles: Object.entries(ROLE_PRESETS).map(([key, p]) => ({ key, ...p })) }, "OK");
    },

    list: run("list", async (req, res) => {
      const pageRaw = req.query.page === undefined ? "1" : String(req.query.page);
      const sizeRaw = req.query.pageSize === undefined ? "25" : String(req.query.pageSize);
      if (!/^\d{1,5}$/.test(pageRaw) || !/^\d{1,3}$/.test(sizeRaw)) return void bad(res, "Invalid paging.");
      const page = Number(pageRaw);
      const pageSize = Number(sizeRaw);
      if (page < 1 || pageSize < 1 || pageSize > 100) return void bad(res, "page must be 1 or more and pageSize 1-100.");
      const q = req.query.q === undefined ? undefined : String(req.query.q).slice(0, 100);
      const statusRaw = req.query.status === undefined ? undefined : String(req.query.status);
      if (statusRaw !== undefined && statusRaw !== "" && statusRaw !== "active" && statusRaw !== "inactive") return void bad(res, "status must be active or inactive.");
      const moduleRaw = req.query.module === undefined ? undefined : String(req.query.module);
      if (moduleRaw && !isModuleKey(moduleRaw)) return void bad(res, "Unknown module filter.");
      const result = await service.list({ q, page, pageSize, status: statusRaw ? (statusRaw as "active" | "inactive") : undefined, module: moduleRaw || undefined });
      sendResponse(res, true, { ...result, page, pageSize }, "OK");
    }),

    create: run("create", async (req, res) => {
      const body = readBody(req);
      const name = cleanName(body.name);
      if (!name) return void bad(res, "Enter the person's name (2-80 characters).", "name");
      const email = typeof body.email === "string" ? body.email.trim() : "";
      if (!EMAIL.test(email) || email.length > 254) return void bad(res, "Enter a valid email address.", "email");
      if (typeof body.password !== "string" || body.password.length === 0) return void bad(res, "Enter a password.", "password");
      const role = roleInput(res, body, true);
      if (!role || !role.roleKey) return;
      const admin = await service.create({ name, email, password: body.password, roleKey: role.roleKey, modules: role.modules, permissions: role.permissions }, actor(req));
      logger.info(`[BusinessAdmin] admin account created (id ${admin.id})`);
      sendResponse(res, true, admin, "Admin created.", STATUS_CODES.CREATED);
    }),

    update: run("update", async (req, res) => {
      const id = String(req.params.id ?? "");
      if (!ID.test(id)) return void bad(res, "Invalid admin id.");
      const body = readBody(req);
      const patch: { name?: string; roleKey?: any; modules?: unknown; permissions?: unknown; isActive?: boolean } = {};
      if (body.name !== undefined) {
        const name = cleanName(body.name);
        if (!name) return void bad(res, "Enter the person's name (2-80 characters).", "name");
        patch.name = name;
      }
      if (body.isActive !== undefined) {
        if (typeof body.isActive !== "boolean") return void bad(res, "isActive must be true or false.", "isActive");
        patch.isActive = body.isActive;
      }
      const role = roleInput(res, body, false);
      if (role === null) return;
      if (role.roleKey) {
        patch.roleKey = role.roleKey;
        patch.modules = role.modules;
        patch.permissions = role.permissions;
      } else if (body.modules !== undefined || body.permissions !== undefined) {
        return void bad(res, "Send roleKey together with modules.", "roleKey");
      }
      if (Object.keys(patch).length === 0) return void bad(res, "Nothing to change.");
      const admin = await service.update(id, patch, actor(req));
      if (patch.isActive !== undefined) logger.info(`[BusinessAdmin] admin ${patch.isActive ? "activated" : "deactivated"} (id ${id})`);
      sendResponse(res, true, admin, "Admin updated.");
    }),

    auditLog: run("auditLog", async (req, res) => {
      const pageRaw = req.query.page === undefined ? "1" : String(req.query.page);
      const sizeRaw = req.query.pageSize === undefined ? "50" : String(req.query.pageSize);
      if (!/^\d{1,5}$/.test(pageRaw) || !/^\d{1,3}$/.test(sizeRaw) || Number(pageRaw) < 1 || Number(sizeRaw) < 1 || Number(sizeRaw) > 100) return void bad(res, "Invalid paging.");
      const target = req.query.target === undefined ? undefined : String(req.query.target);
      if (target !== undefined && !ID.test(target)) return void bad(res, "Invalid admin id.");
      sendResponse(res, true, { ...(await service.auditLog({ page: Number(pageRaw), pageSize: Number(sizeRaw), targetUserId: target })), page: Number(pageRaw), pageSize: Number(sizeRaw) }, "OK");
    }),

    resetPassword: run("resetPassword", async (req, res) => {
      const id = String(req.params.id ?? "");
      if (!ID.test(id)) return void bad(res, "Invalid admin id.");
      const body = readBody(req);
      if (typeof body.password !== "string" || body.password.length === 0) return void bad(res, "Enter a new password.", "password");
      await service.resetPassword(id, body.password, actor(req));
      logger.info(`[BusinessAdmin] admin password reset (id ${id})`);
      sendResponse(res, true, { reset: true }, "Password reset. The person must sign in again.");
    }),
  };
}
