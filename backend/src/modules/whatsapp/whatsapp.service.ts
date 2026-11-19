import { parseWhatsappWebhook } from "./whatsapp.parser.js";
import type { WebhookResult, WhatsappStore } from "./whatsapp.types.js";

/** Applies a verified webhook payload to the store. Safe to call repeatedly with the same payload. */
export class WhatsappWebhookService {
  constructor(private readonly store: WhatsappStore) {}

  async handlePayload(payload: unknown, expectedPhoneNumberId?: string): Promise<WebhookResult> {
    const parsed = parseWhatsappWebhook(payload, expectedPhoneNumberId);
    const result: WebhookResult = {
      inbound: { created: 0, duplicate: 0 },
      statuses: { applied: 0, duplicate: 0, ignored: 0 },
      skipped: parsed.skipped,
    };

    // Sequential: events in one delivery can concern the same message (sent → delivered → read).
    for (const message of parsed.inbound) {
      const outcome = await this.store.saveInboundMessage(message);
      result.inbound[outcome]++;
    }
    for (const status of parsed.statuses) {
      const outcome = await this.store.applyStatusEvent(status);
      result.statuses[outcome]++;
    }
    return result;
  }
}
