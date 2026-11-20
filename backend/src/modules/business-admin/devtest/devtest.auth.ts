import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { sendResponse } from "@/utils/responseUtils.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";

/**
 * DEVELOPMENT-ONLY test login for /admin-adaption. It is isolated from real authentication on purpose:
 *  - it exists only when NODE_ENV === "development" AND DEV_TEST_LOGIN === "true" AND a password is configured;
 *  - its tokens are signed with a DIFFERENT key (derived from JWT_SECRET), so the real auth() middleware rejects
 *    them on every route, including /api/admin (Learning Admin);
 *  - it only unlocks an in-memory copy of Business Admin (devtest.router.ts), never the real database;
 *  - login is accepted from the loopback interface only.
 * Real accounts are never involved: there is no user lookup, no password table and no role grant.
 */

type Env = Record<string, string | undefined>;

export const DEV_TEST_EMAIL = "adaption.test@localhost.test";
export const DEV_TEST_USER_ID = "devtest-adaption-0001";
const AUDIENCE = "adaption-devtest";
const ISSUER = "avatar-adaption-devtest";
const TOKEN_TTL = "8h";

/** True only for an explicit local development opt-in. Anything else (production, test, unset) is false. */
export const devTestEnabled = (env: Env = process.env): boolean =>
  env.NODE_ENV === "development" &&
  env.DEV_TEST_LOGIN === "true" &&
  Boolean(env.JWT_SECRET) &&
  Boolean(env.DEV_TEST_LOGIN_PASSWORD);

/** A key no real token is signed with, so real tokens fail here and dev tokens fail in auth(). */
const devKey = (env: Env): string => createHmac("sha256", env.JWT_SECRET ?? "").update("avatar-adaption-devtest-key-v1").digest("hex");

const digest = (s: string) => createHash("sha256").update(s).digest();
const safeEqual = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export const signDevToken = (env: Env = process.env): string =>
  jwt.sign({ id: DEV_TEST_USER_ID, role: "ADMIN", devTest: true }, devKey(env), {
    algorithm: "HS256",
    audience: AUDIENCE,
    issuer: ISSUER,
    expiresIn: TOKEN_TTL,
  });

const bearer = (req: Request): string | null => {
  const h = req.headers.authorization;
  return h && h.startsWith("Bearer ") ? h.slice(7) : null;
};

/** True when the request carries a valid, unexpired dev-test token. Never throws. */
export function hasValidDevToken(req: Request, env: Env = process.env): boolean {
  const token = bearer(req);
  if (!token || !devTestEnabled(env)) return false;
  try {
    const d = jwt.verify(token, devKey(env), { algorithms: ["HS256"], audience: AUDIENCE, issuer: ISSUER }) as { id?: string; devTest?: boolean };
    return d.devTest === true && d.id === DEV_TEST_USER_ID;
  } catch {
    return false;
  }
}

/** Auth for the dev router: same contract as auth() (sets req.user) but verifies the dev key only. */
export const devAuth = (env: Env = process.env): RequestHandler => (req: Request, _res: Response, next: NextFunction) => {
  if (!hasValidDevToken(req, env)) return next(new ApiError("Authentication required", STATUS_CODES.UNAUTHORIZED));
  (req as AuthRequest).user = { id: DEV_TEST_USER_ID, role: "ADMIN" };
  (req as AuthRequest & { businessAccess?: string }).businessAccess = "allowlist";
  next();
};

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
// Any of these means the request came through a proxy or tunnel (ngrok, cloudflared, nginx, a load balancer ...).
const PROXY_HEADERS = ["x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "x-real-ip", "forwarded", "via", "cf-connecting-ip", "cf-ray", "true-client-ip", "x-original-forwarded-for"];

/** True only for a direct local connection: loopback socket, loopback Host header, and no proxy/tunnel headers. */
export function isDirectLocalRequest(req: Request): boolean {
  if (!LOOPBACK.has(req.socket.remoteAddress ?? "")) return false;
  if (PROXY_HEADERS.some((h) => req.headers[h] !== undefined)) return false;
  // A tunnel that forwards from localhost keeps the PUBLIC host name in Host; a direct browser/curl uses localhost.
  const host = String(req.headers.host ?? "").toLowerCase().replace(/:\d+$/, "");
  return LOOPBACK_HOSTS.has(host);
}

/** POST /dev-login. Only reachable when the dispatcher mounted it (i.e. devTestEnabled). */
export const devLogin = (env: Env = process.env): RequestHandler => (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!devTestEnabled(env)) throw new ApiError("Not found", STATUS_CODES.NOT_FOUND);
    if (!isDirectLocalRequest(req)) throw new ApiError("Not found", STATUS_CODES.NOT_FOUND);
    const { email, password } = (req.body ?? {}) as { email?: unknown; password?: unknown };
    const okEmail = typeof email === "string" && safeEqual(email.trim().toLowerCase(), DEV_TEST_EMAIL);
    const okPass = typeof password === "string" && safeEqual(password, env.DEV_TEST_LOGIN_PASSWORD ?? "");
    if (!(okEmail && okPass)) throw new ApiError("Invalid email or password", STATUS_CODES.UNAUTHORIZED);
    sendResponse(
      res,
      true,
      { accessToken: signDevToken(env), user: { id: DEV_TEST_USER_ID, firstName: "Adaption", lastName: "Test", email: DEV_TEST_EMAIL } },
      "Development test login",
    );
  } catch (err) {
    next(err);
  }
};
