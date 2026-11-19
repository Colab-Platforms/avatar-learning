import type { Request, Response } from "express";
import { logger } from "@/utils/logger.js";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { missingWebhookConfig } from "./whatsapp.config.js";
import { safeEqual, verifyWhatsappSignature } from "./whatsapp.signature.js";
import type { WhatsappWebhookService } from "./whatsapp.service.js";
import type { WhatsappConfig } from "./whatsapp.types.js";

export interface WhatsappControllerDeps {
  service: WhatsappWebhookService;
  getConfig: () => WhatsappConfig;
}

/**
 * GET/POST handlers for Meta's webhook. Logging rules: counts and ids only —
 * never secrets, tokens, signatures, message bodies or phone numbers.
 */
export function createWhatsappController({ service, getConfig }: WhatsappControllerDeps) {
  /** Replies 503 (and returns true) when the integration is off or not configured. */
  const unavailable = (res: Response, config: WhatsappConfig): boolean => {
    if (!config.enabled) {
      sendResponse(res, false, null, "WhatsApp webhook is disabled.", STATUS_CODES.SERVICE_UNAVAILABLE);
      return true;
    }
    const missing = missingWebhookConfig(config);
    if (missing.length > 0) {
      logger.warn(`[WhatsApp] Webhook enabled but missing configuration: ${missing.join(", ")}`);
      sendResponse(res, false, null, "WhatsApp webhook is not configured.", STATUS_CODES.SERVICE_UNAVAILABLE);
      return true;
    }
    return false;
  };

  /** Meta webhook verification handshake (GET). Echoes hub.challenge when the token matches. */
  const verify = (req: Request, res: Response): void => {
    const config = getConfig();
    if (unavailable(res, config)) return;

    // Read from the raw URL: the app-wide sanitize middleware rewrites req.query values.
    const params = new URL(req.originalUrl, "http://localhost").searchParams;
    const mode = params.get("hub.mode");
    const token = params.get("hub.verify_token");
    const challenge = params.get("hub.challenge");

    if (mode !== "subscribe" || !token || !challenge) {
      sendResponse(res, false, null, "Invalid verification request.", STATUS_CODES.BAD_REQUEST);
      return;
    }
    if (!safeEqual(token, config.verifyToken as string)) {
      logger.warn("[WhatsApp] Webhook verification rejected: verify token mismatch.");
      sendResponse(res, false, null, "Verification token mismatch.", STATUS_CODES.FORBIDDEN);
      return;
    }
    // Meta requires the challenge echoed back verbatim as the body.
    res.status(STATUS_CODES.OK).type("text/plain").send(challenge);
  };

  /** Event delivery (POST): messages from customers and delivery/read/failed statuses. */
  const receive = async (req: Request, res: Response): Promise<void> => {
    const config = getConfig();
    if (unavailable(res, config)) return;

    const rawBody = (req as Request & { rawBody?: string }).rawBody;
    if (!rawBody) {
      sendResponse(res, false, null, "Missing request body.", STATUS_CODES.BAD_REQUEST);
      return;
    }

    const signature = req.headers["x-hub-signature-256"];
    if (typeof signature !== "string" || !signature) {
      sendResponse(res, false, null, "Missing signature.", STATUS_CODES.UNAUTHORIZED);
      return;
    }
    if (!verifyWhatsappSignature(rawBody, signature, config.appSecret as string)) {
      logger.warn("[WhatsApp] Webhook rejected: invalid signature.");
      sendResponse(res, false, null, "Invalid signature.", STATUS_CODES.UNAUTHORIZED);
      return;
    }

    // Parse the exact bytes that were signed, not the sanitized req.body.
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      sendResponse(res, false, null, "Malformed JSON.", STATUS_CODES.BAD_REQUEST);
      return;
    }
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      sendResponse(res, false, null, "Invalid payload.", STATUS_CODES.BAD_REQUEST);
      return;
    }
    if ((payload as { object?: unknown }).object !== "whatsapp_business_account") {
      sendResponse(res, false, null, "Unsupported webhook object.", STATUS_CODES.NOT_FOUND);
      return;
    }

    try {
      const result = await service.handlePayload(payload, config.phoneNumberId);
      logger.info(
        `[WhatsApp] Webhook processed: inbound created=${result.inbound.created} duplicate=${result.inbound.duplicate}; ` +
          `status applied=${result.statuses.applied} duplicate=${result.statuses.duplicate} ignored=${result.statuses.ignored}; skipped=${result.skipped}`,
      );
      sendResponse(res, true, result, "EVENT_RECEIVED", STATUS_CODES.OK);
    } catch (err) {
      // Non-2xx makes Meta retry later; processing is idempotent so a retry is safe.
      // Log the error type/code only: ORM error messages can embed query arguments (message text, phone numbers).
      const kind = err instanceof Error ? `${err.name}${(err as { code?: string }).code ? ` (${(err as { code?: string }).code})` : ""}` : "unknown error";
      logger.error(`[WhatsApp] Webhook processing failed: ${kind}`);
      sendResponse(res, false, null, "Failed to process webhook.", STATUS_CODES.SERVER_ERROR);
    }
  };

  return { verify, receive };
}
