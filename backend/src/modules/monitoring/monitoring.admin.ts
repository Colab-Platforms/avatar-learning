import { Router, type Request, type RequestHandler, type Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { ApiError } from "@/utils/ApiError.js";
import { logger } from "@/utils/logger.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import type { MonitoringService } from "./monitoring.service.js";
import { createLiveStream } from "./monitoring.stream.js";
import { parseDate } from "./monitoring.util.js";

type BusinessReq = AuthRequest & { businessIsSuper?: boolean };
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : undefined);

export interface MonitoringAdminDeps {
  service: MonitoringService;
  /** requireModule("monitoring"): any permitted person may read. Applied to every route. */
  view: RequestHandler;
  /** requireAccess("manage", "monitoring"): needed to terminate a session. */
  manage: RequestHandler;
  /** Looks up the signed-in admin's email for the audit entry. Optional. */
  emailOf?: (userId: string) => Promise<string | null>;
  streamIntervalMs?: number;
}

/**
 * Mounted at /api/business-admin/monitoring, INSIDE the Business Admin router (so login + Business Admin access run first) and then
 * the Monitoring module permission. Personal activity and security records are read-only except for session termination.
 */
export function createMonitoringAdminRouter(deps: MonitoringAdminDeps): Router {
  const { service } = deps;
  const router = Router();
  router.use(deps.view);

  const wrap = (what: string, fn: (req: BusinessReq) => Promise<unknown>) => async (req: Request, res: Response) => {
    try {
      sendResponse(res, true, await fn(req as BusinessReq), "");
    } catch (e) {
      if (e instanceof ApiError) return void sendResponse(res, false, null, e.message, e.statusCode);
      logger.error(`[Monitoring] ${what} failed: ${e instanceof Error ? e.name : "error"}`);
      sendResponse(res, false, null, "Something went wrong. Please try again.", STATUS_CODES.SERVER_ERROR);
    }
  };
  const range = (req: Request) => ({ from: parseDate(req.query.from), to: parseDate(req.query.to) });

  router.get("/stats", wrap("stats", () => service.stats()));
  router.get("/stream", createLiveStream(service, { intervalMs: deps.streamIntervalMs }));

  router.get("/sessions", wrap("sessions", (req) =>
    service.listSessions({ status: str(req.query.status) ?? "online", kind: str(req.query.kind), search: str(req.query.search), sort: str(req.query.sort), ...range(req), page: req.query.page, pageSize: req.query.pageSize })));

  router.post("/sessions/:id/terminate", deps.manage, wrap("terminate", async (req) => {
    const id = req.user?.id as string;
    return service.terminateSession(String(req.params.id), { id, email: deps.emailOf ? await deps.emailOf(id) : null, isSuperAdmin: req.businessIsSuper === true });
  }));

  router.get("/people", wrap("people", (req) =>
    service.people({ kind: str(req.query.kind) ?? "registered", search: str(req.query.search), online: str(req.query.online), sort: str(req.query.sort), page: req.query.page, pageSize: req.query.pageSize })));

  router.get("/users/:userId", wrap("user", (req) => service.userDetail(String(req.params.userId))));
  router.get("/users/:userId/timeline", wrap("user-timeline", (req) =>
    service.timeline({ userId: String(req.params.userId), types: str(req.query.types), category: str(req.query.category), ...range(req), page: req.query.page, pageSize: req.query.pageSize })));
  router.get("/visitors/:id", wrap("visitor", (req) => service.visitorDetail(String(req.params.id))));
  router.get("/visitors/:id/timeline", wrap("visitor-timeline", (req) =>
    service.timeline({ visitorId: String(req.params.id), types: str(req.query.types), category: str(req.query.category), ...range(req), page: req.query.page, pageSize: req.query.pageSize })));

  // IP addresses are personal data: only a Super Admin sees them in full, everyone else sees the network part.
  router.get("/security", wrap("security", (req) =>
    service.security({ status: str(req.query.status), type: str(req.query.type), search: str(req.query.search), userId: str(req.query.userId), device: str(req.query.device), ...range(req), page: req.query.page, pageSize: req.query.pageSize }, req.businessIsSuper === true)));

  router.get("/analytics", wrap("analytics", (req) => service.analytics(range(req))));
  return router;
}
