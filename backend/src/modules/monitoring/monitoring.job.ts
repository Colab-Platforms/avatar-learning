import { logger } from "@/utils/logger.js";
import { monitoring } from "./monitoring.track.js";
import { monitoringConfig } from "./monitoring.util.js";

/**
 * Closes idle sessions every minute (so "offline" and session lengths are accurate even when nobody opens the dashboard) and
 * applies the retention policy once an hour. Both are bounded batches. Does nothing when monitoring is switched off.
 */
export function startMonitoringJob(): void {
  if (!monitoringConfig().enabled) return;
  let lastPurge = 0;
  const run = async () => {
    try {
      await monitoring.closeIdleSessions();
      if (Date.now() - lastPurge > 3600_000) {
        lastPurge = Date.now();
        const r = await monitoring.purge();
        if (r.events + r.sessions + r.visitors > 0) logger.info(`[Monitoring] retention removed ${r.events} events, ${r.sessions} sessions, ${r.visitors} visitors`);
      }
    } catch (e) {
      logger.warn(`[Monitoring] maintenance failed: ${e instanceof Error ? e.name : "error"}`);
    }
  };
  setTimeout(() => void run(), 15_000).unref?.();
  setInterval(() => void run(), 60_000).unref?.();
}
