"use client";

import Link from "next/link";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { EmptyState, ErrorNote, PageHeader, Panel, StatusPill } from "@/components/business-admin/ui";
import { Ago, DeviceCell, FilterBar, LiveDot, MonitoringTabs, Pager, SearchBox, Select, Skeleton, Td, TableShell, Th, useNow } from "@/components/business-admin/monitoring/parts";
import { describeApiError } from "@/lib/businessAdminApi";
import { fetchPeople, type PersonRow } from "@/lib/monitoringApi";

const SIZE = 25;
const when = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function PeoplePage() {
  const now = useNow(15000);
  const [kind, setKind] = useState<"registered" | "guest">("registered");
  const [search, setSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState("all");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["monitoring", "people", kind, search, onlineOnly, sort, page],
    queryFn: () => fetchPeople({ kind, search, online: onlineOnly === "online", sort: kind === "guest" ? (sort === "recent" ? "last" : sort) : sort === "recent" ? "created" : "name", page, pageSize: SIZE }),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });
  const reset = () => setPage(1);
  const data = q.data;

  return (
    <div>
      <PageHeader title="Visitors & Users" description="Every registered account and every anonymous browser, with whether they are online now." />
      <MonitoringTabs />
      <Panel flush>
        <div className="px-5 pt-4">
          <FilterBar>
            <Select label="Who" value={kind} onChange={(v) => { setKind(v); setSort("recent"); reset(); }} options={[{ value: "registered", label: "Registered users" }, { value: "guest", label: "Guest visitors" }]} />
            <SearchBox value={search} onChange={(v) => { setSearch(v); reset(); }} placeholder={kind === "guest" ? "Search visitor id or first page…" : "Search name or email…"} />
            {kind === "registered" && <Select label="Status" value={onlineOnly} onChange={(v) => { setOnlineOnly(v); reset(); }} options={[{ value: "all", label: "All" }, { value: "online", label: "Online now" }]} />}
            <Select label="Sort" value={sort} onChange={(v) => { setSort(v); reset(); }} options={kind === "guest" ? [{ value: "recent", label: "Last seen" }, { value: "first", label: "First seen" }, { value: "pages", label: "Most pages" }] : [{ value: "recent", label: "Newest accounts" }, { value: "name", label: "Name A–Z" }]} />
          </FilterBar>
        </div>
        {q.isError ? <div className="p-5 pt-0"><ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} /></div>
          : !data ? <Skeleton rows={8} />
          : data.items.length === 0 ? <div className="p-5 pt-0"><EmptyState compact icon={Users} title="Nobody matches" description="Try a different search or filter." /></div>
          : (
            <div className="px-2 pb-4">
              <TableShell>
                <thead><tr className="border-b border-white/6">
                  <Th>{kind === "guest" ? "Visitor" : "User"}</Th><Th>Status</Th><Th>{kind === "guest" ? "First seen" : "Registered"}</Th><Th>Last seen</Th><Th className="text-right">Page views</Th>{kind === "guest" ? <><Th>Device</Th><Th>Country</Th></> : <Th>Account</Th>}
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {data.items.map((p: PersonRow) => (
                    <tr key={p.id} className="hover:bg-white/[0.03]">
                      <Td>
                        <Link href={p.kind === "registered" ? `/admin-adaption/monitoring/user/${p.userId}` : `/admin-adaption/monitoring/visitor/${p.visitorId}`} className="font-medium text-white hover:text-brand-300">{p.label}</Link>
                        {p.kind === "registered" && <div className="text-xs text-white/35">{p.email}</div>}
                      </Td>
                      <Td><LiveDot online={p.online} /></Td>
                      <Td className="whitespace-nowrap text-xs text-white/50">{when(p.kind === "guest" ? p.firstSeenAt : p.registeredAt)}</Td>
                      <Td className="whitespace-nowrap text-xs"><Ago iso={p.lastSeenAt} now={now} /></Td>
                      <Td className="text-right tabular-nums">{p.pageViews}</Td>
                      {p.kind === "guest" ? <><Td className="max-w-[11rem]"><DeviceCell device={p.device} /></Td><Td className="text-xs text-white/50">{p.country ?? "—"}</Td></> : <Td><StatusPill tone={p.isActive ? "ok" : "warn"}>{p.isActive ? "Active" : "Deactivated"}</StatusPill></Td>}
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
