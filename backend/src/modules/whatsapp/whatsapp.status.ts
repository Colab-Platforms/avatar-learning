import type { MessageState, StatusEvent, WhatsappMessageStatusValue } from "./whatsapp.types.js";

/**
 * Meta does not guarantee ordering (a `read` can arrive before `delivered`) and
 * retries deliveries, so status handling is a monotonic state machine:
 * a message never moves backwards, late timestamps are still filled in, and an
 * event that changes nothing is reported as a duplicate.
 *
 * Rank: RECEIVED < SENT < FAILED < DELIVERED < READ.
 * `failed` after `delivered`/`read` is impossible in practice, so it is ignored;
 * a late `sent` after `failed` must not resurrect the message.
 */
const RANK: Record<WhatsappMessageStatusValue, number> = {
  RECEIVED: 0,
  SENT: 1,
  FAILED: 2,
  DELIVERED: 3,
  READ: 4,
};

const MAP: Record<string, WhatsappMessageStatusValue | undefined> = {
  sent: "SENT",
  delivered: "DELIVERED",
  read: "READ",
  failed: "FAILED",
};

export function mapMetaStatus(status: string): WhatsappMessageStatusValue | null {
  return MAP[status.toLowerCase()] ?? null;
}

export const EMPTY_STATE: Omit<MessageState, "status"> = {
  sentAt: null,
  deliveredAt: null,
  readAt: null,
  failedAt: null,
  errorCode: null,
  errorTitle: null,
  errorDetails: null,
};

/**
 * @returns the new state, or `null` when the event changes nothing
 * (duplicate / out-of-date) or the status is unsupported (e.g. `deleted`).
 */
export function nextMessageState(
  current: MessageState | null,
  event: StatusEvent,
  now: Date = new Date(),
): MessageState | null {
  const incoming = mapMetaStatus(event.status);
  if (!incoming) return null;

  const at = event.timestamp ?? now;
  const base: MessageState = current ?? { status: incoming, ...EMPTY_STATE };
  const next: MessageState = { ...base };
  let changed = current === null;

  const fill = <K extends keyof MessageState>(key: K, value: MessageState[K]) => {
    if (next[key] === null && value !== null) {
      next[key] = value;
      changed = true;
    }
  };

  if (incoming === "FAILED" && current && RANK[current.status] >= RANK.DELIVERED) return null;

  switch (incoming) {
    case "SENT":
      fill("sentAt", at);
      break;
    case "DELIVERED":
      fill("deliveredAt", at);
      break;
    case "READ":
      fill("readAt", at);
      break;
    case "FAILED":
      fill("failedAt", at);
      fill("errorCode", event.error?.code ?? null);
      fill("errorTitle", event.error?.title ?? null);
      fill("errorDetails", event.error?.details ?? null);
      break;
  }

  if (RANK[incoming] > RANK[next.status]) {
    next.status = incoming;
    changed = true;
  }

  return changed ? next : null;
}
