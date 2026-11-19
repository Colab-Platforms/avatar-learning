"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Inbox } from "lucide-react";
import { fetchAdoptionDemoRequests, updateAdoptionDemoRequest, apiErrorText, type AdminDemoRequest, type AdminDemoStatus } from "@/lib/adoptionAdminApi";

const STATUSES: { id: AdminDemoStatus; label: string }[] = [
  { id: "SUBMITTED", label: "Submitted" },
  { id: "UNDER_REVIEW", label: "Under review" },
  { id: "SCHEDULED", label: "Scheduled" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
];
const NAMES: Record<string, string> = { CRM: "CRM", OMS: "OMS", SCRIPT_AUTOMATION: "Script Automation", LMS: "LMS", RECRUITMENT_CRM: "Recruitment CRM", HRMS: "HRMS", IMS: "IMS", CUSTOM: "Custom Tools" };
const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
// <input type="datetime-local"> wants local time without a zone.
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function Row({ r, onSaved }: { r: AdminDemoRequest; onSaved: (r: AdminDemoRequest) => void }) {
  const [status, setStatus] = useState<AdminDemoStatus>(r.status);
  const [when, setWhen] = useState(toLocalInput(r.scheduledAt));
  const [note, setNote] = useState(r.adminNote ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dirty = status !== r.status || when !== toLocalInput(r.scheduledAt) || note !== (r.adminNote ?? "");

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      onSaved(await updateAdoptionDemoRequest(r.id, { status, scheduledAt: when ? new Date(when).toISOString() : null, adminNote: note.trim() || null }));
    } catch (e) {
      setError(apiErrorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="px-4 py-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm text-white/90">
            <span className="font-semibold">{r.name}</span> <span className="text-white/40">({r.email})</span>
            {r.user ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/25">AI Adoption account</span> : <span className="ml-2 text-[10px] text-white/30">not signed in</span>}
          </p>
          <p className="text-xs text-white/45 mt-0.5">
            {r.role} · {r.companySize}
            {r.company ? ` · ${r.company}` : ""}
            {r.phone ? ` · ${r.phone}` : ""}
          </p>
          <p className="text-xs text-brand-300 mt-1">{r.tools.map((t) => NAMES[t] ?? t).join(", ")}</p>
          {r.customRequirement && <p className="text-xs text-white/50 mt-0.5">Custom: {r.customRequirement}</p>}
          {r.message && <p className="text-xs text-white/40 mt-0.5">“{r.message}”</p>}
        </div>
        <span className="text-[11px] text-white/30 shrink-0">{fmt(r.createdAt)}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end">
        <label className="text-[11px] text-white/40 flex flex-col gap-1">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as AdminDemoStatus)} className="h-9 rounded-lg bg-ink-700 border border-white/10 px-2 text-sm text-white/85 focus:outline-none focus:border-brand-400">
            {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-white/40 flex flex-col gap-1">
          Demo date &amp; time {status === "SCHEDULED" && <span className="text-amber-300/80">(required)</span>}
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="h-9 rounded-lg bg-ink-700 border border-white/10 px-2 text-sm text-white/85 focus:outline-none focus:border-brand-400 [color-scheme:dark]" />
        </label>
        <label className="text-[11px] text-white/40 flex flex-col gap-1">
          Internal note (not shown to the customer)
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} className="h-9 rounded-lg bg-ink-700 border border-white/10 px-2 text-sm text-white/85 focus:outline-none focus:border-brand-400" />
        </label>
        <button type="button" onClick={save} disabled={busy || !dirty} className="h-9 px-4 rounded-lg text-sm font-semibold bg-brand-500/90 text-white hover:bg-brand-500 disabled:opacity-30 disabled:cursor-not-allowed">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </li>
  );
}

/** Admin list of AI Adoption demo requests: set status and the confirmed demo time (shown to signed-in customers). */
export function DemoRequestsAdmin() {
  const [filter, setFilter] = useState<AdminDemoStatus | "">("");
  const [items, setItems] = useState<AdminDemoRequest[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setItems(null);
    try {
      setItems(await fetchAdoptionDemoRequests(filter || undefined));
    } catch (e) {
      setError(apiErrorText(e));
    }
  }, [filter]);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Demo requests</p>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value as AdminDemoStatus | "")} aria-label="Filter by status" className="h-8 rounded-lg bg-ink-700 border border-white/10 px-2 text-xs text-white/80">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button onClick={load} className="text-white/40 hover:text-white/70" aria-label="Refresh demo requests"><RefreshCw size={14} /></button>
        </div>
      </div>
      {error ? (
        <p className="p-4 text-sm text-red-300">Couldn&apos;t load demo requests: {error}</p>
      ) : items === null ? (
        <div className="p-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-ink-700/40 animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="py-14 text-center"><Inbox size={28} className="mx-auto text-white/15 mb-2" /><p className="text-sm text-white/35">No demo requests{filter ? " with this status" : " yet"}.</p></div>
      ) : (
        <ul className="divide-y divide-white/5">
          {items.map((r) => (
            <Row key={r.id} r={r} onSaved={(u) => setItems((list) => list?.map((x) => (x.id === u.id ? u : x)) ?? null)} />
          ))}
        </ul>
      )}
    </div>
  );
}
