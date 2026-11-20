import { PENDING_PREFIX } from "@/modules/whatsapp/whatsapp.pending.js";
import { mediaOf, replyTargetOf } from "@/modules/whatsapp/whatsapp.media.js";
import { businessAdminEmails } from "./business-admin.access.js";
import {
  PREVIEW_LENGTH,
  decodeCursor,
  displayName,
  encodeCursor,
  isUnread,
  kindOf,
  personRef,
  replyRefOf,
  planConversationList,
  retryKeyFor,
  toMessageDto,
  windowState,
  type ContactAggregate,
  type ConversationState,
} from "./inbox.plan.js";
import type {
  ContactDetail,
  ConversationEvent,
  ConversationList,
  FailureInfo,
  InboxConversation,
  InboxMessage,
  InboxStore,
  ListParams,
  MessagePage,
  PendingOutboundInput,
  PersonRef,
  ReplyRef,
  SearchHit,
  StoredMessage,
} from "./inbox.types.js";

/** The slice of the Prisma client this store uses (lets tests inject a fake). */
export interface InboxDb {
  whatsappMessage: {
    count(args?: any): Promise<number>;
    findFirst(args?: any): Promise<any | null>;
    findUnique(args: any): Promise<any | null>;
    findMany(args?: any): Promise<any[]>;
    groupBy(args: any): Promise<any[]>;
    create(args: any): Promise<any>;
    update(args: any): Promise<any>;
    updateMany(args: any): Promise<{ count: number }>;
    delete(args: any): Promise<any>;
  };
  whatsappConversation: {
    findMany(args?: any): Promise<any[]>;
    findUnique(args: any): Promise<any | null>;
    upsert(args: any): Promise<any>;
  };
  whatsappConversationEvent: {
    create(args: any): Promise<any>;
    findMany(args?: any): Promise<any[]>;
  };
  user: {
    findMany(args?: any): Promise<any[]>;
  };
  /** Optional so in-memory test databases without permissions keep working. */
  businessAdminAccess?: {
    findMany(args?: any): Promise<any[]>;
  };
  $transaction<T>(fn: (tx: InboxDb) => Promise<T>): Promise<T>;
}

const isUnique = (err: unknown) => typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";

export class PrismaInboxStore implements InboxStore {
  constructor(
    private readonly db: InboxDb,
    private readonly env: Record<string, string | undefined> = process.env,
    /** Injectable so time-dependent rules (24h window, read markers) are testable. */
    private readonly clock: () => Date = () => new Date(),
    /** `sandbox: true` only for the in-memory dev sandbox. Every outbound message it holds is then reported as simulated. */
    private readonly options: { sandbox?: boolean } = {},
  ) {}

  // ─── users ────────────────────────────────────────────────────────────────
  private async namesFor(ids: Array<string | null | undefined>): Promise<Map<string, string>> {
    const unique = [...new Set(ids.filter((i): i is string => !!i))];
    const map = new Map<string, string>();
    if (unique.length === 0) return map;
    const users = await this.db.user.findMany({ where: { id: { in: unique } }, select: { id: true, firstName: true, lastName: true, email: true } });
    for (const u of users) map.set(u.id, displayName(u));
    return map;
  }

  async teamMembers(): Promise<PersonRef[]> {
    const emails = businessAdminEmails(this.env);
    const or: any[] = [{ userRoleMappings: { some: { role: { name: { in: ["SUPERADMIN", "SUPER_ADMIN"] } } } } }];
    // Admins a Super Admin granted the Inbox module to.
    const granted = this.db.businessAdminAccess ? await this.db.businessAdminAccess.findMany({ where: { modules: { has: "inbox" } }, select: { userId: true }, take: 500 }) : [];
    if (granted.length > 0) {
      or.push({ AND: [{ userRoleMappings: { some: { role: { name: "ADMIN" } } } }, { id: { in: granted.map((g: any) => g.userId) } }] });
    }
    if (emails.length > 0) {
      or.push({
        AND: [
          { userRoleMappings: { some: { role: { name: "ADMIN" } } } },
          { OR: emails.map((e) => ({ email: { equals: e, mode: "insensitive" } })) },
        ],
      });
    }
    const users = await this.db.user.findMany({
      where: { isDeleted: false, isActive: true, OR: or },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 200,
    });
    return users.map((u: any) => ({ id: u.id, name: displayName(u) })).sort((a: PersonRef, b: PersonRef) => a.name.localeCompare(b.name));
  }

  // ─── conversation list ────────────────────────────────────────────────────
  /** One pass over message aggregates per contact (not per message). Fine for thousands of contacts; see docs for scaling. */
  private async aggregates(): Promise<ContactAggregate[]> {
    const m = this.db.whatsappMessage;
    const [all, inbound, named] = await Promise.all([
      m.groupBy({ by: ["contactWaId"], _count: { _all: true }, _max: { createdAt: true } }),
      m.groupBy({ by: ["contactWaId"], where: { direction: "INBOUND" }, _max: { createdAt: true } }),
      m.groupBy({ by: ["contactWaId", "contactName"], where: { contactName: { not: null } } }),
    ]);
    const lastInbound = new Map<string, Date>(inbound.map((r) => [r.contactWaId, r._max.createdAt]));
    const names = new Map<string, string[]>();
    for (const r of named) names.set(r.contactWaId, [...(names.get(r.contactWaId) ?? []), r.contactName]);
    return all.map((r) => ({
      contactWaId: r.contactWaId,
      messageCount: r._count._all,
      lastAt: r._max.createdAt,
      lastInboundAt: lastInbound.get(r.contactWaId) ?? null,
      names: names.get(r.contactWaId) ?? [],
    }));
  }

  private async states(): Promise<Map<string, ConversationState>> {
    const rows = await this.db.whatsappConversation.findMany({ select: { contactWaId: true, assignedToUserId: true, lastReadAt: true } });
    return new Map(rows.map((r) => [r.contactWaId, { contactWaId: r.contactWaId, assignedToUserId: r.assignedToUserId, lastReadAt: r.lastReadAt }]));
  }

  private unreadCountFor(contactWaId: string, lastReadAt: Date | null): Promise<number> {
    return this.db.whatsappMessage.count({
      where: { contactWaId, direction: "INBOUND", ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}) },
    });
  }

  async listConversations(params: ListParams, now: Date = this.clock()): Promise<ConversationList> {
    const [contacts, states] = await Promise.all([this.aggregates(), this.states()]);
    const { pageContacts, total, unreadTotal } = planConversationList({ contacts, states, ...params });

    const assigneeNames = await this.namesFor(pageContacts.map((c) => states.get(c.contactWaId)?.assignedToUserId));
    const items = await Promise.all(
      pageContacts.map(async (c): Promise<InboxConversation> => {
        const st = states.get(c.contactWaId);
        const [last, unreadCount] = await Promise.all([
          this.db.whatsappMessage.findFirst({ where: { contactWaId: c.contactWaId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
          isUnread(c, st) ? this.unreadCountFor(c.contactWaId, st?.lastReadAt ?? null) : Promise.resolve(0),
        ]);
        const dto = last ? toMessageDto(last, { now, names: new Map(), retriedIds: new Set(), sandbox: this.options.sandbox }) : null;
        const win = windowState(c.lastInboundAt, now);
        const text: string | null = last?.textBody ?? mediaOf(last?.messageType ?? null, last?.payload)?.caption ?? null;
        return {
          contactWaId: c.contactWaId,
          // Latest profile name seen for this contact.
          contactName: c.names.length > 0 ? c.names[c.names.length - 1] : null,
          messageCount: c.messageCount,
          unreadCount,
          lastMessageAt: dto?.at ?? c.lastAt.toISOString(),
          lastDirection: last?.direction ?? "INBOUND",
          lastState: dto?.state ?? "received",
          lastMessageType: last?.messageType ?? null,
          lastKind: last ? kindOf(last.messageType, last.payload) : "text",
          lastPreview: text ? text.slice(0, PREVIEW_LENGTH) : null,
          assignee: personRef(st?.assignedToUserId, assigneeNames),
          windowOpen: win.open,
          windowExpiresAt: win.expiresAt?.toISOString() ?? null,
        };
      }),
    );
    return { items, total, unreadTotal };
  }

  // ─── single conversation ──────────────────────────────────────────────────
  async getContact(contactWaId: string, now: Date = this.clock()): Promise<ContactDetail | null> {
    const m = this.db.whatsappMessage;
    const [messageCount, firstMsg, lastInbound, named, conv] = await Promise.all([
      m.count({ where: { contactWaId } }),
      m.findFirst({ where: { contactWaId }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
      m.findFirst({ where: { contactWaId, direction: "INBOUND" }, orderBy: { createdAt: "desc" }, select: { createdAt: true, messageTimestamp: true } }),
      m.findFirst({ where: { contactWaId, contactName: { not: null } }, orderBy: { createdAt: "desc" }, select: { contactName: true } }),
      this.db.whatsappConversation.findUnique({ where: { contactWaId } }),
    ]);
    if (messageCount === 0) return null;
    // The 24h window runs from the customer's own message time when WhatsApp gave us one.
    const lastInboundAt: Date | null = lastInbound ? (lastInbound.messageTimestamp ?? lastInbound.createdAt) : null;
    const win = windowState(lastInboundAt, now);
    const names = await this.namesFor([conv?.assignedToUserId]);
    return {
      contactWaId,
      contactName: named?.contactName ?? null,
      messageCount,
      unreadCount: await this.unreadCountFor(contactWaId, conv?.lastReadAt ?? null),
      firstMessageAt: firstMsg?.createdAt?.toISOString() ?? null,
      lastInboundAt: lastInboundAt?.toISOString() ?? null,
      assignee: personRef(conv?.assignedToUserId, names),
      assignedAt: conv?.assignedAt?.toISOString() ?? null,
      lastReadAt: conv?.lastReadAt?.toISOString() ?? null,
      windowOpen: win.open,
      windowExpiresAt: win.expiresAt?.toISOString() ?? null,
    };
  }

  // ─── messages ─────────────────────────────────────────────────────────────
  /** Resolves the messages these rows quote (by wamid) so replies can show what they answer. */
  private async repliesFor(rows: Array<{ payload?: unknown }>): Promise<Map<string, ReplyRef>> {
    const wamids = [...new Set(rows.map((r) => replyTargetOf(r.payload)).filter((x): x is string => !!x))];
    const map = new Map<string, ReplyRef>();
    if (wamids.length === 0) return map;
    const quoted = await this.db.whatsappMessage.findMany({ where: { waMessageId: { in: wamids } }, take: wamids.length });
    for (const q of quoted) map.set(q.waMessageId, replyRefOf(q));
    return map;
  }

  async toDto(message: StoredMessage, now: Date = this.clock()): Promise<InboxMessage> {
    const [names, retried, replies] = await Promise.all([
      this.namesFor([message.sentByUserId]),
      message.status === "FAILED" ? this.db.whatsappMessage.findUnique({ where: { clientRequestId: retryKeyFor(message.id) } }) : Promise.resolve(null),
      this.repliesFor([message]),
    ]);
    return toMessageDto(message, { now, names, retriedIds: new Set(retried ? [message.id] : []), replies, sandbox: this.options.sandbox });
  }

  /** The wamid of one of this contact's messages (used to quote it); null if unknown or still pending. */
  async waMessageIdOf(id: string, contactWaId: string): Promise<string | null> {
    const m = await this.db.whatsappMessage.findUnique({ where: { id } });
    if (!m || m.contactWaId !== contactWaId || String(m.waMessageId).startsWith(PENDING_PREFIX)) return null;
    return m.waMessageId;
  }

  async listMessages(contactWaId: string, opts: { limit: number; before?: string; until?: string }, now: Date = this.clock()): Promise<MessagePage> {
    let cursor = opts.before ? decodeCursor(opts.before) : null;
    if (!cursor && opts.until) {
      // Jump to a message (search result): the page ends at that message, inclusive.
      const target = await this.db.whatsappMessage.findUnique({ where: { id: opts.until } });
      if (target && target.contactWaId === contactWaId) cursor = { createdAt: new Date(target.createdAt.getTime() + 1), id: "z".repeat(25) };
    }
    const where: any = { contactWaId };
    if (cursor) where.OR = [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }];
    const rows = await this.db.whatsappMessage.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: opts.limit + 1,
    });
    const hasMore = rows.length > opts.limit;
    const page = rows.slice(0, opts.limit);

    const failedIds = page.filter((r) => r.status === "FAILED").map((r) => retryKeyFor(r.id));
    const [names, retried, replies] = await Promise.all([
      this.namesFor(page.map((r) => r.sentByUserId)),
      failedIds.length > 0
        ? this.db.whatsappMessage.findMany({ where: { clientRequestId: { in: failedIds } }, select: { clientRequestId: true } })
        : Promise.resolve([] as any[]),
      this.repliesFor(page),
    ]);
    const retriedIds = new Set<string>(retried.map((r) => String(r.clientRequestId).slice("retry-of:".length)));
    const last = page[page.length - 1];
    return {
      items: page.map((r) => toMessageDto(r, { now, names, retriedIds, replies, sandbox: this.options.sandbox })).reverse(),
      hasMore,
      nextBefore: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
  }

  /** Case-insensitive text/caption search. Plain substring match (no index): fine for the current volume, see docs. */
  async searchMessages(q: string, opts: { contactWaId?: string; limit: number }): Promise<SearchHit[]> {
    const term = q.trim();
    if (term.length < 2) return [];
    const rows = await this.db.whatsappMessage.findMany({
      where: { textBody: { contains: term, mode: "insensitive" }, ...(opts.contactWaId ? { contactWaId: opts.contactWaId } : {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: opts.limit,
    });
    const named = rows.length
      ? await this.db.whatsappMessage.findMany({ where: { contactWaId: { in: [...new Set(rows.map((r) => r.contactWaId))] }, contactName: { not: null } }, orderBy: { createdAt: "desc" }, take: 200 })
      : [];
    const names = new Map<string, string>();
    for (const n of named) if (!names.has(n.contactWaId)) names.set(n.contactWaId, n.contactName);
    const lower = term.toLowerCase();
    return rows.map((r) => {
      const text = String(r.textBody ?? "");
      const i = Math.max(0, text.toLowerCase().indexOf(lower));
      const start = Math.max(0, i - 40);
      return {
        id: r.id,
        contactWaId: r.contactWaId,
        contactName: names.get(r.contactWaId) ?? null,
        direction: r.direction,
        snippet: (start > 0 ? "…" : "") + text.slice(start, start + 140) + (start + 140 < text.length ? "…" : ""),
        at: (r.messageTimestamp ?? r.createdAt).toISOString(),
      };
    });
  }

  // ─── read / assignment / notes ────────────────────────────────────────────
  async markRead(contactWaId: string, userId: string, upTo: Date | undefined, now: Date = this.clock()): Promise<{ lastReadAt: string }> {
    const requested = upTo && upTo.getTime() < now.getTime() ? upTo : now;
    const existing = await this.db.whatsappConversation.findUnique({ where: { contactWaId } });
    // Never move the marker backwards.
    const at = existing?.lastReadAt && existing.lastReadAt.getTime() > requested.getTime() ? existing.lastReadAt : requested;
    await this.db.whatsappConversation.upsert({
      where: { contactWaId },
      create: { contactWaId, lastReadAt: at, lastReadByUserId: userId },
      update: { lastReadAt: at, lastReadByUserId: userId },
    });
    return { lastReadAt: at.toISOString() };
  }

  async assign(contactWaId: string, assigneeId: string | null, byUserId: string, now: Date = this.clock()): Promise<{ changed: boolean }> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.whatsappConversation.findUnique({ where: { contactWaId } });
      const previous: string | null = existing?.assignedToUserId ?? null;
      if (previous === assigneeId) return { changed: false };
      await tx.whatsappConversation.upsert({
        where: { contactWaId },
        create: { contactWaId, assignedToUserId: assigneeId, assignedAt: assigneeId ? now : null },
        update: { assignedToUserId: assigneeId, assignedAt: assigneeId ? now : null },
      });
      await tx.whatsappConversationEvent.create({
        data: {
          contactWaId,
          type: assigneeId ? "ASSIGNED" : "UNASSIGNED",
          authorUserId: byUserId,
          // For UNASSIGNED we keep who it was taken from.
          assigneeUserId: assigneeId ?? previous,
        },
      });
      return { changed: true };
    });
  }

  private async eventDto(row: any, names: Map<string, string>): Promise<ConversationEvent> {
    return {
      id: row.id,
      type: row.type,
      body: row.body ?? null,
      author: personRef(row.authorUserId, names),
      assignee: personRef(row.assigneeUserId, names),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listEvents(contactWaId: string): Promise<ConversationEvent[]> {
    const rows = await this.db.whatsappConversationEvent.findMany({ where: { contactWaId }, orderBy: { createdAt: "desc" }, take: 200 });
    const names = await this.namesFor(rows.flatMap((r) => [r.authorUserId, r.assigneeUserId]));
    return Promise.all(rows.map((r) => this.eventDto(r, names)));
  }

  async addNote(contactWaId: string, userId: string, body: string): Promise<ConversationEvent> {
    const row = await this.db.whatsappConversationEvent.create({ data: { contactWaId, type: "NOTE", authorUserId: userId, body } });
    return this.eventDto(row, await this.namesFor([userId]));
  }

  // ─── outbound pipeline ────────────────────────────────────────────────────
  getMessage(id: string): Promise<StoredMessage | null> {
    return this.db.whatsappMessage.findUnique({ where: { id } });
  }

  findByClientRequestId(clientRequestId: string): Promise<StoredMessage | null> {
    return this.db.whatsappMessage.findUnique({ where: { clientRequestId } });
  }

  async createPendingOutbound(input: PendingOutboundInput): Promise<{ message: StoredMessage; created: boolean }> {
    const existing = await this.findByClientRequestId(input.clientRequestId);
    if (existing) return { message: existing, created: false };
    try {
      const message = await this.db.whatsappMessage.create({
        data: {
          // wa_message_id is unique and NOT NULL; a placeholder is replaced by the real id in markSent().
          waMessageId: `${PENDING_PREFIX}${input.clientRequestId}`,
          direction: "OUTBOUND",
          status: "SENDING",
          contactWaId: input.contactWaId,
          phoneNumberId: input.phoneNumberId ?? null,
          messageType: input.messageType ?? "text",
          textBody: input.text,
          ...(input.payload ? { payload: input.payload } : {}),
          clientRequestId: input.clientRequestId,
          sentByUserId: input.userId,
        },
      });
      return { message, created: true };
    } catch (err) {
      // A concurrent double-submit created it first: report that row, never a second one.
      if (isUnique(err)) {
        const again = await this.findByClientRequestId(input.clientRequestId);
        if (again) return { message: again, created: false };
      }
      throw err;
    }
  }

  async mergePayload(id: string, patch: Record<string, unknown>): Promise<StoredMessage> {
    const row = await this.db.whatsappMessage.findUnique({ where: { id } });
    const current = row?.payload && typeof row.payload === "object" ? (row.payload as Record<string, unknown>) : {};
    const next: Record<string, unknown> = { ...current };
    for (const [k, v] of Object.entries(patch)) {
      next[k] = v && typeof v === "object" && !Array.isArray(v) && current[k] && typeof current[k] === "object" ? { ...(current[k] as object), ...(v as object) } : v;
    }
    return this.db.whatsappMessage.update({ where: { id }, data: { payload: next } });
  }

  async markSent(id: string, waMessageId: string, now: Date = this.clock()): Promise<StoredMessage> {
    return this.db.$transaction(async (tx) => {
      const mine = await tx.whatsappMessage.findUnique({ where: { id } });
      // A status webhook that arrived while WhatsApp was still answering already attached this id to our row (and may have
      // moved it to delivered/read). Never downgrade it back to SENT.
      if (mine && mine.waMessageId === waMessageId) return mine;
      // Meta's status webhook can beat us here: it then already created a row for this wamid (status-only, no text).
      const raced = await tx.whatsappMessage.findUnique({ where: { waMessageId } });
      if (raced && raced.id !== id) {
        // Keep ONE row: move our metadata onto the webhook-created row (it holds the furthest status) and drop the placeholder.
        await tx.whatsappMessage.delete({ where: { id } });
        return tx.whatsappMessage.update({
          where: { id: raced.id },
          data: {
            messageType: mine?.messageType ?? "text",
            ...(mine?.payload ? { payload: mine.payload } : {}),
            textBody: mine?.textBody ?? raced.textBody,
            clientRequestId: mine?.clientRequestId ?? null,
            sentByUserId: mine?.sentByUserId ?? null,
            // Keep whatever the webhook recorded; the API acceptance is not a WhatsApp 'sent' confirmation.
            sentAt: raced.sentAt ?? null,
          },
        });
      }
      return tx.whatsappMessage.update({
        where: { id },
        // sentAt stays empty on purpose: it is filled by Meta's `sent` status webhook. Until then the message is only
        // 'accepted' by the API. The acceptance time is kept in the payload for the message details.
        data: { waMessageId, status: "SENT", errorCode: null, errorTitle: null, errorDetails: null, failedAt: null, payload: { ...(mine?.payload && typeof mine.payload === "object" ? (mine.payload as object) : {}), acceptedAt: now.toISOString() } },
      });
    });
  }

  async markFailed(id: string, failure: FailureInfo & { ambiguous: boolean }, now: Date = this.clock()): Promise<StoredMessage> {
    // Guarded by status so a late failure can never overwrite SENT/DELIVERED/READ.
    await this.db.whatsappMessage.updateMany({
      where: { id, status: "SENDING" },
      data: { status: "FAILED", failedAt: now, errorCode: failure.code, errorTitle: failure.title, errorDetails: failure.details },
    });
    return (await this.getMessage(id)) as StoredMessage;
  }
}
