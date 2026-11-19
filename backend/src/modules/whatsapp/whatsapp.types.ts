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

/** Why the parser skipped something. One code per parser skip condition. */
export type SkipReason =
  | "entry_malformed" // an entry is not an object or has no changes array
  | "change_field_unsupported" // change.field is not "messages", or change/value is not an object
  | "phone_number_id_mismatch" // metadata.phone_number_id differs from WHATSAPP_PHONE_NUMBER_ID
  | "message_missing_keys" // a messages[] item is not an object or lacks id / from
  | "status_missing_keys"; // a statuses[] item is not an object or lacks id / status

/** Privacy-safe detail for one skip: never contains IDs, phone numbers, names or message text. */
export interface SkipRecord {
  reason: SkipReason;
  /** Meta change field name (e.g. "message_template_status_update"); only set when it looks like a plain identifier. */
  field?: string;
  /** Names (not values) of required keys that were absent. "(not an object)" when the item itself is malformed. */
  missingKeys?: string[];
  /** For phone_number_id_mismatch: whether the payload carried any phone_number_id at all. The ID itself is never kept. */
  incomingPhoneNumberIdPresent?: boolean;
}

export interface ParsedWebhook {
  inbound: InboundMessageEvent[];
  statuses: StatusEvent[];
  /** Number of skipped items; always equals skips.length. */
  skipped: number;
  /** Structured reasons for every skip. */
  skips: SkipRecord[];
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
  /** Skip counts per reason (empty when nothing was skipped). */
  skipReasons: Partial<Record<SkipReason, number>>;
  /** Privacy-safe explanation (codes, counts, key names, booleans) for logs; "" when nothing was skipped. */
  skipDetail: string;
}
