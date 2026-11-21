"use client";

import Link from "next/link";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { EmptyState, ErrorNote, PageHeader, Panel, StatusPill } from "@/components/business-admin/ui";
import { Ago, DateRange, DeviceCell, FilterBar, MonitoringTabs, Pager, SearchBox, Select, Skeleton, Td, TableShell, TerminateButton, Th, dayEndIso, dayStartIso, useNow } from "@/components/business-admin/monitoring/parts";
import { describeApiError } from "@/lib/businessAdminApi";
import { fetchSecurity, type SecurityRow } from "@/lib/monitoringApi";
import { EVENT_LABELS } from "@/lib/monitoringLogic";

const SIZE = 25;
const SESSION_LABEL: Record<string, string> = { active: "Active", idle: "Idle", ended: "Ended" };

function Outcome({ r }: { r: SecurityRow }) {
  if (r.type === "LOGIN_SUCCESS") return <StatusPill tone="ok">Success</StatusPill>;
  if (r.type === "LOGIN_FAILED") return <StatusPill tone="warn">Failed{r.reason ? ` · ${r.reason.toLowerCase().replace(/_/g, " ")}` : ""}</StatusPill>;
  return <StatusPill tone="off">{EVENT_LABELS[r.type] ?? r.type}</StatusPill>;
}

export default function SecurityPage() {
  const now = useNow();
  const [status, setStatus] = useState("all");
  const [device, setDevice] = useState("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["monitoring", "security", status, device, search, from, to, page],
    queryFn: () => fetchSecurity({ status: status === "all" ? undefined : status, device: device === "all" ? undefined : device, search, from: dayStartIso(from), to: dayEndIso(to), page, pageSize: SIZE }),
    placeholderData: keepPreviousData,
    refetchInterval: 20_000,
  });
  const reset = () => setPage(1);
  const data = q.data;

  return (
    <div>
      <PageHeader title="Login & Security Logs" description="Sign-ins, failures, sign-outs and session endings. IP addresses are personal data: only Super Admins see them in full." />
      <MonitoringTabs />
      <Panel flush>
        <div className="px-5 pt-4">
          <FilterBar>
            <Select label="Result" value={status} onChange={(v) => { setStatus(v); reset(); }} options={[{ value: "all", label: "All events" }, { value: "success", label: "Successful logins" }, { value: "failed", label: "Failed logins" }]} />
            <Select label="Device" value={device} onChange={(v) => { setDevice(v); reset(); }} options={[{ value: "all", label: "Any device" }, { value: "desktop", label: "Desktop" }, { value: "mobile", label: "Mobile" }, { value: "tablet", label: "Tablet" }]} />
            <SearchBox value={search} onChange={(v) => { setSearch(v); reset(); }} placeholder="Search user or typed email…" />
            <DateRange from={from} to={to} onChange={(a, b) => { setFrom(a); setTo(b); reset(); }} />
          </FilterBar>
        </div>
        {q.isError ? <div className="p-5 pt-0"><ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} /></div>
          : !data ? <Skeleton rows={8} />
          : data.items.length === 0 ? <div className="p-5 pt-0"><EmptyState compact icon={ShieldAlert} title="No events" description="No sign-in events match these filters." /></div>
          : (
            <div className="px-2 pb-4">
              <TableShell>
                <thead><tr className="border-b border-white/6"><Th>When</Th><Th>User</Th><Th>Event</Th><Th>Device</Th><Th>IP address</Th><Th>Session</Th><Th>Last activity</Th><Th>Ended</Th><Th /></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {data.items.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.03]">
                      <Td className="whitespace-nowrap text-xs text-white/60">{new Date(r.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}</Td>
                      <Td>{r.userId ? <Link href={`/admin-adaption/monitoring/user/${r.userId}`} className="font-medium text-white hover:text-brand-300">{r.name ?? r.email}</Link> : <span className="text-white/60">{r.email ?? "Unknown"}</span>}{r.name && r.email && <div className="text-xs text-white/35">{r.email}</div>}</Td>
                      <Td><Outcome r={r} /></Td>
                      <Td className="max-w-[11rem]"><DeviceCell device={r.device} /></Td>
                      <Td className="whitespace-nowrap font-mono text-xs text-white/60" title={r.ipMasked ? "Masked: only Super Admins see the full address" : undefined}>{r.ip ?? "—"}</Td>
                      <Td>{r.session ? <StatusPill tone={r.session.status === "active" ? "ok" : "off"}>{SESSION_LABEL[r.session.status]}</StatusPill> : <span className="text-white/30">—</span>}</Td>
                      <Td className="whitespace-nowrap text-xs">{r.session ? <Ago iso={r.session.lastActivityAt} now={now} /> : "—"}</Td>
                      <Td className="whitespace-nowrap text-xs text-white/50">{r.session?.endedAt ? new Date(r.session.endedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true }) : "—"}</Td>
                      <Td className="whitespace-nowrap text-right">{r.session?.canTerminate && <TerminateButton sessionId={r.session.id} name={r.name ?? r.email ?? "this user"} onDone={() => void q.refetch()} />}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
              <div className="px-3"><Pager page={data.page} total={data.total} pageSize={data.pageSize} onPage={setPage} /></div>
            </div>
          )}
      </Panel>
    </div>
  );
}
