import { parseWhatsappWebhook } from "./whatsapp.parser.js";
import { countSkipReasons, describeSkips } from "./whatsapp.skips.js";
import { logger } from "@/utils/logger.js";
import type { InboundMessageEvent, WebhookResult, WhatsappStore } from "./whatsapp.types.js";

/** Applies a verified webhook payload to the store. Safe to call repeatedly with the same payload. */
export class WhatsappWebhookService {
  constructor(
    private readonly store: WhatsappStore,
    /**
     * Optional side effect for every inbound message, including redeliveries (duplicates), e.g. recording an opt-out keyword.
     * It MUST be idempotent. Running it on duplicates is what lets a redelivery repair a hook that failed the first time.
     * A failure never stops the rest of the payload from being stored; it is logged by type only and the request then
     * fails (non-2xx) so Meta redelivers.
     */
    private readonly onInboundCreated?: (event: InboundMessageEvent) => Promise<void>,
  ) {}

  async handlePayload(payload: unknown, expectedPhoneNumberId?: string): Promise<WebhookResult> {
    const parsed = parseWhatsappWebhook(payload, expectedPhoneNumberId);
    const result: WebhookResult = {
      inbound: { created: 0, duplicate: 0 },
      statuses: { applied: 0, duplicate: 0, ignored: 0 },
      skipped: parsed.skipped,
      skipReasons: countSkipReasons(parsed.skips),
      skipDetail: describeSkips(parsed.skips),
    };

    let hookFailed = false;
    // Sequential: events in one delivery can concern the same message (sent → delivered → read).
    for (const message of parsed.inbound) {
      const outcome = await this.store.saveInboundMessage(message);
      result.inbound[outcome]++;
      if (this.onInboundCreated) {
        try {
          await this.onInboundCreated(message);
        } catch (err) {
          hookFailed = true;
          logger.error(`[WhatsApp] Post-processing of an inbound message failed: ${err instanceof Error ? err.name : "unknown error"}`);
        }
      }
    }
    for (const status of parsed.statuses) {
      const outcome = await this.store.applyStatusEvent(status);
      result.statuses[outcome]++;
    }
    // Everything else is already stored; failing here makes Meta redeliver, and the hook runs again for the duplicates.
    if (hookFailed) throw new Error("Inbound post-processing failed");
    return result;
  }
}
