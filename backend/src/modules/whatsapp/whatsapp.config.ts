import type { WhatsappConfig } from "./whatsapp.types.js";

const DEFAULT_GRAPH_API_VERSION = "v23.0";

const clean = (value: string | undefined): string | undefined => {
  const v = value?.trim();
  return v ? v : undefined;
};

/** Read at call time (not import time) so env changes and tests take effect. */
export function getWhatsappConfig(env: NodeJS.ProcessEnv = process.env): WhatsappConfig {
  return {
    enabled: clean(env.WHATSAPP_ENABLED)?.toLowerCase() === "true",
    appSecret: clean(env.WHATSAPP_APP_SECRET),
    verifyToken: clean(env.WHATSAPP_WEBHOOK_VERIFY_TOKEN),
    accessToken: clean(env.WHATSAPP_ACCESS_TOKEN),
    phoneNumberId: clean(env.WHATSAPP_PHONE_NUMBER_ID),
    businessAccountId: clean(env.WHATSAPP_BUSINESS_ACCOUNT_ID),
    graphApiVersion: clean(env.WHATSAPP_GRAPH_API_VERSION) ?? DEFAULT_GRAPH_API_VERSION,
  };
}

/** Names (never values) of variables the webhook needs but are missing. */
export function missingWebhookConfig(config: WhatsappConfig): string[] {
  const missing: string[] = [];
  if (!config.appSecret) missing.push("WHATSAPP_APP_SECRET");
  if (!config.verifyToken) missing.push("WHATSAPP_WEBHOOK_VERIFY_TOKEN");
  return missing;
}
