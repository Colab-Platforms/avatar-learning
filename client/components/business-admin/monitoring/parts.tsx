"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, BarChart3, ChevronLeft, ChevronRight, Clock, History, Laptop, LogIn, Search, ShieldAlert, Smartphone, Tablet, Users } from "lucide-react";
import { StatusPill } from "@/components/business-admin/ui";
import { useBusinessAdmin } from "@/components/business-admin/BusinessAdminShell";
import { terminateSession } from "@/lib/monitoringApi";
import { describeApiError } from "@/lib/businessAdminApi";
import { EVENT_FILTER_GROUPS, EVENT_GROUPS, EVENT_LABELS, GROUP_TONE, describeEvent, pageCount, relativeTime, type TimelineEvent } from "@/lib/monitoringLogic";

const BASE = "/admin-adaption/monitoring";

const TABS = [
  { href: BASE, label: "Live", icon: Activity, exact: true },
  { href: `${BASE}/people`, label: "Visitors & Users", icon: Users },
  { href: `${BASE}/sessions`, label: "Active Sessions", icon: Clock },
  { href: `${BASE}/activity`, label: "User Activity", icon: History },
  { href: `${BASE}/security`, label: "Login & Security", icon: ShieldAlert },
  { href: `${BASE}/analytics`, label: "Analytics", icon: BarChart3 },
];

/** Section navigation shared by every Live Monitoring page. Scrolls sideways on a phone. */
export function MonitoringTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Live Monitoring sections" className="-mx-1 mb-5 flex gap-1 overflow-x-auto px-1 pb-1">
      {TABS.map((t) => {
        const active = t.exact ? path === t.href : path === t.href || path.startsWith(`${t.href}/`) || (t.href.endsWith("/people") && /\/monitoring\/(user|visitor)\//.test(path));
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${active ? "bg-brand-500/15 text-brand-300" : "text-white/50 hover:bg-white/5 hover:text-white"}`}>
            <t.icon size={14} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Whether the signed-in admin holds an action in Live Monitoring (the server enforces it independently). */
export function useMonitoringCan(action: "view" | "manage"): boolean {
  const { me } = useBusinessAdmin();
  return me.isSuperAdmin || (me.permissions?.monitoring ?? []).includes(action);
}

export function LiveDot({ online, label }: { online: boolean; label?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="relative flex h-2.5 w-2.5">
        {online && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-400" : "bg-white/25"}`} />
      </span>
      {label !== false && <span className={online ? "text-emerald-300" : "text-white/40"}>{online ? "Online" : "Offline"}</span>}
    </span>
  );
}

export function KindPill({ kind }: { kind: "guest" | "registered" }) {
  return <StatusPill tone={kind === "registered" ? "info" : "off"}>{kind === "registered" ? "Registered" : "Guest"}</StatusPill>;
}

export function DeviceCell({ device }: { device: { type?: string | null; browser?: string | null; os?: string | null } }) {
  const Icon = device.type === "mobile" ? Smartphone : device.type === "tablet" ? Tablet : Laptop;
  const text = [device.browser && device.browser !== "Unknown" ? device.browser : null, device.os && device.os !== "Unknown" ? device.os : null].filter(Boolean).join(" · ");
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
      <Icon size={14} className="shrink-0 text-white/40" />
      <span className="truncate">{text || "Unknown device"}</span>
    </span>
  );
}

/** Re-renders every few seconds so "2 min ago" stays true between data refreshes. */
export function useNow(intervalMs = 5000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function Ago({ iso, now }: { iso: string | null | undefined; now: number }) {
  return <span title={iso ? new Date(iso).toLocaleString("en-IN") : undefined}>{relativeTime(iso, now)}</span>;
}

export function PathChip({ path }: { path: string | null }) {
  return path ? <code className="max-w-[16rem] truncate rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-white/70" title={path}>{path}</code> : <span className="text-white/30">—</span>;
}

export function Pager({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = pageCount(total, pageSize);
  if (total <= pageSize) return total ? <p className="px-1 pt-3 text-xs text-white/35">{total} result{total === 1 ? "" : "s"}</p> : null;
  return (
    <div className="flex items-center justify-between gap-3 pt-3 text-xs text-white/50">
      <span>{(page - 1) * pageSize + 1}–{Math.min(total, page * pageSize)} of {total}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className="rounded-lg border border-white/10 p-1.5 enabled:hover:bg-white/5 disabled:opacity-30"><ChevronLeft size={14} /></button>
        <span className="px-2 tabular-nums">Page {page} / {pages}</span>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page" className="rounded-lg border border-white/10 p-1.5 enabled:hover:bg-white/5 disabled:opacity-30"><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}

const field = "rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none";

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    const t = window.setTimeout(() => draft !== value && onChange(draft), 350);
    return () => window.clearTimeout(t);
  }, [draft, value, onChange]);
  return (
    <label className="relative block min-w-0 flex-1 sm:max-w-xs">
      <span className="sr-only">{placeholder}</span>
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
      <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className={`${field} w-full pl-8`} />
    </label>
  );
}

export function Select<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }>; label: string }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} aria-label={label} className={field}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}

export function DateRange({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-white/40">
      <label><span className="sr-only">From date</span><input type="date" value={from} max={to || undefined} onChange={(e) => onChange(e.target.value, to)} className={field} /></label>
      <span>to</span>
      <label><span className="sr-only">To date</span><input type="date" value={to} min={from || undefined} onChange={(e) => onChange(from, e.target.value)} className={field} /></label>
    </div>
  );
}

/** Date inputs give a local day; the API takes ISO instants. */
export const dayStartIso = (d: string) => (d ? new Date(`${d}T00:00:00`).toISOString() : undefined);
export const dayEndIso = (d: string) => (d ? new Date(`${d}T23:59:59.999`).toISOString() : undefined);

/** Grouped event-type filter (authentication / website / business). */
export function EventTypeFilter({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <details className="relative">
      <summary className={`${field} cursor-pointer list-none select-none`}>Event types{value.length ? ` (${value.length})` : ""}</summary>
      <div className="absolute z-20 mt-1 max-h-80 w-64 overflow-auto rounded-xl border border-white/10 bg-ink-900 p-3 shadow-xl">
        {EVENT_FILTER_GROUPS.map((g) => (
          <fieldset key={g.label} className="mb-2">
            <legend className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">{g.label}</legend>
            {g.types.map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2 py-0.5 text-xs text-white/70">
                <input type="checkbox" checked={value.includes(t)} onChange={() => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t])} />
                {EVENT_LABELS[t]}
              </label>
            ))}
          </fieldset>
        ))}
        {value.length > 0 && <button type="button" onClick={() => onChange([])} className="text-xs text-brand-300 hover:underline">Clear</button>}
      </div>
    </details>
  );
}

export function ActivityTimeline({ events, now }: { events: TimelineEvent[]; now: number }) {
  return (
    <ol className="relative space-y-0">
      {events.map((e) => {
        const d = describeEvent(e);
        const group = EVENT_GROUPS[e.type] ?? "browse";
        const tone = e.outcome === "FAILURE" ? "warn" : GROUP_TONE[group];
        const dot = tone === "ok" ? "bg-emerald-400" : tone === "warn" ? "bg-amber-400" : tone === "info" ? "bg-brand-400" : "bg-white/30";
        return (
          <li key={e.id} className="relative flex gap-3 pb-4 pl-1">
            <span className="absolute left-[7px] top-3 -bottom-1 w-px bg-white/8" aria-hidden />
            <span className={`relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-ink-900 ${dot}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm font-medium text-white">{d.title}</span>
                {e.type === "LOGIN_SUCCESS" && <LogIn size={12} className="text-brand-300" />}
                <span className="text-xs text-white/35" title={new Date(e.at).toLocaleString("en-IN")}>{relativeTime(e.at, now)}</span>
              </div>
              {d.detail && <p className="truncate text-xs text-white/50" title={d.detail}>{d.detail}</p>}
              <p className="text-[11px] text-white/30">{new Date(e.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}{e.device?.browser ? ` · ${e.device.browser}${e.device.os ? `, ${e.device.os}` : ""}` : ""}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Ends a signed-in session after an explicit confirmation. Shown only to admins who hold the manage action. */
export function TerminateButton({ sessionId, name, onDone }: { sessionId: string; name: string; onDone: () => void }) {
  const can = useMonitoringCan("manage");
  const [step, setStep] = useState<"idle" | "confirm" | "busy">("idle");
  const [err, setErr] = useState<string | null>(null);
  if (!can) return null;
  if (step === "idle") return <button type="button" onClick={() => setStep("confirm")} className="rounded-lg border border-red-400/30 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/10">Terminate</button>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5" role="group" aria-label={`Confirm ending ${name}'s session`}>
      <span className="text-[11px] text-white/60">End {name}&apos;s sign-in?</span>
      <button type="button" disabled={step === "busy"} onClick={async () => {
        setStep("busy"); setErr(null);
        try { await terminateSession(sessionId); setStep("idle"); onDone(); } catch (e) { setErr(describeApiError(e)); setStep("confirm"); }
      }} className="rounded-lg bg-red-500/80 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-500 disabled:opacity-50">{step === "busy" ? "Ending…" : "Yes, end it"}</button>
      <button type="button" onClick={() => { setStep("idle"); setErr(null); }} className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-white/60 hover:bg-white/5">Cancel</button>
      {err && <span role="alert" className="text-[11px] text-red-300">{err}</span>}
    </span>
  );
}

export const TableShell = ({ children }: { children: ReactNode }) => <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">{children}</table></div>;
export const Th = ({ children, className = "" }: { children?: ReactNode; className?: string }) => <th scope="col" className={`whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/35 ${className}`}>{children}</th>;
export const Td = ({ children, className = "", title }: { children?: ReactNode; className?: string; title?: string }) => <td title={title} className={`px-3 py-3 align-middle text-white/80 ${className}`}>{children}</td>;
export const Skeleton = ({ rows = 5 }: { rows?: number }) => (
  <div role="status" aria-label="Loading" className="space-y-2 p-4">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-white/5" />)}</div>
);
