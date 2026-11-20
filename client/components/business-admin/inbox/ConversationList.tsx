"use client";

import { Check, CheckCheck, Clock, AlertCircle, FlaskConical, FileText, Image as ImageIcon, Mic, Paperclip, Search, Video } from "lucide-react";
import type { InboxConversation, InboxFilter, PersonRef } from "@/lib/businessAdminApi";
import { displayName, initials, previewText, shortTime, unreadBadge } from "@/lib/inboxLogic";

const FILTERS: { id: InboxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "mine", label: "Mine" },
  { id: "unassigned", label: "Unassigned" },
];

function KindIcon({ kind }: { kind: string }) {
  const cls = "inline-block shrink-0 text-white/40";
  switch (kind) {
    case "image":
    case "sticker":
      return <ImageIcon size={12} className={cls} aria-hidden />;
    case "video":
      return <Video size={12} className={cls} aria-hidden />;
    case "audio":
      return <Mic size={12} className={cls} aria-hidden />;
    case "document":
      return <Paperclip size={12} className={cls} aria-hidden />;
    case "template":
      return <FileText size={12} className={cls} aria-hidden />;
    default:
      return null;
  }
}

function StateTick({ c }: { c: InboxConversation }) {
  if (c.lastDirection !== "OUTBOUND") return null;
  const cls = "inline-block shrink-0";
  switch (c.lastState) {
    case "simulated":
      return <FlaskConical size={13} className={`${cls} ba-tick--simulated`} aria-label="Simulated (sandbox, not sent to WhatsApp)" />;
    case "accepted":
      return <Check size={13} className={`${cls} text-white/40`} aria-label="Accepted by WhatsApp API, not confirmed" />;
    case "read":
      return <CheckCheck size={13} className={`${cls} text-sky-400`} aria-label="Read" />;
    case "delivered":
      return <CheckCheck size={13} className={`${cls} text-white/40`} aria-label="Delivered" />;
    case "sent":
      return <Check size={13} className={`${cls} text-white/40`} aria-label="Sent" />;
    case "failed":
    case "unconfirmed":
      return <AlertCircle size={13} className={`${cls} text-amber-400`} aria-label="Failed" />;
    default:
      return <Clock size={13} className={`${cls} text-white/40`} aria-label="Sending" />;
  }
}

export interface ConversationListProps {
  items: InboxConversation[];
  total: number;
  unreadTotal: number;
  selected: string | null;
  loading: boolean;
  fetchingMore: boolean;
  hasMore: boolean;
  filter: InboxFilter;
  search: string;
  assignee: string;
  team: PersonRef[];
  onFilter: (f: InboxFilter) => void;
  onSearch: (s: string) => void;
  onAssignee: (id: string) => void;
  onSelect: (waId: string) => void;
  onLoadMore: () => void;
}

export function ConversationList(p: ConversationListProps) {
  const filtered = p.filter !== "all" || p.search.trim() !== "" || p.assignee !== "";
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2.5 border-b border-white/5 p-3">
        <label className="relative block">
          <span className="sr-only">Search conversations by name or number</span>
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="search"
            value={p.search}
            onChange={(e) => p.onSearch(e.target.value)}
            placeholder="Search name or number"
            className="w-full rounded-lg border border-white/8 bg-ink-950/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none"
          />
        </label>
        <div role="tablist" aria-label="Filter conversations" className="flex gap-1 overflow-x-auto">
          {FILTERS.map((f) => {
            const active = p.filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => p.onFilter(f.id)}
                className="ba-chip shrink-0 transition-colors hover:opacity-90"
              >
                {f.label}
                {f.id === "unread" && p.unreadTotal > 0 && (
                  <span className="ml-1.5 ba-badge rounded-full px-1.5 py-px text-[10px] font-bold">{unreadBadge(p.unreadTotal)}</span>
                )}
              </button>
            );
          })}
        </div>
        <select
          value={p.assignee}
          onChange={(e) => p.onAssignee(e.target.value)}
          aria-label="Filter by team member"
          className="w-full rounded-lg border border-white/8 bg-ink-950/60 px-3 py-1.5 text-xs text-white/70 focus:border-brand-500/50 focus:outline-none"
        >
          <option value="">Any team member</option>
          {p.team.map((m) => (
            <option key={m.id} value={m.id}>
              Assigned to {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {p.loading && (
          <ul aria-label="Loading conversations" className="divide-y divide-white/5">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex gap-3 px-4 py-3">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/6" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/5 animate-pulse rounded bg-white/6" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-white/4" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!p.loading && p.items.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-white/40">
            {filtered ? (
              <>
                <p className="font-medium text-white/60">No conversations match</p>
                <p className="mt-1 text-xs">Try a different search or filter.</p>
              </>
            ) : (
              <>
                <p className="font-medium text-white/60">No WhatsApp conversations yet</p>
                <p className="mt-1 text-xs">When a customer messages your WhatsApp number and the webhook is connected, it appears here.</p>
              </>
            )}
          </div>
        )}

        {p.items.length > 0 && (
          <ul aria-label="Conversations" className="divide-y divide-white/5">
            {p.items.map((c) => {
              const name = displayName(c);
              const active = p.selected === c.contactWaId;
              return (
                <li key={c.contactWaId}>
                  <button
                    type="button"
                    onClick={() => p.onSelect(c.contactWaId)}
                    aria-current={active ? "true" : undefined}
                    data-unread={c.unreadCount > 0 ? "true" : undefined}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-white/4 ${active ? "ba-selected" : ""}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-500/60 to-elec-500/60 text-xs font-bold text-white">
                      {initials(name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${c.unreadCount > 0 ? "font-bold text-white" : "font-medium text-white/85"}`}>{name}</span>
                        <span className="shrink-0 text-[10px] text-white/35">{shortTime(c.lastMessageAt)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <StateTick c={c} />
                        <KindIcon kind={c.lastKind} />
                        <span className={`min-w-0 flex-1 truncate text-xs ${c.unreadCount > 0 ? "text-white/70" : "text-white/40"}`}>
                          {c.lastDirection === "OUTBOUND" ? "You: " : ""}
                          {previewText(c)}
                        </span>
                        {c.unreadCount > 0 && (
                          <span aria-label={`${c.unreadCount} unread`} className="shrink-0 ba-badge rounded-full px-1.5 py-px text-[10px] font-bold">
                            {unreadBadge(c.unreadCount)}
                          </span>
                        )}
                      </span>
                      {c.assignee && <span className="mt-1 inline-block max-w-full truncate rounded bg-white/5 px-1.5 py-px text-[10px] text-white/45">{c.assignee.name}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {p.hasMore && (
          <div className="p-3">
            <button
              type="button"
              onClick={p.onLoadMore}
              disabled={p.fetchingMore}
              className="w-full rounded-lg border border-white/8 py-2 text-xs font-semibold text-white/60 hover:bg-white/4 disabled:opacity-50"
            >
              {p.fetchingMore ? "Loading…" : `Load more (${p.items.length} of ${p.total})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
