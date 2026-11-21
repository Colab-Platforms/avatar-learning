import prisma from "@root/prisma.js";
import { logger } from "@/utils/logger.js";
import { MonitoringService, type Ctx } from "./monitoring.service.js";
import { currentContext } from "./request-context.js";
import { monitoringConfig, parseUserAgent, type ActivityType, type AuthType } from "./monitoring.util.js";

/** The one service instance the app uses. Tests build their own with a fake database. */
export const monitoring = new MonitoringService(prisma);

const emptyCtx = (): Ctx => ({ ip: null, device: parseUserAgent(null), country: null, visitorKey: null });
const ctxNow = (): Ctx => currentContext() ?? emptyCtx();

/**
 * Fire-and-forget recording used by the rest of the backend. It NEVER throws and is never awaited by the caller, so a monitoring
 * problem (or a slow write) cannot fail or slow a sign-in, payment or lesson request. Failures are logged by error class only.
 */
function safely(what: string, fn: () => Promise<unknown>): void {
  if (!monitoringConfig().enabled) return;
  void (async () => {
    try {
      await fn();
    } catch (e) {
      logger.warn(`[Monitoring] ${what} failed: ${e instanceof Error ? e.name : "error"}`);
    }
  })();
}

export const track = {
  login(userId: string, authSessionId: string) {
    const ctx = ctxNow(); // captured now: the request context is gone by the time the async work runs
    safely("login", () => monitoring.onLogin({ userId, authSessionId, ctx }));
  },
  loginFailed(i: { identifier: string; userId?: string | null; reason: string }) {
    const ctx = ctxNow();
    safely("login-failed", () => monitoring.onLoginFailed({ ...i, ctx }));
  },
  logout(authSessionId: string, userId: string | null) {
    const ctx = ctxNow();
    safely("logout", () => monitoring.onLogout({ authSessionId, userId, ctx }));
  },
  sessionRotated(oldId: string, newId: string) {
    safely("rotate", () => monitoring.onSessionRotated(oldId, newId));
  },
  /** Registration, verification, password, activation, enrolment, payment, lesson/test, profile ... */
  account(type: ActivityType | AuthType, userId: string, extra: { metadata?: unknown; module?: string; reason?: string } = {}) {
    const ctx = ctxNow();
    safely(`event ${type}`, () => monitoring.onAccountEvent(type, { userId, ctx, ...extra }));
  },
};
