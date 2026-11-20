import { Router } from "express";
import { getWhatsappConfig } from "./whatsapp.config.js";
import { createWhatsappController } from "./whatsapp.controller.js";
import { WhatsappWebhookService } from "./whatsapp.service.js";
import type { InboundMessageEvent, WhatsappConfig, WhatsappStore } from "./whatsapp.types.js";

export interface WhatsappRouterDeps {
  store: WhatsappStore;
  /** Defaults to reading process.env on every request. */
  getConfig?: () => WhatsappConfig;
  /** Called after a new inbound message is stored (see WhatsappWebhookService). */
  onInboundCreated?: (event: InboundMessageEvent) => Promise<void>;
}

/** Router factory (no Prisma import) so tests can inject an in-memory store. */
export function createWhatsappRouter({ store, getConfig = () => getWhatsappConfig(), onInboundCreated }: WhatsappRouterDeps): Router {
  const controller = createWhatsappController({ service: new WhatsappWebhookService(store, onInboundCreated), getConfig });
  const router = Router();

  // Public by design: Meta cannot send our JWT. Access is controlled by the verify
  // token (GET) and the HMAC signature of the raw body (POST).
  router.get("/webhook", controller.verify);
  router.post("/webhook", controller.receive);

  return router;
}
