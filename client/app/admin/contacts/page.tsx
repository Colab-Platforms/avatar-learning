"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Mail,
  MailOpen,
  Trash2,
  RefreshCw,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  fetchAdminContacts,
  markContactRead,
  deleteContact,
  type AdminContact,
} from "@/lib/adminApi";
import type { PaginatedResponse } from "@/lib/coursesApi";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminContactsPage() {
  const [data, setData] = useState<PaginatedResponse<AdminContact> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminContact | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetchAdminContacts(p, PAGE_SIZE);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const handleMarkRead = async (contact: AdminContact) => {
    if (contact.isRead) return;
    setActioning(contact.id);
    try {
      await markContactRead(contact.id);
      setData((prev) =>
        prev
          ? { ...prev, data: prev.data.map((c) => c.id === contact.id ? { ...c, isRead: true } : c) }
          : prev
      );
      if (selected?.id === contact.id) setSelected({ ...contact, isRead: true });
    } finally {
      setActioning(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    setActioning(id);
    try {
      await deleteContact(id);
      setData((prev) =>
        prev ? { ...prev, data: prev.data.filter((c) => c.id !== id) } : prev
      );
      if (selected?.id === id) setSelected(null);
    } finally {
      setActioning(null);
    }
  };

  const handleSelect = async (contact: AdminContact) => {
    setSelected(contact);
    if (!contact.isRead) await handleMarkRead(contact);
  };

  const contacts = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.totalRecords / PAGE_SIZE) : 1;
  const unread = contacts.filter((c) => !c.isRead).length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Contact Messages</h1>
            {unread > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500/15 text-brand-400 border border-brand-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                {unread} unread
              </span>
            )}
          </div>
          <p className="text-sm text-white/40 mt-0.5">{data?.totalRecords ?? 0} total messages</p>
        </div>
        <button
          onClick={() => load(page)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/6 border border-white/8 text-sm text-white/60 hover:text-white/80 hover:bg-white/8 transition-all disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">
        <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Inbox</p>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-ink-700/40 animate-pulse" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox size={32} className="mx-auto text-white/15 mb-3" />
              <p className="text-sm text-white/35">No messages yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/4 max-h-[600px] overflow-y-auto">
              {contacts.map((c) => {
                const isSelected = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-white/3 flex items-start gap-3 ${
                      isSelected ? "bg-brand-500/8 border-l-2 border-l-brand-400" : ""
                    }`}
                  >
                    <div className="mt-1 shrink-0">
                      {c.isRead
                        ? <MailOpen size={15} className="text-white/25" />
                        : <Mail size={15} className="text-brand-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-semibold truncate ${c.isRead ? "text-white/50" : "text-white/90"}`}>
                          {c.name}
                        </p>
                        <span className="text-[10px] text-white/25 shrink-0">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${c.isRead ? "text-white/30" : "text-white/55 font-medium"}`}>
                        {c.subject}
                      </p>
                      <p className="text-[11px] text-white/25 truncate mt-0.5">{c.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span className="text-xs text-white/30">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 disabled:opacity-30 transition-colors"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>

        {selected ? (
          <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-white/90 break-words">{selected.subject}</h2>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="text-xs text-white/50 font-medium">{selected.name}</span>
                  <span className="text-white/20">·</span>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    {selected.email}
                  </a>
                  <span className="text-white/20">·</span>
                  <span className="text-xs text-white/30">{timeAgo(selected.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!selected.isRead && (
                  <button
                    onClick={() => handleMarkRead(selected)}
                    disabled={actioning === selected.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-xs text-white/50 hover:text-white/80 hover:bg-white/8 transition-all disabled:opacity-40"
                  >
                    <MailOpen size={12} /> Mark read
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selected.id)}
                  disabled={actioning === selected.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/8 border border-red-500/15 text-xs text-red-400 hover:bg-red-500/15 transition-all disabled:opacity-40"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
            </div>

            <div className="px-6 pb-5">
              <a
                href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-ink-950 text-xs font-semibold hover:bg-brand-400 transition-colors"
              >
                <Mail size={13} /> Reply via email
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-ink-800 border border-white/6 rounded-2xl py-24 flex flex-col items-center justify-center text-center">
            <Mail size={36} className="text-white/10 mb-4" />
            <p className="text-sm text-white/30 font-medium">Select a message to read it</p>
            <p className="text-xs text-white/20 mt-1">Click any item from the inbox on the left</p>
          </div>
        )}
      </div>
    </div>
  );
}