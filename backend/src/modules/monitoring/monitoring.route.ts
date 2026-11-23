import { Router, type Request, type RequestHandler, type Response } from "express";
import jwt from "jsonwebtoken";
import { createLimiter } from "@/middlewares/rateLimiter.js";
import { sendResponse } from "@/utils/responseUtils.js";
import { ApiError } from "@/utils/ApiError.js";
import { logger } from "@/utils/logger.js";
import { currentContext } from "./request-context.js";
import { isAuthSessionRevoked } from "./session-revocation.js";
import { parseUserAgent } from "./monitoring.util.js";
import type { MonitoringService } from "./monitoring.service.js";

/**
 * Who is calling, WITHOUT requiring a login: a guest has no token. A valid access token links the visit to the account; a token an
 * admin revoked is reported so the heartbeat can tell the browser to sign out. Nothing here ever rejects the request.
 */
export async function softAuth(req: Request): Promise<{ userId: string | null; revoked: boolean }> {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer ") || !process.env.JWT_SECRET) return { userId: null, revoked: false };
    const d = jwt.verify(h.split(" ")[1], process.env.JWT_SECRET) as { id?: string; sid?: string };
    if (!d.id) return { userId: null, revoked: false };
    return { userId: d.id, revoked: await isAuthSessionRevoked(d.sid) };
  } catch {
    return { userId: null, revoked: false };
  }
}

/**
 * Public collection endpoints, mounted at /api/track. First-party, anonymous-by-default, rate limited. They only ever write
 * to the monitoring tables; bad or unsupported input is ignored (answered as "not tracked"), never an error page.
 */
export function createTrackRouter(service: MonitoringService, limiter: RequestHandler = createLimiter({ windowMs: 60_000, max: 240, message: "Too many requests." })): Router {
  const router = Router();
  const ctxOf = (req: Request) => {
    const c = currentContext();
    return { device: c?.device ?? parseUserAgent(req.get("user-agent")), country: c?.country ?? null };
  };
  const run = (what: string, fn: (req: Request) => Promise<Record<string, unknown>>) => async (req: Request, res: Response) => {
    try {
      sendResponse(res, true, await fn(req), "");
    } catch (e) {
      if (e instanceof ApiError) return void sendResponse(res, false, null, e.message, e.statusCode);
      logger.warn(`[Monitoring] ${what} failed: ${e instanceof Error ? e.name : "error"}`);
      sendResponse(res, true, { tracked: false }, ""); // the website must never see a tracking failure
    }
  };
  const body = (req: Request): Record<string, unknown> => (req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {});

  router.post("/pageview", limiter, run("pageview", async (req) => {
    const b = body(req);
    return service.pageView({ visitorKey: b.visitorId, path: b.path, referrer: b.referrer, userId: (await softAuth(req)).userId, ctx: ctxOf(req) });
  }));
  router.post("/heartbeat", limiter, run("heartbeat", async (req) => {
    const b = body(req);
    const a = await softAuth(req);
    return service.heartbeat({ visitorKey: b.visitorId, path: b.path, userId: a.userId, revoked: a.revoked, ctx: ctxOf(req) });
  }));
  router.post("/event", limiter, run("event", async (req) => {
    const b = body(req);
    return service.feature({ visitorKey: b.visitorId, type: b.type, path: b.path, metadata: b.metadata, userId: (await softAuth(req)).userId, ctx: ctxOf(req) });
  }));
  return router;
}

// The mounted instance (routes.ts mounts it at /api/track). Tests build their own with createTrackRouter(fakeService).
import { monitoring } from "./monitoring.track.js";
const router = createTrackRouter(monitoring);
export default router;
