import { logger } from "@/utils/logger.js";

const INTERVAL_MS = 30_000;

/**
 * Drains the WhatsApp automation queue. It is NOT started unless WHATSAPP_AUTOMATION_ENABLED=true at boot, so a default
 * install never touches the queue or sends anything. (processDue() also re-checks the switch on every run.)
 */
export function startAutomationWorker(): void {
  if (process.env.WHATSAPP_AUTOMATION_ENABLED?.trim().toLowerCase() !== "true") return;
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      // Imported lazily so the route module (and Prisma) is only loaded when automation is on.
      const { automation } = await import("@/modules/business-admin/business-admin.route.js");
      await automation.processDue();
      await automation.syncDelivery();
    } catch (err) {
      logger.error(`[Automation] worker tick failed: ${err instanceof Error ? err.name : "unknown error"}`);
    } finally {
      running = false;
    }
  };
  setInterval(() => void tick(), INTERVAL_MS).unref();
  logger.info("[Automation] worker started");
}
