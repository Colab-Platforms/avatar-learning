import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { WhatsappApiError } from "@/modules/whatsapp/whatsapp.client.js";
import { AMBIGUOUS_MARKER } from "./inbox.plan.js";
import type { FailureInfo } from "./inbox.types.js";

export type InboxErrorCode =
  | "NOT_CONFIGURED"
  | "NO_CONVERSATION"
  | "WINDOW_CLOSED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_ASSIGNEE"
  | "NOT_RETRYABLE"
  | "CONSENT_WITHDRAWN"
  | "CONSENT_CHECK_FAILED"
  | "OPT_IN_REQUIRED"
  | "TEMPLATE_INVALID"
  | "MEDIA_INVALID"
  | "NOT_SUPPORTED"
  | "REPLY_UNAVAILABLE";

/** Expected, user-facing failure with a stable machine code the UI can branch on. */
export class InboxError extends ApiError {
  constructor(
    readonly code: InboxErrorCode,
    message: string,
    statusCode: number,
  ) {
    super(message, statusCode);
    Object.setPrototypeOf(this, InboxError.prototype);
  }
}

export const notConfigured = () =>
  new InboxError(
    "NOT_CONFIGURED",
    "Sending WhatsApp messages is not enabled on this server. Ask an administrator to configure it.",
    STATUS_CODES.SERVICE_UNAVAILABLE,
  );

export const consentWithdrawn = () =>
  new InboxError("CONSENT_WITHDRAWN", "This customer has withdrawn their WhatsApp consent. Do not send them WhatsApp messages.", STATUS_CODES.CONFLICT);

/** The consent check itself failed: refuse rather than risk messaging someone who opted out. */
export const consentCheckFailed = () =>
  new InboxError("CONSENT_CHECK_FAILED", "Could not verify this customer's WhatsApp consent, so the message was not sent. Please try again.", STATUS_CODES.SERVICE_UNAVAILABLE);

export const optInRequired = () =>
  new InboxError(
    "OPT_IN_REQUIRED",
    "This customer has not opted in to receive WhatsApp messages from you. Record their consent (with evidence) on the contact first, or wait for them to message you.",
    STATUS_CODES.CONFLICT,
  );

export const templateInvalid = (message: string) => new InboxError("TEMPLATE_INVALID", message, STATUS_CODES.BAD_REQUEST);
export const mediaInvalid = (message: string) => new InboxError("MEDIA_INVALID", message, STATUS_CODES.BAD_REQUEST);
export const notSupported = (what: string) => new InboxError("NOT_SUPPORTED", `${what} is not available on this server.`, STATUS_CODES.SERVICE_UNAVAILABLE);
export const replyUnavailable = () => new InboxError("REPLY_UNAVAILABLE", "The message you are replying to is not available.", STATUS_CODES.BAD_REQUEST);

export const windowClosed = () =>
  new InboxError(
    "WINDOW_CLOSED",
    "The 24-hour customer service window has closed. WhatsApp only allows an approved message template to start a conversation again. Send a template instead, or wait for the customer to write.",
    STATUS_CODES.CONFLICT,
  );

/** Friendly, accurate reasons for the Meta error codes a team is most likely to hit. */
const FRIENDLY: Record<number, string> = {
  131047: "Outside the 24-hour window: WhatsApp only accepts an approved template now.",
  131049: "WhatsApp declined to deliver this message to protect the customer experience.",
  131026: "Message could not be delivered. The number may not be on WhatsApp.",
  131030: "This number is not on the allowed recipient list for the test phone number.",
  131056: "Too many messages to this customer in a short time. Try again shortly.",
  130429: "WhatsApp rate limit reached. Try again shortly.",
  131048: "Spam rate limit reached for this number. Try again later.",
  190: "The WhatsApp access token is expired or invalid. Contact an administrator.",
  10: "The WhatsApp access token does not have permission to send messages.",
  100: "WhatsApp rejected the request as invalid.",
};

/** Turns a failed send into the persisted failure record. Never includes the access token or request body. */
export function describeSendFailure(err: unknown): FailureInfo & { ambiguous: boolean } {
  if (err instanceof WhatsappApiError) {
    if (err.ambiguous) {
      return {
        code: err.metaCode ?? null,
        title: "No confirmation from WhatsApp. The customer may still receive this message, so check before retrying.",
        details: AMBIGUOUS_MARKER,
        ambiguous: true,
      };
    }
    const title = (err.metaCode !== undefined && FRIENDLY[err.metaCode]) || "WhatsApp rejected this message.";
    return { code: err.metaCode ?? null, title, details: null, ambiguous: false };
  }
  return { code: null, title: "The message could not be sent because of an unexpected error.", details: null, ambiguous: false };
}
