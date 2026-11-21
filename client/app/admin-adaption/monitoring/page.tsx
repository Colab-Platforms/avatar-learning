"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, AlertTriangle, LogIn, UserCheck, UserPlus, Users, UsersRound, Waypoints } from "lucide-react";
import { EmptyState, ErrorNote, PageHeader, Panel, StatCard, StatusPill } from "@/components/business-admin/ui";
import { Ago, DeviceCell, FilterBar, KindPill, LiveDot, MonitoringTabs, PathChip, SearchBox, Select, Td, TableShell, Th, Skeleton, useNow } from "@/components/business-admin/monitoring/parts";
import { useLiveStream } from "@/components/business-admin/monitoring/useLiveStream";
import { filterLive, rowTitle, type SessionRow } from "@/lib/monitoringLogic";

const detailHref = (s: SessionRow) => (s.userId ? `/admin-adaption/monitoring/user/${s.userId}` : `/admin-adaption/monitoring/visitor/${s.visitorId}`);

function StreamPill({ state }: { state: string }) {
  if (state === "live") return <StatusPill tone="ok">● Live</StatusPill>;
  if (state === "polling") return <StatusPill tone="warn">Refreshing every 10s</StatusPill>;
  if (state === "error") return <StatusPill tone="off">Unavailable</StatusPill>;
  return <StatusPill tone="info">Connecting…</StatusPill>;
}

export default function LiveMonitoringPage() {
  const { snapshot, state, error, updatedAt, refresh } = useLiveStream();
  const now = useNow();
  const [kind, setKind] = useState("all");
  const [search, setSearch] = useState("");
  const rows = useMemo(() => filterLive(snapshot?.live ?? [], { kind, search }), [snapshot, kind, search]);
  const s = snapshot?.stats;

  return (
    <div>
      <PageHeader
        title="Live Monitoring"
        description="Who is on the website right now, and what they are doing. Updates automatically."
        actions={<><StreamPill state={state} />{updatedAt && <span className="text-xs text-white/35">Updated <Ago iso={new Date(updatedAt).toISOString()} now={now} /></span>}</>}
      />
      <MonitoringTabs />
      {error && <div className="mb-4"><ErrorNote message={error} onRetry={() => void refresh()} /></div>}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-live="polite">
        <StatCard label="Active now" value={s?.activeNow ?? "—"} icon={Activity} tone="ok" hint={s ? `No activity for ${s.onlineTimeoutSeconds}s = offline` : undefined} />
        <StatCard label="Registered online" value={s?.activeRegistered ?? "—"} icon={UserCheck} />
        <StatCard label="Guests online" value={s?.activeGuests ?? "—"} icon={Users} />
        <StatCard label="Registered users" value={s?.totalRegisteredUsers ?? "—"} icon={UsersRound} />
        <StatCard label="Logins today" value={s?.loginsToday ?? "—"} icon={LogIn} />
        <StatCard label="New registrations today" value={s?.newRegistrationsToday ?? "—"} icon={UserPlus} />
        <StatCard label="Failed logins today" value={s?.failedLoginsToday ?? "—"} icon={AlertTriangle} tone={s && s.failedLoginsToday > 0 ? "warn" : "brand"} />
        <StatCard label="Sessions today" value={s?.sessionsToday ?? "—"} icon={Waypoints} />
      </div>

      <Panel title="Live visitors" flush action={<Link href="/admin-adaption/monitoring/sessions" className="text-xs font-semibold text-brand-300 hover:underline">All sessions →</Link>}>
        <div className="px-5 pt-2">
          <FilterBar>
            <SearchBox value={search} onChange={setSearch} placeholder="Search name, email, page, browser…" />
            <Select label="Show" value={kind} onChange={setKind} options={[{ value: "all", label: "Everyone" }, { value: "registered", label: "Registered" }, { value: "guest", label: "Guests" }]} />
            {snapshot && snapshot.total > snapshot.live.length && <span className="text-xs text-white/35">Showing the latest {snapshot.live.length} of {snapshot.total}</span>}
          </FilterBar>
        </div>
        {!snapshot && !error ? <Skeleton /> : rows.length === 0 ? (
          <div className="p-5 pt-0"><EmptyState compact icon={Activity} title={snapshot?.live.length ? "No one matches this filter" : "No one is online right now"} description={snapshot?.live.length ? "Clear the search or choose Everyone." : "Visitors appear here a moment after they open a page and disappear after the inactivity timeout. Only people who accepted analytics are shown."} /></div>
        ) : (
          <>
            {/* Phones: cards. Larger screens: table. */}
            <ul className="divide-y divide-white/5 md:hidden">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link href={detailHref(r)} className="block space-y-1.5 px-5 py-3 hover:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-2"><span className="truncate font-medium text-white">{rowTitle(r)}</span><LiveDot online={r.online} /></div>
                    <div className="flex flex-wrap items-center gap-2"><KindPill kind={r.kind} /><PathChip path={r.currentPath} /></div>
                    <div className="flex items-center justify-between text-xs text-white/40"><DeviceCell device={r.device} /><span>Active <Ago iso={r.lastActivityAt} now={now} /></span></div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
              <TableShell>
                <thead><tr className="border-b border-white/6"><Th>Visitor / user</Th><Th>Type</Th><Th>Status</Th><Th>Current page</Th><Th>Device</Th><Th>Session start</Th><Th>Last activity</Th><Th>Login</Th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.03]">
                      <Td><Link href={detailHref(r)} className="font-medium text-white hover:text-brand-300">{rowTitle(r)}</Link>{r.email && <div className="text-xs text-white/35">{r.email}</div>}</Td>
                      <Td><KindPill kind={r.kind} /></Td>
                      <Td><LiveDot online={r.online} /></Td>
                      <Td><PathChip path={r.currentPath} /></Td>
                      <Td className="max-w-[11rem]"><DeviceCell device={r.device} /></Td>
                      <Td className="whitespace-nowrap text-xs text-white/50">{new Date(r.startedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}</Td>
                      <Td className="whitespace-nowrap text-xs"><Ago iso={r.lastActivityAt} now={now} /></Td>
                      <Td><StatusPill tone={r.loginStatus === "signed_in" ? "ok" : "off"}>{r.loginStatus === "signed_in" ? "Signed in" : r.loginStatus === "signed_out" ? "Signed out" : "Guest"}</StatusPill></Td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            </div>
          </>
        )}
      </Panel>
      <p className="mt-3 text-xs text-white/30">Visit tracking runs only for visitors who accepted analytics. Admin screens are never tracked.</p>
    </div>
  );
}
