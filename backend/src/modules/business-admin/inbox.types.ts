export type InboxFilter = "all" | "unread" | "mine" | "unassigned";

/**
 * What the Inbox shows for a message. Real WhatsApp (Cloud API) progress is, in order:
 *   sending -> accepted (the Graph API returned a message id) -> sent (WhatsApp confirmed, via webhook)
 *   -> delivered -> read, or failed.
 * "simulated" is the dev sandbox only: a mock sender answered and NOTHING was sent to WhatsApp. It is never produced
 * for a real send, and a real send is never shown as simulated.
 */
export type MessageState = "sending" | "accepted" | "sent" | "delivered" | "read" | "failed" | "unconfirmed" | "received" | "simulated";

export interface PersonRef {
  id: string;
  name: string;
}

export interface ListParams {
  filter: InboxFilter;
  /** Only conversations assigned to this team member (in addition to `filter`). */
  assignee?: string;
  q?: string;
  page: number;
  pageSize: number;
  /** The signed-in team member (used by the "mine" filter). */
  meId: string;
}

export type MessageKind = "text" | "image" | "video" | "audio" | "document" | "sticker" | "template" | "other";

export interface InboxConversation {
  contactWaId: string;
  contactName: string | null;
  messageCount: number;
  unreadCount: number;
  lastMessageAt: string;
  lastDirection: "INBOUND" | "OUTBOUND";
  lastState: MessageState;
  lastMessageType: string | null;
  lastKind: MessageKind;
  /** First 140 characters of the last text/caption, or null for media without a caption. */
  lastPreview: string | null;
  assignee: PersonRef | null;
  windowOpen: boolean;
  windowExpiresAt: string | null;
}

export interface ConversationList {
  items: InboxConversation[];
  total: number;
  /** Conversations with at least one unread inbound message (whole inbox, ignoring filters). */
  unreadTotal: number;
}

export interface ContactDetail {
  contactWaId: string;
  contactName: string | null;
  messageCount: number;
  unreadCount: number;
  firstMessageAt: string | null;
  lastInboundAt: string | null;
  assignee: PersonRef | null;
  assignedAt: string | null;
  lastReadAt: string | null;
  windowOpen: boolean;
  windowExpiresAt: string | null;
}

export interface MediaDto {
  kind: "image" | "video" | "audio" | "document" | "sticker";
  mimeType: string | null;
  filename: string | null;
  sizeBytes: number | null;
  caption: string | null;
  voice: boolean;
  /** True when the file can be downloaded (WhatsApp media id known). */
  available: boolean;
}

export interface ReplyRef {
  /** Internal message id when we have the quoted message, otherwise null (it is outside our history). */
  id: string | null;
  text: string | null;
  kind: MessageKind;
  direction: "INBOUND" | "OUTBOUND" | null;
}

export interface InboxMessage {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  state: MessageState;
  type: string | null;
  kind: MessageKind;
  text: string | null;
  media: MediaDto | null;
  template: { name: string; language: string } | null;
  replyTo: ReplyRef | null;
  /** Message time shown to users (WhatsApp timestamp when known, otherwise when we stored it). */
  at: string;
  sentBy: PersonRef | null;
  error: { code: number | null; title: string | null; ambiguous: boolean } | null;
  /** True for dev-sandbox messages: a mock sender handled them and nothing reached WhatsApp. */
  simulated: boolean;
  /** When each stage was recorded (null = not reached / not reported). Meta's own timestamps for sent/delivered/read. */
  timeline: { acceptedAt: string | null; sentAt: string | null; deliveredAt: string | null; readAt: string | null; failedAt: string | null };
  /** Failed outbound message that has not been retried yet and can be resent. */
  canRetry: boolean;
  clientRequestId: string | null;
}

export interface MessagePage {
  /** Oldest to newest. */
  items: InboxMessage[];
  hasMore: boolean;
  /** Pass as `before` to load the page of older messages. */
  nextBefore: string | null;
}

export interface SearchHit {
  id: string;
  contactWaId: string;
  contactName: string | null;
  direction: "INBOUND" | "OUTBOUND";
  snippet: string;
  at: string;
}

export interface ConversationEvent {
  id: string;
  type: "ASSIGNED" | "UNASSIGNED" | "NOTE";
  body: string | null;
  author: PersonRef | null;
  assignee: PersonRef | null;
  createdAt: string;
}

/** Raw row as the store returns it (a subset of the Prisma model). */
export interface StoredMessage {
  id: string;
  waMessageId: string;
  direction: "INBOUND" | "OUTBOUND";
  status: "RECEIVED" | "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  contactWaId: string;
  messageType: string | null;
  textBody: string | null;
  messageTimestamp: Date | null;
  createdAt: Date;
  errorCode: number | null;
  errorTitle: string | null;
  errorDetails: string | null;
  /** Set only when Meta's status webhook confirmed "sent" (the API call itself never sets it). */
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  readAt?: Date | null;
  failedAt?: Date | null;
  sentByUserId: string | null;
  clientRequestId: string | null;
  /** Inbound: Meta's raw message object. Outbound: { media?, template?, replyTo? } written by the inbox. */
  payload?: unknown;
}

export interface FailureInfo {
  code: number | null;
  title: string;
  details: string | null;
}

export interface PendingOutboundInput {
  contactWaId: string;
  text: string | null;
  clientRequestId: string;
  userId: string;
  phoneNumberId?: string;
  messageType?: string;
  payload?: Record<string, unknown>;
}

export interface InboxStore {
  listConversations(params: ListParams, now?: Date): Promise<ConversationList>;
  getContact(contactWaId: string, now?: Date): Promise<ContactDetail | null>;
  listMessages(contactWaId: string, opts: { limit: number; before?: string; until?: string }, now?: Date): Promise<MessagePage>;
  searchMessages(q: string, opts: { contactWaId?: string; limit: number }): Promise<SearchHit[]>;
  markRead(contactWaId: string, userId: string, upTo: Date | undefined, now?: Date): Promise<{ lastReadAt: string }>;
  /** Returns false (and writes nothing) when the assignee is already the requested one. */
  assign(contactWaId: string, assigneeId: string | null, byUserId: string, now?: Date): Promise<{ changed: boolean }>;
  listEvents(contactWaId: string): Promise<ConversationEvent[]>;
  addNote(contactWaId: string, userId: string, body: string): Promise<ConversationEvent>;
  teamMembers(): Promise<PersonRef[]>;

  // Outbound pipeline
  getMessage(id: string): Promise<StoredMessage | null>;
  findByClientRequestId(clientRequestId: string): Promise<StoredMessage | null>;
  /** Idempotent on clientRequestId: a repeat returns the existing row with created=false. */
  createPendingOutbound(input: PendingOutboundInput): Promise<{ message: StoredMessage; created: boolean }>;
  /** Merges keys into an outbound row's payload (e.g. the media id once an upload succeeded). */
  mergePayload(id: string, patch: Record<string, unknown>): Promise<StoredMessage>;
  markSent(id: string, waMessageId: string, now?: Date): Promise<StoredMessage>;
  /** Only moves SENDING -> FAILED; never regresses a later state. */
  markFailed(id: string, failure: FailureInfo & { ambiguous: boolean }, now?: Date): Promise<StoredMessage>;
  toDto(message: StoredMessage, now?: Date): Promise<InboxMessage>;
  /** wamid of a stored message (used to quote it in a reply). */
  waMessageIdOf(id: string, contactWaId: string): Promise<string | null>;
}

export interface WhatsappSender {
  sendText(to: string, text: string, opts?: { replyTo?: string }): Promise<{ waMessageId: string }>;
  /** Optional capabilities: a sender that lacks them makes the matching feature answer "not supported". */
  uploadMedia?(file: { data: Uint8Array; mimeType: string; filename: string }): Promise<{ mediaId: string }>;
  sendMedia?(
    to: string,
    media: { kind: "image" | "video" | "audio" | "document"; mediaId: string; caption?: string; filename?: string },
    opts?: { replyTo?: string },
  ): Promise<{ waMessageId: string }>;
  sendTemplate?(to: string, template: { name: string; language: string; bodyParams: string[]; paramNames?: string[] }, opts?: { replyTo?: string }): Promise<{ waMessageId: string }>;
}
