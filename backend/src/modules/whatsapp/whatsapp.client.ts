import { getWhatsappConfig } from "./whatsapp.config.js";
import type { WhatsappConfig } from "./whatsapp.types.js";

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export class WhatsappApiError extends Error {
  constructor(
    message: string,
    readonly httpStatus?: number,
    readonly metaCode?: number,
  ) {
    super(message);
    this.name = "WhatsappApiError";
  }
}

export interface WhatsappClientOptions {
  config?: WhatsappConfig;
  /** Inject a mock in tests. Defaults to the global fetch. */
  fetchImpl?: FetchLike;
}

/**
 * Minimal Graph API client for outbound calls. NOTHING in the webhook flow calls
 * it: it exists so later features can send messages without re-implementing auth.
 * The access token is only ever placed in the Authorization header — never in a
 * URL, log line or error message.
 */
export class WhatsappClient {
  private readonly config: WhatsappConfig;
  private readonly fetchImpl: FetchLike;

  constructor(options: WhatsappClientOptions = {}) {
    this.config = options.config ?? getWhatsappConfig();
    this.fetchImpl = options.fetchImpl ?? (fetch as unknown as FetchLike);
  }

  private assertReady(): { accessToken: string; phoneNumberId: string } {
    const { enabled, accessToken, phoneNumberId } = this.config;
    if (!enabled) throw new WhatsappApiError("WhatsApp integration is disabled (WHATSAPP_ENABLED).");
    if (!accessToken) throw new WhatsappApiError("WHATSAPP_ACCESS_TOKEN is not configured.");
    if (!phoneNumberId) throw new WhatsappApiError("WHATSAPP_PHONE_NUMBER_ID is not configured.");
    return { accessToken, phoneNumberId };
  }

  private async post(path: "messages", body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { accessToken, phoneNumberId } = this.assertReady();
    const url = `https://graph.facebook.com/${this.config.graphApiVersion}/${phoneNumberId}/${path}`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const err = (data.error ?? {}) as { message?: string; code?: number };
      throw new WhatsappApiError(
        `WhatsApp API request failed (${response.status}${err.code ? `, code ${err.code}` : ""}): ${err.message ?? "no details"}`,
        response.status,
        err.code,
      );
    }
    return data;
  }

  /** Sends a free-form text message (only deliverable inside the 24h customer-service window). */
  async sendTextMessage(to: string, text: string): Promise<{ waMessageId: string }> {
    const data = await this.post("messages", {
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text, preview_url: false },
    });
    const id = Array.isArray(data.messages) ? (data.messages[0] as { id?: string } | undefined)?.id : undefined;
    if (!id) throw new WhatsappApiError("WhatsApp API response did not include a message id.");
    return { waMessageId: id };
  }

  /** Marks an inbound message as read (shows the blue ticks to the customer). */
  async markMessageAsRead(waMessageId: string): Promise<void> {
    await this.post("messages", { status: "read", message_id: waMessageId });
  }
}
