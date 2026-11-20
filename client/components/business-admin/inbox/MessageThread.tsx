"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowDown, ArrowLeft, Check, CheckCheck, ChevronDown, Clock, Copy, FileText, FlaskConical, Info, Loader2, MessageCircle, Reply, Search, X } from "lucide-react";
import {
  apiErrorCode,
  describeApiError,
  fetchMessages,
  markConversationRead,
  retryMessage,
  searchMessages,
  sendMedia,
  sendMessage,
  type ContactDetail,
  type ContactRecord,
  type InboxMessage,
  type MessageState,
} from "@/lib/businessAdminApi";
import {
  dayLabel,
  decideScroll,
  displayName,
  isLocal,
  isNearBottom,
  localMessage,
  mergeThread,
  newClientRequestId,
  statusView,
  timelineRows,
  type LocalMessage,
  type ThreadMessage,
} from "@/lib/inboxLogic";
import { debounce } from "@/lib/inboxLogic";
import { formatWhen } from "../ui";
import { Composer, type PendingAttachment } from "./Composer";
import { MediaView } from "./MediaViews";
import { TemplatePicker } from "./TemplatePicker";

const POLL_MS = 8_000;

function Tick({ state }: { state: MessageState }) {
  // Colours come from the shared status tokens (business-theme.css) so ticks match the pills in both themes.
  const base = "inline-block shrink-0";
  switch (state) {
    case "read":
      return <CheckCheck size={14} className={`${base} ba-tick--read`} aria-hidden />;
    case "delivered":
      return <CheckCheck size={14} className={`${base} ba-tick--delivered`} aria-hidden />;
    case "sent":
    case "accepted":
      return <Check size={14} className={`${base} ba-tick--sent`} aria-hidden />;
    case "simulated":
      return <FlaskConical size={13} className={`${base} ba-tick--simulated`} aria-hidden />;
    case "failed":
    case "unconfirmed":
      return <AlertCircle size={14} className={`${base} ba-tick--failed`} aria-hidden />;
    case "sending":
      return <Clock size={14} className={`${base} ba-tick--sending`} aria-hidden />;
    default:
      return null;
  }
}

/** A message being uploaded or waiting to be sent from this browser. */
interface LocalExtra {
  attachment?: PendingAttachment;
  progress?: number;
  abort?: AbortController;
}

function Quote({ reply, onJump }: { reply: NonNullable<InboxMessage["replyTo"]>; onJump?: () => void }) {
  const label = reply.direction === "OUTBOUND" ? "You" : reply.direction === "INBOUND" ? "Customer" : "Earlier message";
  return (
    <button type="button" onClick={onJump} disabled={!reply.id} className="mb-1.5 block w-full rounded-md border-l-4 border-brand-400/70 bg-black/10 px-2.5 py-1 text-left text-xs disabled:cursor-default" data-testid="quote">
      <span className="block font-bold">{label}</span>
      <span className="ba-bubble-meta block truncate">{reply.id ? (reply.text ?? `[${reply.kind}]`) : "Not available in this inbox"}</span>
    </button>
  );
}

function Bubble({
  m,
  extra,
  busy,
  highlight,
  onReply,
  onRetryServer,
  onRetryLocal,
  onDismissLocal,
  onJump,
  onCancelUpload,
}: {
  m: ThreadMessage;
  extra?: LocalExtra;
  busy: boolean;
  highlight: boolean;
  onReply: (m: InboxMessage) => void;
  onRetryServer: (id: string) => void;
  onRetryLocal: (m: LocalMessage) => void;
  onDismissLocal: (m: LocalMessage) => void;
  onJump: (id: string) => void;
  onCancelUpload: (m: LocalMessage) => void;
}) {
  const out = m.direction === "OUTBOUND";
  const local = isLocal(m) ? m : null;
  const failed = m.state === "failed" || m.state === "unconfirmed" || !!local?.localError;
  const reason = local?.localError ?? m.error?.title ?? (m.state === "unconfirmed" ? "WhatsApp did not confirm this message. Check the conversation before sending again." : null);
  const [menu, setMenu] = useState(false);
  const [details, setDetails] = useState(false);
  const uploading = !!local && !local.localError && extra?.attachment !== undefined && local.state === "sending";
  const copyable = m.text ?? m.media?.caption ?? null;
  const view = statusView({ state: local?.localError ? "failed" : m.state, simulated: local ? false : (m as InboxMessage).simulated });

  return (
    <div className={`group flex ${out ? "justify-end" : "justify-start"}`} data-state={m.state} data-testid="message" data-kind={m.kind} data-id={m.id} id={`msg-${m.id}`}>
      <div className={`ba-bubble relative max-w-[88%] text-sm sm:max-w-[72%] ${highlight ? "ring-2 ring-brand-400" : ""} ${failed ? "ba-bubble--fail" : out ? "ba-bubble--out" : "ba-bubble--in"} ${view.simulated && !failed ? "ba-bubble--sim" : ""}`} data-direction={m.direction} data-simulated={view.simulated ? "true" : undefined}>
        {!local && (
          <div className="absolute -top-2 right-1 z-10">
            <button type="button" aria-label="Message actions" aria-expanded={menu} onClick={() => setMenu((v) => !v)} className="rounded-full bg-ink-800 p-1 text-white/60 opacity-0 shadow transition-opacity hover:text-white focus:opacity-100 group-hover:opacity-100 max-md:opacity-70">
              <ChevronDown size={14} />
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 top-6 w-36 overflow-hidden rounded-lg border border-white/10 bg-ink-800 py-1 text-xs shadow-xl">
                <button type="button" role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-white/80 hover:bg-white/8" onClick={() => (setMenu(false), onReply(m as InboxMessage))}><Reply size={13} /> Reply</button>
                {out && (
                  <button type="button" role="menuitem" data-testid="message-details-toggle" className="flex w-full items-center gap-2 px-3 py-2 text-white/80 hover:bg-white/8" onClick={() => (setMenu(false), setDetails((v) => !v))}><Info size={13} /> Message details</button>
                )}
                {copyable && (
                  <button type="button" role="menuitem" className="flex w-full items-center gap-2 px-3 py-2 text-white/80 hover:bg-white/8" onClick={() => (setMenu(false), void navigator.clipboard?.writeText(copyable).catch(() => undefined))}><Copy size={13} /> Copy text</button>
                )}
              </div>
            )}
          </div>
        )}
        {m.replyTo && <Quote reply={m.replyTo} onJump={m.replyTo.id ? () => onJump(m.replyTo!.id as string) : undefined} />}
        {m.template && (
          <p className="ba-tpl-tag mb-1" data-testid="template-tag"><FileText size={11} /> Template · {m.template.name}</p>
        )}
        {m.media && !local && <MediaView messageId={m.id} media={m.media} />}
        {local && extra?.attachment && (
          <div className="flex items-center gap-3" data-testid="upload-row">
            {extra.attachment.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={extra.attachment.previewUrl} alt="" className="h-16 w-16 rounded object-cover" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded bg-white/8 text-white/60"><FileText size={20} /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{extra.attachment.file.name}</p>
              {uploading && (
                <>
                  <div className="mt-1 h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={extra.progress ?? 0} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-brand-400 transition-all" style={{ width: `${extra.progress ?? 0}%` }} />
                  </div>
                  <p className="mt-0.5 text-[10px] text-white/50">{(extra.progress ?? 0) >= 100 ? "Sending to WhatsApp…" : `Uploading ${extra.progress ?? 0}%`}</p>
                </>
              )}
            </div>
            {uploading && <button type="button" onClick={() => onCancelUpload(m as LocalMessage)} aria-label="Cancel upload" className="rounded p-1.5 text-white/60 hover:bg-white/10"><X size={15} /></button>}
          </div>
        )}
        {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
        {m.media?.caption && !local && <p className="mt-1 whitespace-pre-wrap break-words">{m.media.caption}</p>}
        {!m.text && !m.media && !local?.localError && m.kind === "other" && <p className="ba-bubble-meta italic">[{m.type ?? "message"} — content not shown]</p>}
        <div className="ba-bubble-meta mt-1 flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-[11px] font-medium">
          <time dateTime={m.at}>{formatWhen(m.at)}</time>
          {out && m.sentBy && <span>{m.sentBy.name}</span>}
          {out && (
            <span
              className={view.simulated ? "ba-pill ba-pill--simulated" : "inline-flex items-center gap-1"}
              aria-label={`Status: ${view.label}`}
              title={view.help}
              data-testid="message-status"
              data-status={view.state}
            >
              <Tick state={view.state} />
              {view.label}
            </span>
          )}
        </div>
        {details && out && !local && (
          <div className="mt-2 rounded-lg border border-current/25 bg-black/10 p-2.5 text-xs" data-testid="message-details">
            {view.simulated && (
              <p className="mb-2 flex items-center gap-1.5 font-bold uppercase tracking-wide" data-testid="sandbox-banner"><FlaskConical size={13} /> Sandbox: simulated message</p>
            )}
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="font-semibold">Status</dt>
              <dd data-testid="details-status">{view.label}. {view.help}</dd>
              <dt className="font-semibold">Sent via</dt>
              <dd data-testid="details-path">{view.simulated ? "Dev sandbox. No call was made to WhatsApp." : "WhatsApp Cloud API"}</dd>
              {timelineRows(m as InboxMessage).map((r) => (
                <div key={r.label} className="contents" data-testid="details-row">
                  <dt className="font-semibold">{r.label}</dt>
                  <dd>{formatWhen(r.at)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {failed && reason && (
          <div role="alert" className="mt-1.5 text-xs font-medium">
            <p>{reason}</p>
            <div className="mt-1 flex gap-3">
              {local && (
                <>
                  <button type="button" onClick={() => onRetryLocal(local)} className="font-semibold underline underline-offset-2 hover:text-white">Retry</button>
                  <button type="button" onClick={() => onDismissLocal(local)} className="text-amber-200/70 underline underline-offset-2 hover:text-white">Dismiss</button>
                </>
              )}
              {!local && m.canRetry && (
                <button type="button" disabled={busy} onClick={() => onRetryServer(m.id)} className="font-semibold underline underline-offset-2 hover:text-white disabled:opacity-50">
                  {m.error?.ambiguous ? "Send again anyway" : "Retry"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export interface MessageThreadProps {
  waId: string;
  contact: ContactDetail | undefined;
  profile: ContactRecord | null | undefined;
  me: { id: string; name: string } | null;
  outboundReady: boolean | undefined;
  onBack: () => void;
  onShowInfo: () => void;
}

export function MessageThread({ waId, contact, profile, me, outboundReady, onBack, onShowInfo }: MessageThreadProps) {
  const qc = useQueryClient();
  const scroller = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const prev = useRef<{ waId: string | null; lastId: string | null; len: number }>({ waId: null, lastId: null, len: 0 });
  const prepend = useRef<{ height: number; top: number } | null>(null);
  const extras = useRef(new Map<string, LocalExtra>());
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const [older, setOlder] = useState<InboxMessage[]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null | undefined>(undefined);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [locals, setLocals] = useState<LocalMessage[]>([]);
  const [confirmed, setConfirmed] = useState<InboxMessage[]>([]);
  const [newChip, setNewChip] = useState(0);
  const [replyTo, setReplyTo] = useState<InboxMessage | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [highlight, setHighlight] = useState<string | null>(null);
  const [jumped, setJumped] = useState<InboxMessage[]>([]);

  const latest = useQuery({
    queryKey: ["biz-inbox", "messages", waId],
    queryFn: () => fetchMessages(waId, { limit: 50 }),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    setOlder([]);
    setOlderCursor(undefined);
    setLocals([]);
    setConfirmed([]);
    setNewChip(0);
    setReplyTo(null);
    setSearchOpen(false);
    setJumped([]);
    extras.current.clear();
    nearBottom.current = true;
  }, [waId]);

  const messages = useMemo(() => mergeThread([older, jumped, confirmed, latest.data?.items ?? []], locals), [older, jumped, latest.data, confirmed, locals]);
  const hasOlder = olderCursor === undefined ? !!latest.data?.hasMore : olderCursor !== null;
  const nextBefore = olderCursor === undefined ? (latest.data?.nextBefore ?? null) : olderCursor;
  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m as InboxMessage])), [messages]);

  const loadOlder = useCallback(async () => {
    if (!nextBefore || loadingOlder) return;
    setLoadingOlder(true);
    const el = scroller.current;
    prepend.current = el ? { height: el.scrollHeight, top: el.scrollTop } : null;
    try {
      const page = await fetchMessages(waId, { limit: 50, before: nextBefore });
      setOlder((o) => [...page.items, ...o]);
      setOlderCursor(page.hasMore ? page.nextBefore : null);
    } catch {
      prepend.current = null;
    } finally {
      setLoadingOlder(false);
    }
  }, [nextBefore, loadingOlder, waId]);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (prepend.current) {
      el.scrollTop = prepend.current.top + (el.scrollHeight - prepend.current.height);
      prepend.current = null;
      prev.current = { waId, lastId: messages[messages.length - 1]?.id ?? null, len: messages.length };
      return;
    }
    const last = messages[messages.length - 1];
    const p = prev.current;
    const conversationChanged = p.waId !== waId;
    let addedAtEnd = 0;
    if (!conversationChanged && last && last.id !== p.lastId) {
      const idx = messages.findIndex((m) => m.id === p.lastId);
      addedAtEnd = idx === -1 ? Math.max(1, messages.length - p.len) : messages.length - 1 - idx;
    }
    const d = decideScroll({ conversationChanged, addedAtEnd, wasNearBottom: nearBottom.current, lastIsOwnLocal: !!last && isLocal(last) && addedAtEnd > 0 });
    if (d.scrollToBottom) {
      el.scrollTop = el.scrollHeight;
      nearBottom.current = true;
      setNewChip(0);
    } else if (d.showNewChip) setNewChip((n) => n + addedAtEnd);
    prev.current = { waId, lastId: last?.id ?? null, len: messages.length };
  }, [messages, waId]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    nearBottom.current = isNearBottom(el);
    if (nearBottom.current) setNewChip(0);
  };

  // Mark as read only when the newest message has actually been on screen.
  const lastMarked = useRef("");
  const unread = contact?.unreadCount ?? 0;
  const markRead = useMutation({
    mutationFn: (upTo: string) => markConversationRead(waId, upTo),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["biz-inbox", "conversations"] });
      void qc.invalidateQueries({ queryKey: ["biz-inbox", "contact", waId] });
    },
  });
  useEffect(() => {
    if (!latest.data || unread === 0 || typeof document === "undefined" || document.visibilityState !== "visible") return;
    if (!nearBottom.current) return;
    const key = `${waId}:${latest.dataUpdatedAt}`;
    if (lastMarked.current === key) return;
    lastMarked.current = key;
    markRead.mutate(new Date(latest.dataUpdatedAt - 1500).toISOString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest.dataUpdatedAt, unread, waId, newChip]);

  // ─── sending ────────────────────────────────────────────────────────────────
  const refreshAll = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["biz-inbox", "messages", waId] });
    void qc.invalidateQueries({ queryKey: ["biz-inbox", "conversations"] });
    void qc.invalidateQueries({ queryKey: ["biz-inbox", "contact", waId] });
  }, [qc, waId]);

  const settle = useCallback(
    (localId: string, serverMessage: InboxMessage) => {
      setConfirmed((c) => [...c, serverMessage]);
      setLocals((l) => l.filter((x) => x.id !== localId));
      extras.current.delete(localId);
      refreshAll();
    },
    [refreshAll],
  );
  const failLocal = useCallback(
    (localId: string, err: unknown) => {
      const code = apiErrorCode(err);
      setLocals((l) => l.map((x) => (x.id === localId ? { ...x, state: "failed", localError: describeApiError(err) } : x)));
      if (code === "WINDOW_CLOSED" || code === "NOT_CONFIGURED" || code === "CONSENT_WITHDRAWN" || code === "OPT_IN_REQUIRED") refreshAll();
    },
    [refreshAll],
  );

  const attempt = useCallback(
    async (local: LocalMessage) => {
      setLocals((l) => l.map((x) => (x.id === local.id ? { ...x, state: "sending", localError: undefined } : x)));
      const ex = extras.current.get(local.id);
      try {
        if (ex?.attachment) {
          const abort = new AbortController();
          ex.abort = abort;
          ex.progress = 0;
          rerender();
          const r = await sendMedia(waId, ex.attachment.file, {
            clientRequestId: local.clientRequestId as string,
            caption: local.text ?? undefined,
            replyToMessageId: local.replyTo?.id ?? undefined,
            signal: abort.signal,
            onProgress: (pct) => {
              ex.progress = pct;
              rerender();
            },
          });
          settle(local.id, r.message);
        } else {
          const r = await sendMessage(waId, local.text as string, local.clientRequestId as string, local.replyTo?.id ?? undefined);
          settle(local.id, r.message);
        }
      } catch (err) {
        if ((err as { code?: string })?.code === "ERR_CANCELED") {
          setLocals((l) => l.filter((x) => x.id !== local.id));
          extras.current.delete(local.id);
          return;
        }
        failLocal(local.id, err);
      }
    },
    [waId, settle, failLocal],
  );

  const stage = useCallback(
    (text: string | null, attachment?: PendingAttachment) => {
      const local = localMessage(text ?? "", newClientRequestId(), me);
      const withReply: LocalMessage = {
        ...local,
        text: text,
        replyTo: replyTo ? { id: replyTo.id, text: replyTo.text ?? replyTo.media?.caption ?? null, kind: replyTo.kind, direction: replyTo.direction } : null,
        ...(attachment ? { kind: attachment.kind, media: { kind: attachment.kind, mimeType: attachment.file.type, filename: attachment.file.name, sizeBytes: attachment.file.size, caption: text, voice: false, available: false } } : {}),
      };
      if (attachment) extras.current.set(withReply.id, { attachment, progress: 0 });
      setLocals((l) => [...l, withReply]);
      setReplyTo(null);
      void attempt(withReply);
    },
    [attempt, me, replyTo],
  );

  const retryServer = useMutation({
    mutationFn: (id: string) => retryMessage(id),
    onSuccess: (r) => {
      setConfirmed((c) => [...c, r.message]);
      refreshAll();
    },
  });

  // ─── search inside the conversation ────────────────────────────────────────
  const pushTerm = useMemo(() => debounce((v: string) => setTerm(v.trim()), 300), []);
  useEffect(() => () => pushTerm.cancel(), [pushTerm]);
  const hits = useQuery({ queryKey: ["biz-inbox", "search", waId, term], queryFn: () => searchMessages(term, waId), enabled: searchOpen && term.length >= 2 });

  const jumpTo = useCallback(
    async (id: string) => {
      if (!byId.has(id)) {
        try {
          const page = await fetchMessages(waId, { limit: 50, until: id });
          setJumped(page.items);
          await new Promise((r) => setTimeout(r, 60));
        } catch {
          return;
        }
      }
      setHighlight(id);
      document.getElementById(`msg-${id}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(() => setHighlight((h) => (h === id ? null : h)), 2500);
    },
    [byId, waId],
  );

  const sending = locals.filter((l) => l.state === "sending" && !l.localError).length;
  const title = profile?.name ?? (contact ? displayName(contact) : `+${waId}`);
  const consentWithdrawn = profile?.optIn.status === "WITHDRAWN";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-white/5 px-3 py-2.5 sm:px-4">
        <button type="button" onClick={onBack} aria-label="Back to conversations" className="rounded-lg p-1.5 text-white/60 hover:bg-white/5 md:hidden">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-white">{title}</p>
          <p className="truncate text-xs text-white/65">
            +{waId}
            {contact?.assignee ? ` · Assigned to ${contact.assignee.name}` : " · Unassigned"}
          </p>
        </div>
        <button type="button" onClick={() => setSearchOpen((v) => !v)} aria-label="Search in conversation" aria-pressed={searchOpen} className={`rounded-lg p-2 hover:bg-white/5 ${searchOpen ? "text-brand-400" : "text-white/60"}`}>
          <Search size={18} />
        </button>
        <button type="button" onClick={onShowInfo} aria-label="Customer details" className="rounded-lg p-2 text-white/60 hover:bg-white/5 xl:hidden">
          <Info size={18} />
        </button>
      </div>

      {searchOpen && (
        <div className="border-b border-white/5 bg-ink-900 px-3 py-2" data-testid="thread-search">
          <input
            autoFocus
            type="search"
            value={search}
            onChange={(e) => (setSearch(e.target.value), pushTerm(e.target.value))}
            placeholder="Search this conversation"
            aria-label="Search this conversation"
            className="w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none"
          />
          {term.length >= 2 && (
            <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto" aria-label="Search results">
              {hits.isLoading && <li className="text-xs text-white/35">Searching…</li>}
              {hits.isError && <li role="alert" className="text-xs text-red-300">{describeApiError(hits.error)}</li>}
              {hits.data?.items.length === 0 && <li className="text-xs text-white/35">No messages found.</li>}
              {hits.data?.items.map((h) => (
                <li key={h.id}>
                  <button type="button" onClick={() => void jumpTo(h.id)} className="w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-white/5">
                    <span className="block text-[10px] text-white/35">{h.direction === "OUTBOUND" ? "You" : "Customer"} · {formatWhen(h.at)}</span>
                    <span className="block truncate text-xs text-white/75">{h.snippet}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div ref={scroller} onScroll={onScroll} className="ba-chat-bg h-full space-y-2 overflow-y-auto px-3 py-4 sm:px-5" data-testid="thread-scroller">
          {latest.isLoading && <p className="ba-chat-chip mx-auto w-fit py-1 text-center text-sm">Loading messages…</p>}
          {latest.isError && !latest.data && (
            <div role="alert" className="mx-auto max-w-sm rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
              <p>{describeApiError(latest.error)}</p>
              <button type="button" onClick={() => void latest.refetch()} className="mt-2 rounded-lg border border-red-400/30 px-3 py-1 text-xs font-semibold hover:bg-red-500/10">Retry</button>
            </div>
          )}
          {hasOlder && (
            <div className="text-center">
              <button type="button" onClick={() => void loadOlder()} disabled={loadingOlder} className="ba-chat-chip hover:opacity-90 disabled:opacity-50">
                {loadingOlder ? <span className="inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Loading…</span> : "Load earlier messages"}
              </button>
            </div>
          )}
          {messages.map((m, i) => {
            const showDay = i === 0 || dayLabel(m.at) !== dayLabel(messages[i - 1].at);
            return (
              <div key={m.id} className="space-y-2">
                {showDay && <p className="py-1 text-center"><span className="ba-chat-chip" data-testid="day-chip">{dayLabel(m.at)}</span></p>}
                <Bubble
                  m={m}
                  extra={extras.current.get(m.id)}
                  busy={retryServer.isPending}
                  highlight={highlight === m.id}
                  onReply={(msg) => setReplyTo(msg)}
                  onRetryServer={(id) => retryServer.mutate(id)}
                  onRetryLocal={(l) => void attempt(l)}
                  onDismissLocal={(l) => (extras.current.delete(l.id), setLocals((ls) => ls.filter((x) => x.id !== l.id)))}
                  onJump={(id) => void jumpTo(id)}
                  onCancelUpload={(l) => extras.current.get(l.id)?.abort?.abort()}
                />
              </div>
            );
          })}
          {retryServer.isError && <p role="alert" className="text-center text-xs text-amber-200">{describeApiError(retryServer.error)}</p>}
          {!latest.isLoading && !latest.isError && messages.length === 0 && (
            <div className="mx-auto mt-10 max-w-sm rounded-2xl bg-[var(--chat-chip-bg)] px-6 py-8 text-center shadow-sm" data-testid="empty-thread">
              <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/15 text-brand-400"><MessageCircle size={28} /></span>
              <p className="text-base font-bold text-[var(--chat-chip-fg)]">No messages yet</p>
              <p className="mt-1 text-sm text-[var(--chat-chip-fg)] opacity-80">Messages from this customer will show here as they arrive. To start the conversation, send an approved template.</p>
            </div>
          )}
        </div>

        {latest.isError && latest.data && (
          <div role="status" className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full border border-amber-400/30 bg-ink-900/95 px-3 py-1 text-[11px] text-amber-200 shadow">
            Connection lost. Showing the last loaded messages and retrying…
          </div>
        )}
        {newChip > 0 && (
          <button
            type="button"
            data-testid="new-messages-chip"
            onClick={() => {
              const el = scroller.current;
              if (el) el.scrollTop = el.scrollHeight;
              nearBottom.current = true;
              setNewChip(0);
            }}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-brand-600"
          >
            <ArrowDown size={13} /> {newChip} new message{newChip > 1 ? "s" : ""}
          </button>
        )}
      </div>

      <Composer
        onSendText={(t) => stage(t)}
        onSendFile={(a, caption) => stage(caption || null, a)}
        outboundReady={outboundReady}
        windowOpen={contact?.windowOpen}
        windowExpiresAt={contact?.windowExpiresAt}
        sending={sending}
        replyTo={replyTo ? { label: replyTo.direction === "OUTBOUND" ? "yourself" : title, ref: { text: replyTo.text ?? replyTo.media?.caption ?? null, kind: replyTo.kind } } : null}
        onCancelReply={() => setReplyTo(null)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        consentWithdrawn={consentWithdrawn}
      />

      {templatesOpen && (
        <TemplatePicker
          waId={waId}
          contactName={title}
          onClose={() => setTemplatesOpen(false)}
          onSent={(message) => {
            setConfirmed((c) => [...c, message]);
            refreshAll();
            setTemplatesOpen(false);
          }}
        />
      )}
    </div>
  );
}
