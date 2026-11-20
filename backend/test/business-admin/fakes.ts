import type { WhatsappSender } from "../../src/modules/business-admin/inbox.types.js";
import type { WhatsappConfig } from "../../src/modules/whatsapp/whatsapp.types.js";

// The in-memory database now lives in src (also used by the dev-only test login); re-exported so existing tests are unchanged.
export { MemoryInboxDb as FakeInboxDb, type FakeUser } from "../../src/modules/business-admin/devtest/memory.db.js";


export class FakeSender implements WhatsappSender {
  calls: Array<{ to: string; text: string }> = [];
  /** Override to simulate WhatsApp behaviour. */
  behaviour: (to: string, text: string, n: number) => Promise<{ waMessageId: string }> = async (_to, _text, n) => ({ waMessageId: `wamid.OUT${n}` });
  mediaCalls: Array<{ to: string; media: any; opts?: any }> = [];
  templateCalls: Array<{ to: string; tpl: any }> = [];
  uploadCalls: Array<{ mimeType: string; filename: string; size: number }> = [];
  async sendText(to: string, text: string, _opts?: { replyTo?: string }) {
    this.calls.push({ to, text });
    return this.behaviour(to, text, this.calls.length);
  }
  async uploadMedia(file: { data: Uint8Array; mimeType: string; filename: string }) {
    this.uploadCalls.push({ mimeType: file.mimeType, filename: file.filename, size: file.data.byteLength });
    return { mediaId: "77701" };
  }
  async sendMedia(to: string, media: any, opts?: any) {
    this.mediaCalls.push({ to, media, opts });
    return { waMessageId: "wamid.MEDIA" + this.mediaCalls.length };
  }
  async sendTemplate(to: string, tpl: any) {
    this.templateCalls.push({ to, tpl });
    return { waMessageId: "wamid.TPL" + this.templateCalls.length };
  }
}

export const readyConfig = (over: Partial<WhatsappConfig> = {}): WhatsappConfig => ({
  enabled: true,
  appSecret: "test_app_secret_value",
  verifyToken: "test_verify_token_value",
  accessToken: "test_access_token_value_inbox",
  phoneNumberId: "100200300400500",
  graphApiVersion: "v23.0",
  outboundEnabled: true,
  ...over,
});

export const PHONE = "919876543210";
export const OTHER_PHONE = "919811122233";

export const SENDER_SECRETS = { token: "test_access_token_value_inbox" };
