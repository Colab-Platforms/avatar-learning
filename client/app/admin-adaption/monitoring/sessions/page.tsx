"use client";

import Link from "next/link";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { EmptyState, ErrorNote, PageHeader, Panel, StatusPill } from "@/components/business-admin/ui";
import { Ago, DeviceCell, FilterBar, KindPill, LiveDot, MonitoringTabs, Pager, PathChip, SearchBox, Select, Skeleton, Td, TableShell, TerminateButton, Th, useNow } from "@/components/business-admin/monitoring/parts";
import { describeApiError } from "@/lib/businessAdminApi";
import { fetchSessions } from "@/lib/monitoringApi";
import { formatDuration, rowTitle, sessionLength, type SessionRow } from "@/lib/monitoringLogic";

const SIZE = 25;
const END_LABEL: Record<string, string> = { LOGOUT: "Signed out", TIMEOUT: "Inactive", EXPIRED: "Sign-in expired", TERMINATED: "Ended by admin" };

export default function SessionsPage() {
  const now = useNow();
  const [status, setStatus] = useState("online");
  const [kind, setKind] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["monitoring", "sessions", status, kind, search, page],
    queryFn: () => fetchSessions({ status, kind: kind === "all" ? undefined : kind, search, page, pageSize: SIZE }),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
  });
  const reset = () => setPage(1);
  const data = q.data;
  const href = (s: SessionRow) => (s.userId ? `/admin-adaption/monitoring/user/${s.userId}` : `/admin-adaption/monitoring/visitor/${s.visitorId}`);

  return (
    <div>
      <PageHeader title="Active Sessions" description="Every browser session, across all of a person's devices. Administrators with permission can end a suspicious sign-in." />
      <MonitoringTabs />
      <Panel flush>
        <div className="px-5 pt-4">
          <FilterBar>
            <Select label="Status" value={status} onChange={(v) => { setStatus(v); reset(); }} options={[{ value: "online", label: "Online now" }, { value: "active", label: "Open (incl. idle)" }, { value: "offline", label: "Offline / ended (24h)" }, { value: "all", label: "All (24h)" }]} />
            <Select label="Type" value={kind} onChange={(v) => { setKind(v); reset(); }} options={[{ value: "all", label: "Everyone" }, { value: "registered", label: "Registered" }, { value: "guest", label: "Guests" }]} />
            <SearchBox value={search} onChange={(v) => { setSearch(v); reset(); }} placeholder="Search name, email, visitor id, page…" />
          </FilterBar>
        </div>
        {q.isError ? <div className="p-5 pt-0"><ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} /></div>
          : !data ? <Skeleton rows={8} />
          : data.items.length === 0 ? <div className="p-5 pt-0"><EmptyState compact icon={Clock} title="No sessions" description="Nothing matches these filters right now." /></div>
          : (
            <div className="px-2 pb-4">
              <TableShell>
                <thead><tr className="border-b border-white/6"><Th>Visitor / user</Th><Th>Type</Th><Th>Status</Th><Th>Current page</Th><Th>Device</Th><Th>Started</Th><Th>Length</Th><Th>Last activity</Th><Th /></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {data.items.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.03]">
                      <Td><Link href={href(r)} className="font-medium text-white hover:text-brand-300">{rowTitle(r)}</Link>{r.email && <div className="text-xs text-white/35">{r.email}</div>}</Td>
                      <Td><KindPill kind={r.kind} /></Td>
                      <Td>{r.endedAt ? <StatusPill tone={r.endReason === "TERMINATED" ? "warn" : "off"}>{END_LABEL[r.endReason ?? ""] ?? "Ended"}</StatusPill> : <LiveDot online={r.online} />}</Td>
                      <Td><PathChip path={r.currentPath} /></Td>
                      <Td className="max-w-[11rem]"><DeviceCell device={r.device} /></Td>
                      <Td className="whitespace-nowrap text-xs text-white/50">{new Date(r.startedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })}</Td>
                      <Td className="whitespace-nowrap text-xs tabular-nums text-white/60">{formatDuration(sessionLength(r))}</Td>
                      <Td className="whitespace-nowrap text-xs"><Ago iso={r.lastActivityAt} now={now} /></Td>
                      <Td className="whitespace-nowrap text-right">{r.canTerminate && <TerminateButton sessionId={r.id} name={rowTitle(r)} onDone={() => void q.refetch()} />}</Td>
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
