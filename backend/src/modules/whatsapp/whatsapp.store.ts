import type { Prisma } from "@prisma/client";
import type {
  InboundMessageEvent,
  InboundSaveResult,
  MessageState,
  StatusApplyResult,
  StatusEvent,
  WhatsappStore,
} from "./whatsapp.types.js";
import { EMPTY_STATE, nextMessageState } from "./whatsapp.status.js";
import { ADOPT_WINDOW_MS, AMBIGUOUS_MARKER, PENDING_PREFIX } from "./whatsapp.pending.js";

/** The slice of the Prisma client this store uses (lets tests inject a fake). */
export interface WhatsappPrismaClient {
  whatsappMessage: {
    findUnique(args: { where: { waMessageId: string } }): Promise<StoredMessage | null>;
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
    /** Optional: used to attach a late status to an outbound row saved without a WhatsApp id. Absent = feature off. */
    findMany?(args: any): Promise<Array<{ id: string; waMessageId: string; status: string; errorDetails: string | null }>>;
    updateMany?(args: any): Promise<{ count: number }>;
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
  constructor(
    private readonly db: WhatsappPrismaClient,
    /** Injectable so the 15-minute attribution window is testable. */
    private readonly clock: () => Date = () => new Date(),
  ) {}

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

  /**
   * Oldest-first attribution: statuses arrive in send order, so the oldest unresolved pending message to this recipient
   * (inside the window) is the one this status is about. Only rows we KNOW are unresolved qualify: still SENDING, or
   * FAILED because the outcome was unknown. A definite rejection (e.g. outside the 24h window) is never adopted.
   */
  private async adoptPendingOutbound(event: StatusEvent, now: Date = this.clock()): Promise<StatusApplyResult | null> {
    const msg = this.db.whatsappMessage;
    if (!msg.findMany || !msg.updateMany || !event.recipientId || event.recipientId === "unknown") return null;
    const candidates = await msg.findMany({
      where: {
        contactWaId: event.recipientId,
        direction: "OUTBOUND",
        status: { in: ["SENDING", "FAILED"] },
        createdAt: { gte: new Date(now.getTime() - ADOPT_WINDOW_MS) },
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    const row = candidates.find((r) => r.waMessageId.startsWith(PENDING_PREFIX) && (r.status === "SENDING" || r.errorDetails === AMBIGUOUS_MARKER));
    if (!row) return null;
    // Start from a clean slate: this status replaces the unknown-outcome failure (clears the error and its marker).
    const next = nextMessageState({ status: "SENDING", ...EMPTY_STATE }, event);
    if (!next) return null; // unsupported status (e.g. deleted)
    // Guarded on the placeholder id so two concurrent statuses cannot both claim the same row.
    const { count } = await msg.updateMany({ where: { id: row.id, waMessageId: row.waMessageId }, data: { waMessageId: event.waMessageId, ...stateToColumns(next) } });
    return count === 1 ? "applied" : null;
  }

  async applyStatusEvent(event: StatusEvent, retried = false): Promise<StatusApplyResult> {
    const existing = await this.db.whatsappMessage.findUnique({ where: { waMessageId: event.waMessageId } });
    const next = nextMessageState(existing, event);
    if (!next) return existing ? "duplicate" : "ignored";

    if (existing) {
      await this.db.whatsappMessage.update({ where: { id: existing.id }, data: stateToColumns(next) });
      return "applied";
    }

    // A status for a message we have no row for. If the inbox saved an outbound message to this recipient that never
    // learned its WhatsApp id (timeout / unrecorded id), this status belongs to it: attach it instead of creating a
    // second, text-less message.
    try {
      const adopted = await this.adoptPendingOutbound(event);
      if (adopted) return adopted;
    } catch (err) {
      // A concurrent delivery already attached this id: fall through, the create below hits the unique id and re-evaluates.
      if (!isUniqueViolation(err)) throw err;
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
