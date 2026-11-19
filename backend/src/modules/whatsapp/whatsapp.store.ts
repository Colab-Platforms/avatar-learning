import type { Prisma } from "@prisma/client";
import type {
  InboundMessageEvent,
  InboundSaveResult,
  MessageState,
  StatusApplyResult,
  StatusEvent,
  WhatsappStore,
} from "./whatsapp.types.js";
import { nextMessageState } from "./whatsapp.status.js";

/** The slice of the Prisma client this store uses (lets tests inject a fake). */
export interface WhatsappPrismaClient {
  whatsappMessage: {
    findUnique(args: { where: { waMessageId: string } }): Promise<StoredMessage | null>;
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  };
}

type StoredMessage = MessageState & { id: string };

const isUniqueViolation = (err: unknown): boolean =>
  typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";

const stateToColumns = (s: MessageState) => ({
  status: s.status,
  sentAt: s.sentAt,
  deliveredAt: s.deliveredAt,
  readAt: s.readAt,
  failedAt: s.failedAt,
  errorCode: s.errorCode,
  errorTitle: s.errorTitle,
  errorDetails: s.errorDetails,
});

/**
 * Prisma-backed store. Idempotency comes from the unique `wa_message_id` column:
 * a duplicate inbound delivery hits P2002 and is reported as "duplicate", and
 * status updates go through the monotonic state machine so replays are no-ops.
 */
export class PrismaWhatsappStore implements WhatsappStore {
  constructor(private readonly db: WhatsappPrismaClient) {}

  async saveInboundMessage(event: InboundMessageEvent): Promise<InboundSaveResult> {
    try {
      await this.db.whatsappMessage.create({
        data: {
          waMessageId: event.waMessageId,
          direction: "INBOUND",
          status: "RECEIVED",
          contactWaId: event.from,
          contactName: event.contactName ?? null,
          phoneNumberId: event.phoneNumberId ?? null,
          messageType: event.type,
          textBody: event.textBody ?? null,
          messageTimestamp: event.timestamp ?? null,
          payload: event.raw as Prisma.InputJsonValue,
        },
      });
      return "created";
    } catch (err) {
      if (isUniqueViolation(err)) return "duplicate";
      throw err;
    }
  }

  async applyStatusEvent(event: StatusEvent, retried = false): Promise<StatusApplyResult> {
    const existing = await this.db.whatsappMessage.findUnique({ where: { waMessageId: event.waMessageId } });
    const next = nextMessageState(existing, event);
    if (!next) return existing ? "duplicate" : "ignored";

    if (existing) {
      await this.db.whatsappMessage.update({ where: { id: existing.id }, data: stateToColumns(next) });
      return "applied";
    }

    // First sight of a message we did not record (e.g. sent by another system): store it as OUTBOUND.
    try {
      await this.db.whatsappMessage.create({
        data: {
          waMessageId: event.waMessageId,
          direction: "OUTBOUND",
          contactWaId: event.recipientId,
          phoneNumberId: event.phoneNumberId ?? null,
          ...stateToColumns(next),
        },
      });
      return "applied";
    } catch (err) {
      // A concurrent delivery created it first — re-evaluate once against the stored row.
      if (isUniqueViolation(err) && !retried) return this.applyStatusEvent(event, true);
      throw err;
    }
  }
}
