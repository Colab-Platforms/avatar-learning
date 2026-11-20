/**
 * Markers shared by the webhook store and the Business Admin inbox for outbound messages whose real WhatsApp message id
 * is not known yet (the request timed out, or the id could not be recorded). The webhook uses them to attach a late
 * delivery status to the message that was actually sent instead of creating a second, text-less row.
 */

/** Placeholder wa_message_id of an outbound row saved before WhatsApp answered: `pending:<clientRequestId>`. */
export const PENDING_PREFIX = "pending:";

/** error_details value on a FAILED row where we cannot know whether WhatsApp accepted the message. */
export const AMBIGUOUS_MARKER = "ambiguous_outcome";

/** A late status is only attributed to a pending row created this recently (same recipient). */
export const ADOPT_WINDOW_MS = 15 * 60 * 1000;
