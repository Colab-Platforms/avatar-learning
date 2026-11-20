"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { MessageCircle, RefreshCw, UserPlus } from "lucide-react";
import {
  describeApiError,
  fetchBusinessOverview,
  fetchContact,
  fetchContacts,
  fetchConversationProfile,
  fetchConversations,
  fetchTeam,
  type ContactDetail,
  type InboxFilter,
} from "@/lib/businessAdminApi";
import { debounce } from "@/lib/inboxLogic";
import { useBusinessAdmin } from "../BusinessAdminShell";
import { ErrorNote } from "../ui";
import { Modal } from "../admins/AdminDialogs";
import { ContactForm } from "./ContactsTab";
import { ContactPanel } from "./ContactPanel";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";

const LIST_POLL_MS = 15_000;
const PAGE_SIZE = 25;

/** Pick a saved contact (or add one) and open their conversation, even if no message exists yet. */
function StartChatDialog({ onPick, onClose }: { onPick: (waId: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [adding, setAdding] = useState(false);
  const push = useMemo(() => debounce((v: string) => setDq(v.trim()), 250), []);
  useEffect(() => () => push.cancel(), [push]);
  const list = useQuery({ queryKey: ["biz-contacts", "picker", dq], queryFn: () => fetchContacts({ q: dq, pageSize: 20 }), placeholderData: (p) => p });
  if (adding) return <ContactForm contact={null} onClose={() => setAdding(false)} onSaved={(c) => onPick(c.waId)} />;
  const items = list.data?.items ?? [];
  return (
    <Modal title="Start a conversation" label="Start a conversation" onClose={onClose}>
      <input type="search" autoFocus value={q} onChange={(e) => (setQ(e.target.value), push(e.target.value))} placeholder="Search name, email, company or number" aria-label="Search contacts" className="w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none" />
      <ul className="mt-3 max-h-72 divide-y divide-white/6 overflow-y-auto rounded-xl border border-white/8" aria-label="Contacts">
        {list.isLoading && <li className="px-4 py-3 text-sm text-white/40">Loading…</li>}
        {list.isError && <li className="px-4 py-3 text-sm text-red-300">{describeApiError(list.error)}</li>}
        {list.data && items.length === 0 && <li className="px-4 py-3 text-sm text-white/45">No saved contact matches. Add one below.</li>}
        {items.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => onPick(c.waId)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-white/5">
              <span className="min-w-0"><span className="block truncate text-sm font-medium text-white">{c.name}</span><span className="block text-xs text-white/40">+{c.waId}</span></span>
              <MessageCircle size={14} className="shrink-0 text-brand-300" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setAdding(true)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-sm text-white/75 hover:bg-white/5"><UserPlus size={15} /> Add a new contact</button>
    </Modal>
  );
}

const noConversation = (waId: string, name: string | null): ContactDetail => ({
  contactWaId: waId, contactName: name, messageCount: 0, unreadCount: 0, firstMessageAt: null, lastInboundAt: null,
  assignee: null, assignedAt: null, lastReadAt: null, windowOpen: false, windowExpiresAt: null,
});

/** Chats tab: full-bleed WhatsApp workspace (list | thread | customer panel). Only inner panes scroll. */
export function InboxView({ openWaId = null, onOpened }: { openWaId?: string | null; onOpened?: () => void }) {
  const { me, name } = useBusinessAdmin();
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [assignee, setAssignee] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  // A chat requested from the Contacts tab (or the "start a conversation" dialog).
  useEffect(() => {
    if (openWaId) {
      setSelected(openWaId);
      setInfoOpen(false);
      onOpened?.();
    }
  }, [openWaId, onOpened]);

  // One request per pause in typing, not per keystroke.
  const push = useMemo(() => debounce((v: string) => setDebounced(v.trim()), 300), []);
  useEffect(() => () => push.cancel(), [push]);

  const conversations = useInfiniteQuery({
    queryKey: ["biz-inbox", "conversations", filter, assignee, debounced],
    queryFn: ({ pageParam }) => fetchConversations({ filter, assignee: assignee || undefined, q: debounced || undefined }, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    refetchInterval: LIST_POLL_MS,
    refetchIntervalInBackground: false,
  });
  const team = useQuery({ queryKey: ["biz-inbox", "team"], queryFn: fetchTeam, staleTime: 5 * 60_000 });
  const overview = useQuery({ queryKey: ["business-admin", "overview"], queryFn: fetchBusinessOverview, staleTime: 60_000 });
  const contact = useQuery({
    queryKey: ["biz-inbox", "contact", selected],
    queryFn: () => fetchContact(selected as string),
    enabled: !!selected,
    refetchInterval: LIST_POLL_MS,
    refetchIntervalInBackground: false,
  });
  const profile = useQuery({
    queryKey: ["biz-inbox", "profile", selected],
    queryFn: () => fetchConversationProfile(selected as string),
    enabled: !!selected,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const pages = conversations.data?.pages ?? [];
  const items = pages.flatMap((p) => p.items);
  const total = pages[0]?.total ?? 0;
  const unreadTotal = pages[0]?.unreadTotal ?? 0;
  const outboundReady = overview.data ? overview.data.integrations.whatsapp.outboundSending === "ready" : undefined;
  const meRef = useMemo(() => (me.userId ? { id: me.userId, name } : null), [me.userId, name]);
  const connectionLost = conversations.isError && !!conversations.data;

  const select = (waId: string) => {
    setSelected(waId);
    setInfoOpen(false);
  };

  return (
    <div className="flex h-full min-h-[28rem] flex-col" data-testid="inbox-workspace">
      {(connectionLost || (conversations.isError && !conversations.data)) && (
        <div className="shrink-0 border-b border-white/5 p-2">
          <ErrorNote message={connectionLost ? "Connection lost. Showing the last loaded conversations and retrying…" : describeApiError(conversations.error)} onRetry={() => void conversations.refetch()} />
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden bg-ink-900">
        {/* Conversation list: hidden on phones while a thread is open */}
        <aside className={`${selected ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-white/5 md:w-80 md:border-r lg:w-[21rem] 2xl:w-[24rem]`}>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/5 px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-base font-bold tracking-tight text-white">Conversations</h2>
              <p className="truncate text-[11px] text-white/35">{outboundReady === false ? "Receiving only · replies are switched off" : "Replies go from your business number"}</p>
            </div>
            <span className="flex shrink-0 items-center">
              <button type="button" onClick={() => setStarting(true)} aria-label="New chat or add contact" title="New chat / add contact" className="rounded-lg p-2 text-brand-300 hover:bg-brand-500/10">
                <UserPlus size={16} />
              </button>
              <button type="button" onClick={() => void conversations.refetch()} aria-label="Refresh" className="rounded-lg p-2 text-white/60 hover:bg-white/5">
                <RefreshCw size={15} className={conversations.isFetching ? "animate-spin" : ""} />
              </button>
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <ConversationList
              items={items}
              total={total}
              unreadTotal={unreadTotal}
              selected={selected}
              loading={conversations.isLoading}
              fetchingMore={conversations.isFetchingNextPage}
              hasMore={!!conversations.hasNextPage}
              filter={filter}
              search={search}
              assignee={assignee}
              team={team.data?.items ?? []}
              onFilter={setFilter}
              onSearch={(v) => {
                setSearch(v);
                push(v);
              }}
              onAssignee={setAssignee}
              onSelect={select}
              onLoadMore={() => void conversations.fetchNextPage()}
            />
          </div>
        </aside>

        {/* Thread */}
        <section className={`${selected ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
          {selected ? (
            <MessageThread
              key={selected}
              waId={selected}
              contact={contact.data ?? (contact.isError ? noConversation(selected, profile.data?.contact?.name ?? null) : undefined)}
              profile={profile.data?.contact}
              me={meRef}
              outboundReady={outboundReady}
              onBack={() => setSelected(null)}
              onShowInfo={() => setInfoOpen(true)}
            />
          ) : (
            <div className="ba-chat-bg flex h-full items-center justify-center px-6" data-testid="no-selection">
              <div className="max-w-xs rounded-2xl bg-[var(--chat-chip-bg)] px-6 py-8 text-center shadow-sm">
                <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/15 text-brand-400"><MessageCircle size={28} /></span>
                <p className="text-base font-bold text-[var(--chat-chip-fg)]">Select a conversation</p>
                <p className="mt-1 text-sm text-[var(--chat-chip-fg)] opacity-80">Choose a customer on the left to read the conversation and reply.</p>
              </div>
            </div>
          )}
        </section>

        {/* Customer details: a column on wide screens, a slide-over below that */}
        {selected && (
          <>
            <aside className="hidden w-80 shrink-0 border-l border-white/5 xl:flex xl:flex-col 2xl:w-96">
              <ContactPanel key={selected} waId={selected} contact={contact.data} team={team.data?.items ?? []} />
            </aside>
            {infoOpen && (
              <div className="fixed inset-0 z-40 xl:hidden" role="dialog" aria-modal="true" aria-label="Customer details">
                <button type="button" aria-label="Close details" className="absolute inset-0 bg-black/60" onClick={() => setInfoOpen(false)} />
                <aside className="absolute inset-y-0 right-0 w-[22rem] max-w-[92vw] border-l border-white/5 bg-ink-900">
                  <ContactPanel key={selected} waId={selected} contact={contact.data} team={team.data?.items ?? []} onClose={() => setInfoOpen(false)} />
                </aside>
              </div>
            )}
          </>
        )}
      </div>
      {starting && (
        <StartChatDialog
          onClose={() => setStarting(false)}
          onPick={(waId) => {
            setStarting(false);
            select(waId);
          }}
        />
      )}
    </div>
  );
}
