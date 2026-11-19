"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, UserRound, Inbox, History } from "lucide-react";
import {
  fetchAdoptionUsers,
  fetchAdoptionUser,
  setAdoptionAccess,
  removeAdoptionAccess,
  fetchAdoptionRequests,
  declineAdoptionRequest,
  apiErrorText,
  type AdminAdoptionUserRow,
  type AdminAdoptionTool,
  type AdminAccessEvent,
  type AdminAccessRequest,
  type AdminAccessStatus,
  type AdminToolStatus,
} from "@/lib/adoptionAdminApi";
import { DemoRequestsAdmin } from "./DemoRequestsAdmin";

const STATUS_STYLE: Record<AdminToolStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  PENDING_SETUP: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  SUSPENDED: "bg-red-500/10 text-red-300 border-red-500/25",
  EXPIRED: "bg-white/5 text-white/50 border-white/15",
  NO_ACCESS: "bg-transparent text-white/30 border-white/10",
};
const STATUS_LABEL: Record<AdminToolStatus, string> = {
  ACTIVE: "Active",
  PENDING_SETUP: "Pending setup",
  SUSPENDED: "Suspended",
  EXPIRED: "Expired",
  NO_ACCESS: "No access",
};
const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const toDateInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

function StatusPill({ status }: { status: AdminToolStatus }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}

/** One editable row per tool for the selected customer. */
function ToolRow({ userId, tool, onSaved }: { userId: string; tool: AdminAdoptionTool; onSaved: (tools: AdminAdoptionTool[]) => void }) {
  const stored: AdminAccessStatus | "NONE" = tool.status === "NO_ACCESS" ? "NONE" : tool.status === "EXPIRED" ? "ACTIVE" : tool.status;
  const [status, setStatus] = useState<AdminAccessStatus | "NONE">(stored);
  const [expires, setExpires] = useState(toDateInput(tool.expiresAt));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus(stored);
    setExpires(toDateInput(tool.expiresAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.status, tool.expiresAt]);

  const dirty = status !== stored || expires !== toDateInput(tool.expiresAt) || note.trim() !== "";

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      if (status === "NONE") {
        if (tool.status === "NO_ACCESS") return;
        if (!confirm(`Remove ${tool.name} access for this customer?`)) return;
        onSaved(await removeAdoptionAccess(userId, tool.product));
      } else {
        // Expiry is the end of the chosen day (local time).
        const expiresAt = expires ? new Date(`${expires}T23:59:59`).toISOString() : null;
        onSaved(await setAdoptionAccess(userId, tool.product, { status, expiresAt, note: note.trim() || undefined }));
      }
      setNote("");
    } catch (e) {
      setError(apiErrorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_1fr_1.2fr_auto] md:items-center px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white/90">{tool.name}</span>
          <StatusPill status={tool.status} />
        </div>
        <div className="text-[11px] text-white/35 mt-0.5">
          {tool.configured ? "Tool link configured" : "Tool link not configured"}
          {tool.requestedAt && <span className="text-amber-300/80"> · requested {fmt(tool.requestedAt)}</span>}
        </div>
      </div>
      <label className="text-[11px] text-white/40 flex flex-col gap-1">
        Access
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AdminAccessStatus | "NONE")}
          className="h-9 rounded-lg bg-ink-700 border border-white/10 px-2 text-sm text-white/85 focus:outline-none focus:border-brand-400"
        >
          <option value="NONE">No access</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_SETUP">Pending setup</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </label>
      <label className="text-[11px] text-white/40 flex flex-col gap-1">
        Expires (optional)
        <input
          type="date"
          value={expires}
          disabled={status === "NONE"}
          onChange={(e) => setExpires(e.target.value)}
          className="h-9 rounded-lg bg-ink-700 border border-white/10 px-2 text-sm text-white/85 focus:outline-none focus:border-brand-400 disabled:opacity-40 [color-scheme:dark]"
        />
      </label>
      <label className="text-[11px] text-white/40 flex flex-col gap-1">
        Note (optional)
        <input
          value={note}
          disabled={status === "NONE"}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="e.g. Annual plan, invoice #123"
          className="h-9 rounded-lg bg-ink-700 border border-white/10 px-2 text-sm text-white/85 placeholder:text-white/20 focus:outline-none focus:border-brand-400 disabled:opacity-40"
        />
      </label>
      <div className="flex flex-col gap-1 md:items-end">
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="h-9 px-4 rounded-lg text-sm font-semibold bg-brand-500/90 text-white hover:bg-brand-500 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="md:col-span-5 text-xs text-red-300">{error}</p>}
    </div>
  );
}

export default function AdminAdoptionAccessPage() {
  const [tab, setTab] = useState<"users" | "requests" | "demos">("users");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [list, setList] = useState<{ total: number; users: AdminAdoptionUserRow[] } | null>(null);
  const [listError, setListError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchAdoptionUser>> | null>(null);
  const [detailError, setDetailError] = useState("");
  const [requests, setRequests] = useState<AdminAccessRequest[] | null>(null);
  const [requestsError, setRequestsError] = useState("");

  const loadList = useCallback(async (q: string) => {
    setListError("");
    setList(null);
    try {
      setList(await fetchAdoptionUsers(q));
    } catch (e) {
      setListError(apiErrorText(e));
    }
  }, []);
  const loadDetail = useCallback(async (id: string) => {
    setDetailError("");
    setDetail(null);
    try {
      setDetail(await fetchAdoptionUser(id));
    } catch (e) {
      setDetailError(apiErrorText(e));
    }
  }, []);
  const loadRequests = useCallback(async () => {
    setRequestsError("");
    setRequests(null);
    try {
      setRequests(await fetchAdoptionRequests("PENDING"));
    } catch (e) {
      setRequestsError(apiErrorText(e));
    }
  }, []);

  useEffect(() => {
    void loadList(query);
  }, [loadList, query]);
  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
  }, [selectedId, loadDetail]);
  useEffect(() => {
    if (tab === "requests") void loadRequests();
  }, [tab, loadRequests]);

  const onSaved = (tools: AdminAdoptionTool[]) => {
    if (selectedId) void loadDetail(selectedId); // refresh history too
    if (detail) setDetail({ ...detail, tools });
    void loadList(query);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Adoption Access</h1>
          <p className="text-sm text-white/40 mt-0.5">Assign tools to AI Adoption customers. Customers can&apos;t change their own access.</p>
        </div>
        <div className="flex gap-2">
          {(["users", "requests", "demos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm border transition-all ${tab === t ? "bg-brand-500/15 border-brand-500/30 text-brand-300" : "bg-white/6 border-white/8 text-white/60 hover:text-white/80"}`}
            >
              {t === "users" ? "Customers" : t === "requests" ? "Access requests" : "Demo requests"}
            </button>
          ))}
        </div>
      </div>

      {tab === "demos" ? (
        <DemoRequestsAdmin />
      ) : tab === "requests" ? (
        <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Pending requests</p>
            <button onClick={loadRequests} className="text-white/40 hover:text-white/70" aria-label="Refresh requests"><RefreshCw size={14} /></button>
          </div>
          {requestsError ? (
            <p className="p-4 text-sm text-red-300">Couldn&apos;t load requests: {requestsError}</p>
          ) : requests === null ? (
            <div className="p-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-ink-700/40 animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <div className="py-14 text-center"><Inbox size={28} className="mx-auto text-white/15 mb-2" /><p className="text-sm text-white/35">No pending requests.</p></div>
          ) : (
            <ul className="divide-y divide-white/5">
              {requests.map((r) => (
                <li key={r.id} className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm text-white/85"><span className="font-semibold">{r.user?.fullName}</span> <span className="text-white/40">({r.user?.email})</span> wants <span className="font-semibold text-brand-300">{r.product.replace(/_/g, " ")}</span></p>
                    <p className="text-[11px] text-white/35">{fmt(r.createdAt)}{r.message ? ` · “${r.message}”` : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setTab("users"); setSelectedId(r.user!.id); }}
                      className="h-8 px-3 rounded-lg text-xs font-semibold bg-brand-500/90 text-white hover:bg-brand-500"
                    >
                      Review &amp; assign
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Decline this request?")) return;
                        try { await declineAdoptionRequest(r.id); void loadRequests(); } catch (e) { alert(apiErrorText(e)); }
                      }}
                      className="h-8 px-3 rounded-lg text-xs border border-white/10 text-white/60 hover:text-white/85"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">
          <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
            <form
              onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }}
              className="p-3 border-b border-white/5 flex gap-2"
            >
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or email"
                  aria-label="Search customers"
                  className="w-full h-9 rounded-lg bg-ink-700 border border-white/10 pl-8 pr-2 text-sm text-white/85 placeholder:text-white/25 focus:outline-none focus:border-brand-400"
                />
              </div>
              <button className="h-9 px-3 rounded-lg text-sm bg-white/6 border border-white/8 text-white/70 hover:text-white">Search</button>
            </form>
            {listError ? (
              <p className="p-4 text-sm text-red-300">Couldn&apos;t load customers: {listError}</p>
            ) : list === null ? (
              <div className="p-4 space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-ink-700/40 animate-pulse" />)}</div>
            ) : list.users.length === 0 ? (
              <div className="py-14 text-center"><UserRound size={28} className="mx-auto text-white/15 mb-2" /><p className="text-sm text-white/35">{query ? "No customers match." : "No AI Adoption customers yet."}</p></div>
            ) : (
              <ul className="divide-y divide-white/4 max-h-[640px] overflow-y-auto">
                {list.users.map((u) => (
                  <li key={u.id}>
                    <button
                      onClick={() => setSelectedId(u.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-white/3 ${selectedId === u.id ? "bg-brand-500/8 border-l-2 border-l-brand-400" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white/85 truncate">{u.fullName}</p>
                        {u.pendingRequests > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">{u.pendingRequests} request{u.pendingRequests > 1 ? "s" : ""}</span>}
                      </div>
                      <p className="text-[11px] text-white/35 truncate">{u.email}{u.emailVerified ? "" : " · unverified"}</p>
                      <p className="text-[11px] text-white/45 mt-0.5">{u.activeTools.length ? `Active: ${u.activeTools.map((t) => t.replace(/_/g, " ")).join(", ")}` : "No active tools"}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {list && <p className="px-4 py-2 text-[11px] text-white/30 border-t border-white/5">{list.total} customer{list.total === 1 ? "" : "s"}</p>}
          </div>

          <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden min-h-[300px]">
            {!selectedId ? (
              <div className="py-24 text-center"><UserRound size={32} className="mx-auto text-white/15 mb-3" /><p className="text-sm text-white/35">Select a customer to manage their tools.</p></div>
            ) : detailError ? (
              <p className="p-6 text-sm text-red-300">Couldn&apos;t load this customer: {detailError}</p>
            ) : !detail ? (
              <div className="p-6 space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-ink-700/40 animate-pulse" />)}</div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-white/5">
                  <p className="text-lg font-semibold text-white">{detail.user.fullName}</p>
                  <p className="text-xs text-white/40">{detail.user.email} · joined {fmt(detail.user.createdAt)}{detail.user.emailVerified ? "" : " · email not verified"}</p>
                </div>
                <div className="divide-y divide-white/5">
                  {detail.tools.map((t) => (
                    <ToolRow key={t.product} userId={detail.user.id} tool={t} onSaved={onSaved} />
                  ))}
                </div>
                <div className="px-5 py-4 border-t border-white/5">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-2 mb-3"><History size={13} /> Access history</p>
                  {detail.history.length === 0 ? (
                    <p className="text-sm text-white/30">No changes yet.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {detail.history.map((h: AdminAccessEvent) => (
                        <li key={h.id} className="text-xs text-white/55">
                          <span className="text-white/35">{fmt(h.createdAt)}</span> · <span className="font-semibold text-white/75">{h.product.replace(/_/g, " ")}</span>{" "}
                          {h.action === "REVOKED"
                            ? "access removed"
                            : h.action === "GRANTED"
                              ? `granted as ${STATUS_LABEL[h.toStatus!]}`
                              : `${h.fromStatus ? STATUS_LABEL[h.fromStatus] : "—"} → ${h.toStatus ? STATUS_LABEL[h.toStatus] : "—"}`}
                          {h.expiresAt && ` (expires ${new Date(h.expiresAt).toLocaleDateString("en-IN")})`}
                          {h.note && <span className="text-white/40"> · “{h.note}”</span>}
                          {h.actorEmail && <span className="text-white/30"> · by {h.actorEmail}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
