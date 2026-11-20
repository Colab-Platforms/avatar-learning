import { logger } from "@/utils/logger.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { WhatsappConfig } from "@/modules/whatsapp/whatsapp.types.js";
import { WhatsappApiError } from "@/modules/whatsapp/whatsapp.client.js";
import { mediaOf, replyTargetOf, safeFilename, validateUpload, type MediaKind } from "@/modules/whatsapp/whatsapp.media.js";
import {
  consentCheckFailed,
  consentWithdrawn,
  describeSendFailure,
  InboxError,
  mediaInvalid,
  notConfigured,
  notSupported,
  optInRequired,
  replyUnavailable,
  templateInvalid,
  windowClosed,
} from "./inbox.errors.js";
import { retryKeyFor } from "./inbox.plan.js";
import type { TemplatesService } from "./templates.service.js";
import type { InboxMessage, InboxStore, StoredMessage, WhatsappSender } from "./inbox.types.js";

export const MAX_TEXT_LENGTH = 4096;
export const MAX_CAPTION_LENGTH = 1024;

export interface InboxServiceDeps {
  store: InboxStore;
  sender: WhatsappSender;
  /** Read per call so configuration changes take effect without a restart. */
  getConfig: () => WhatsappConfig;
  now?: () => Date;
  /**
   * Consent register lookup (the contacts' opt-in status). "withdrawn" blocks every outbound message; business-initiated
   * templates (outside the 24h window) additionally need "granted". If the check throws, the send is refused (fail closed).
   */
  consent?: { check(contactWaId: string): Promise<"granted" | "withdrawn" | "unknown"> };
  templates?: TemplatesService;
}

export interface SendResult {
  message: InboxMessage;
  /** False when this request was a repeat of an earlier one (same clientRequestId): nothing new was sent. */
  created: boolean;
}

interface Base {
  contactWaId: string;
  clientRequestId: string;
  userId: string;
  /** Internal id of the message being replied to (shown as a quote to the customer). */
  replyToMessageId?: string;
}

/** Sending is only possible when the integration is on, credentialed AND explicitly allowed to send. */
export const outboundReady = (c: WhatsappConfig): boolean =>
  c.enabled && Boolean(c.accessToken) && Boolean(c.phoneNumberId) && c.outboundEnabled === true;

type Action = () => Promise<{ waMessageId: string }>;

export class InboxService {
  private readonly now: () => Date;
  constructor(private readonly deps: InboxServiceDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  // ─── public operations ─────────────────────────────────────────────────────
  /** Sends a text reply. Idempotent per clientRequestId: a retry or double click never produces a second WhatsApp message. */
  async send(input: Base & { text: string }): Promise<SendResult> {
    return this.run(input, "free-form", async (replyTo) => {
      const { store, sender } = this.deps;
      const { message, created } = await store.createPendingOutbound({
        contactWaId: input.contactWaId,
        text: input.text,
        clientRequestId: input.clientRequestId,
        userId: input.userId,
        phoneNumberId: this.deps.getConfig().phoneNumberId,
        messageType: "text",
        ...(replyTo ? { payload: { replyTo } } : {}),
      });
      return { message, created, action: () => sender.sendText(input.contactWaId, input.text, replyTo ? { replyTo } : undefined) };
    });
  }

  /** Uploads a file to WhatsApp and sends it. Same safeguards as text (24h window, consent, idempotency). */
  async sendMedia(input: Base & { file: { data: Uint8Array; mimeType: string; filename: string }; caption?: string }): Promise<SendResult> {
    const { sender } = this.deps;
    if (!sender.uploadMedia || !sender.sendMedia) throw notSupported("Sending media");
    const check = validateUpload(input.file);
    if (!check.ok) throw mediaInvalid(check.message);
    const filename = safeFilename(input.file.filename);
    const caption = input.caption?.trim() ? input.caption.trim() : undefined;
    if (caption && caption.length > MAX_CAPTION_LENGTH) throw mediaInvalid(`Captions can be at most ${MAX_CAPTION_LENGTH} characters.`);
    // Audio has no caption in WhatsApp; refuse rather than silently dropping text the sender typed.
    if (caption && check.kind === "audio") throw mediaInvalid("Audio messages cannot have a caption.");
    const { kind, mimeType } = check;

    return this.run(input, "free-form", async (replyTo) => {
      const { store } = this.deps;
      const { message, created } = await store.createPendingOutbound({
        contactWaId: input.contactWaId,
        text: caption ?? null,
        clientRequestId: input.clientRequestId,
        userId: input.userId,
        phoneNumberId: this.deps.getConfig().phoneNumberId,
        messageType: kind,
        payload: { media: { kind, id: null, mimeType, filename, sizeBytes: input.file.data.byteLength, caption: caption ?? null, voice: false }, ...(replyTo ? { replyTo } : {}) },
      });
      const action: Action = async () => {
        let mediaId: string;
        try {
          mediaId = (await sender.uploadMedia!({ data: input.file.data, mimeType, filename })).mediaId;
        } catch (err) {
          // A failed or timed-out UPLOAD sent nothing to the customer, so it is never an "unconfirmed delivery".
          if (err instanceof WhatsappApiError) throw new WhatsappApiError(err.message, err.httpStatus, err.metaCode, false);
          throw err;
        }
        // Keep the id: if only the send step fails, a retry can reuse the uploaded file (valid for ~30 days).
        await store.mergePayload(message.id, { media: { id: mediaId } });
        return sender.sendMedia!(input.contactWaId, { kind, mediaId, caption, filename: kind === "document" ? filename : undefined }, replyTo ? { replyTo } : undefined);
      };
      return { message, created, action };
    });
  }

  /** Sends an approved template. Works outside the 24h window, but then needs recorded opt-in for the contact. */
  async sendTemplate(input: Base & { name: string; language: string; params: unknown }): Promise<SendResult> {
    const { sender, templates } = this.deps;
    if (!sender.sendTemplate || !templates) throw notSupported("Sending templates");
    return this.run(input, "template", async (replyTo) => {
      const resolved = await templates.resolve(input.name, input.language, input.params);
      if (!resolved.ok) throw templateInvalid(resolved.message);
      const { message, created } = await this.deps.store.createPendingOutbound({
        contactWaId: input.contactWaId,
        text: resolved.rendered,
        clientRequestId: input.clientRequestId,
        userId: input.userId,
        phoneNumberId: this.deps.getConfig().phoneNumberId,
        messageType: "template",
        payload: { template: { name: resolved.template.name, language: resolved.template.language, params: resolved.params, ...(resolved.paramNames ? { paramNames: resolved.paramNames } : {}), category: resolved.template.category }, ...(replyTo ? { replyTo } : {}) },
      });
      return {
        message,
        created,
        action: () => sender.sendTemplate!(input.contactWaId, { name: resolved.template.name, language: resolved.template.language, bodyParams: resolved.params, ...(resolved.paramNames ? { paramNames: resolved.paramNames } : {}) }, replyTo ? { replyTo } : undefined),
      };
    });
  }

  /**
   * Retries a message that definitely failed. Creates a NEW outbound row under a deterministic key so two clicks
   * cannot send twice, and the failed row stays as history. Works for text, templates and already-uploaded media.
   */
  async retry(input: { messageId: string; userId: string }): Promise<SendResult> {
    const { store, sender } = this.deps;
    const original = await store.getMessage(input.messageId);
    if (!original || original.direction !== "OUTBOUND") throw new InboxError("NOT_FOUND", "Message not found.", STATUS_CODES.NOT_FOUND);

    // Double click / second tab: report the retry that already exists.
    const prior = await store.findByClientRequestId(retryKeyFor(original.id));
    if (prior) return { message: await store.toDto(prior, this.now()), created: false };
    if (original.status !== "FAILED") throw new InboxError("NOT_RETRYABLE", "Only failed messages can be retried.", STATUS_CODES.CONFLICT);

    const type = original.messageType ?? "text";
    const payload = (original.payload && typeof original.payload === "object" ? original.payload : {}) as Record<string, any>;
    const replyTo = replyTargetOf(payload) ?? undefined;
    const base = { contactWaId: original.contactWaId, clientRequestId: retryKeyFor(original.id), userId: input.userId };

    if (type === "template") {
      const t = payload.template;
      if (!t?.name || !sender.sendTemplate) throw new InboxError("NOT_RETRYABLE", "This template message cannot be resent.", STATUS_CODES.CONFLICT);
      return this.run({ ...base }, "template", async () => {
        const { message, created } = await store.createPendingOutbound({
          ...base,
          text: original.textBody,
          phoneNumberId: this.deps.getConfig().phoneNumberId,
          messageType: "template",
          payload: { template: t, ...(replyTo ? { replyTo } : {}) },
        });
        return { message, created, action: () => sender.sendTemplate!(base.contactWaId, { name: t.name, language: t.language, bodyParams: t.params ?? [], ...(t.paramNames ? { paramNames: t.paramNames } : {}) }, replyTo ? { replyTo } : undefined) };
      });
    }

    if (["image", "video", "audio", "document"].includes(type)) {
      const media = mediaOf(type, payload);
      if (!media?.id || !sender.sendMedia) throw new InboxError("NOT_RETRYABLE", "The file was not uploaded, so it cannot be resent. Attach it again.", STATUS_CODES.CONFLICT);
      return this.run({ ...base }, "free-form", async () => {
        const { message, created } = await store.createPendingOutbound({
          ...base,
          text: original.textBody,
          phoneNumberId: this.deps.getConfig().phoneNumberId,
          messageType: type,
          payload: { media: { ...payload.media }, ...(replyTo ? { replyTo } : {}) },
        });
        return {
          message,
          created,
          action: () => sender.sendMedia!(base.contactWaId, { kind: media.kind as MediaKind, mediaId: media.id as string, caption: media.caption ?? undefined, filename: media.kind === "document" ? (media.filename ?? undefined) : undefined }, replyTo ? { replyTo } : undefined),
        };
      });
    }

    if (!original.textBody) throw new InboxError("NOT_RETRYABLE", "This message has no text to resend.", STATUS_CODES.CONFLICT);
    return this.run({ ...base }, "free-form", async () => {
      const { message, created } = await store.createPendingOutbound({
        ...base,
        text: original.textBody,
        phoneNumberId: this.deps.getConfig().phoneNumberId,
        messageType: "text",
        ...(replyTo ? { payload: { replyTo } } : {}),
      });
      return { message, created, action: () => sender.sendText(base.contactWaId, original.textBody as string, replyTo ? { replyTo } : undefined) };
    });
  }

  // ─── shared pipeline ───────────────────────────────────────────────────────
  /**
   * 1. A repeat of an earlier request just reports that request's state.
   * 2. Sending must be enabled; free-form needs an open 24h window; templates outside it need opt-in; withdrawn blocks all.
   * 3. The row is saved as SENDING BEFORE WhatsApp is called, then the outcome is recorded.
   */
  private async run(
    input: Base,
    mode: "free-form" | "template",
    prepare: (replyTo: string | undefined) => Promise<{ message: StoredMessage; created: boolean; action: Action }>,
  ): Promise<SendResult> {
    const { store } = this.deps;
    const config = this.deps.getConfig();

    const existing = await store.findByClientRequestId(input.clientRequestId);
    if (existing) return this.existingResult(existing, input.contactWaId);

    if (!outboundReady(config)) throw notConfigured();
    await this.assertAllowed(input.contactWaId, mode);

    let replyTo: string | undefined;
    if (input.replyToMessageId) {
      replyTo = (await store.waMessageIdOf(input.replyToMessageId, input.contactWaId)) ?? undefined;
      if (!replyTo) throw replyUnavailable();
    }

    const { message, created, action } = await prepare(replyTo);
    if (!created) return this.existingResult(message, input.contactWaId);
    return { message: await this.deliver(message, action), created: true };
  }

  private async existingResult(existing: StoredMessage, contactWaId: string): Promise<SendResult> {
    if (existing.contactWaId !== contactWaId) {
      throw new InboxError("CONFLICT", "This request id was already used for a different conversation.", STATUS_CODES.CONFLICT);
    }
    return { message: await this.deps.store.toDto(existing, this.now()), created: false };
  }

  private async consentState(contactWaId: string): Promise<"granted" | "withdrawn" | "unknown"> {
    const guard = this.deps.consent;
    if (!guard) return "unknown";
    try {
      return await guard.check(contactWaId);
    } catch (err) {
      logger.error(`[Inbox] Consent check failed: ${errorKind(err)}`);
      throw consentCheckFailed();
    }
  }

  private async assertAllowed(contactWaId: string, mode: "free-form" | "template"): Promise<void> {
    const contact = await this.deps.store.getContact(contactWaId, this.now());
    const windowOpen = contact?.windowOpen === true;
    if (mode === "free-form" && !contact) throw new InboxError("NO_CONVERSATION", "Conversation not found.", STATUS_CODES.NOT_FOUND);
    // A customer who opted out is reported first: it matters more than the window.
    const consent = await this.consentState(contactWaId);
    if (consent === "withdrawn") throw consentWithdrawn();
    if (mode === "free-form" && !windowOpen) throw windowClosed();
    // Business-initiated (outside the customer's 24h window): WhatsApp requires the customer's opt-in.
    if (mode === "template" && !windowOpen && consent !== "granted") throw optInRequired();
  }

  /** Calls WhatsApp for an already-persisted SENDING row and records the outcome. */
  private async deliver(row: StoredMessage, action: Action): Promise<InboxMessage> {
    const { store } = this.deps;
    let saved: StoredMessage;
    try {
      const { waMessageId } = await action();
      try {
        saved = await store.markSent(row.id, waMessageId, this.now());
      } catch (err) {
        // WhatsApp accepted the message but we could not record it. Leave the row SENDING (it shows as
        // "unconfirmed" after a short time) and never resend automatically.
        logger.error(`[Inbox] Message accepted by WhatsApp but recording failed: ${errorKind(err)}`);
        saved = row;
      }
    } catch (err) {
      const failure = describeSendFailure(err);
      // Log the failure class only: never the text, the number or the response body.
      logger.warn(`[Inbox] Send failed: ${failure.ambiguous ? "unconfirmed" : "rejected"}${failure.code ? ` (code ${failure.code})` : ""}`);
      try {
        saved = await store.markFailed(row.id, failure, this.now());
      } catch (dbErr) {
        logger.error(`[Inbox] Could not record a failed send: ${errorKind(dbErr)}`);
        saved = row;
      }
    }
    return store.toDto(saved, this.now());
  }
}

const errorKind = (err: unknown): string =>
  err instanceof Error ? `${err.name}${(err as { code?: string }).code ? ` (${(err as { code?: string }).code})` : ""}` : "unknown error";
