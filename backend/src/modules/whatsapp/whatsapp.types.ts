export interface WhatsappConfig {
  /** Master switch: WHATSAPP_ENABLED === "true". When false the webhook answers 503. */
  enabled: boolean;
  /** Meta App Secret — used only to verify X-Hub-Signature-256. */
  appSecret?: string;
  /** Verify token you invent and paste into the Meta webhook form. */
  verifyToken?: string;
  /** Permanent system-user token for the Graph API (outbound only). */
  accessToken?: string;
  /** Business phone number ID. If set, events for other numbers are ignored. */
  phoneNumberId?: string;
  businessAccountId?: string;
  graphApiVersion: string;
}

export type WhatsappMessageStatusValue = "RECEIVED" | "SENT" | "DELIVERED" | "READ" | "FAILED";

/** A customer → business message, normalised from Meta's payload. */
export interface InboundMessageEvent {
  waMessageId: string;
  /** Customer's WhatsApp ID (phone number, digits only). */
  from: string;
  contactName?: string;
  type: string;
  textBody?: string;
  timestamp?: Date;
  phoneNumberId?: string;
  /** Original message object from Meta (no secrets in it). */
  raw: Record<string, unknown>;
}

/** A delivery/read/failure update for a message the business sent. */
export interface StatusEvent {
  waMessageId: string;
  /** Meta's raw status: sent | delivered | read | failed | deleted ... */
  status: string;
  recipientId: string;
  timestamp?: Date;
  phoneNumberId?: string;
  error?: { code?: number; title?: string; details?: string };
}

export interface ParsedWebhook {
  inbound: InboundMessageEvent[];
  statuses: StatusEvent[];
  /** Changes skipped (other field, other phone number ID, malformed). */
  skipped: number;
}

/** Persisted state used by the status state machine. */
export interface MessageState {
  status: WhatsappMessageStatusValue;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  failedAt: Date | null;
  errorCode: number | null;
  errorTitle: string | null;
  errorDetails: string | null;
}

export type InboundSaveResult = "created" | "duplicate";
export type StatusApplyResult = "applied" | "duplicate" | "ignored";

export interface WhatsappStore {
  saveInboundMessage(event: InboundMessageEvent): Promise<InboundSaveResult>;
  applyStatusEvent(event: StatusEvent): Promise<StatusApplyResult>;
}

export interface WebhookResult {
  inbound: { created: number; duplicate: number };
  statuses: { applied: number; duplicate: number; ignored: number };
  skipped: number;
}
