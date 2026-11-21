import { logger } from "@/utils/logger.js";

const INTERVAL_MS = 30_000;

/**
 * Drains the persistent email queue (email_messages) and runs due scheduled emails. Queue state lives in the database, so
 * pending emails survive restarts. NOT started unless EMAIL_AUTOMATION_ENABLED=true at boot.
 */
export function startEmailWorker(): void {
  if (process.env.EMAIL_AUTOMATION_ENABLED?.trim().toLowerCase() !== "true") return;
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const { emailAutomation } = await import("@/modules/email-automation/email-automation.runtime.js");
      await emailAutomation.processDue();
    } catch (err) {
      logger.error(`[EmailAutomation] worker tick failed: ${err instanceof Error ? err.name : "unknown error"}`);
    } finally {
      running = false;
    }
  };
  setInterval(() => void tick(), INTERVAL_MS).unref();
  void tick(); // pick up anything that became due while the server was down
  logger.info("[EmailAutomation] worker started");
}
