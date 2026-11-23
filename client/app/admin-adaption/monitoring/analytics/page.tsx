"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Clock, Eye, UserCheck, Users, Waypoints } from "lucide-react";
import { EmptyState, ErrorNote, PageHeader, Panel, StatCard } from "@/components/business-admin/ui";
import { MonitoringTabs, Select, Skeleton } from "@/components/business-admin/monitoring/parts";
import { describeApiError } from "@/lib/businessAdminApi";
import { fetchAnalytics } from "@/lib/monitoringApi";
import { EVENT_LABELS, formatDuration, rangeFor } from "@/lib/monitoringLogic";

function Bars({ rows, empty }: { rows: Array<{ label: string; value: number }>; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-xs text-white/35">{empty}</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="text-xs">
          <div className="mb-1 flex justify-between gap-3"><span className="truncate text-white/70" title={r.label}>{r.label}</span><span className="tabular-nums text-white/50">{r.value}</span></div>
          <div className="h-1.5 rounded-full bg-white/6"><div className="h-full rounded-full bg-brand-500/70" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState("7");
  const range = useMemo(() => rangeFor(Number(days)), [days]);
  const q = useQuery({ queryKey: ["monitoring", "analytics", days], queryFn: () => fetchAnalytics(range), refetchInterval: 60_000 });
  const d = q.data;
  const maxDay = Math.max(1, ...(d?.daily ?? []).map((x) => x.pageViews));

  return (
    <div>
      <PageHeader title="User Activity Analytics" description="Traffic and usage from visitors who accepted analytics, plus sign-in activity." actions={<Select label="Period" value={days} onChange={setDays} options={[{ value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }, { value: "90", label: "Last 90 days" }]} />} />
      <MonitoringTabs />
      {q.isError ? <ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} />
        : !d ? <Skeleton rows={6} />
        : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatCard label="Page views" value={d.totals.pageViews} icon={Eye} />
              <StatCard label="Unique visitors" value={d.totals.uniqueVisitors} icon={Users} />
              <StatCard label="Sessions" value={d.totals.sessions} icon={Waypoints} hint={`${d.totals.registeredSessions} registered · ${d.totals.guestSessions} guest`} />
              <StatCard label="Registered sessions" value={d.totals.registeredSessions} icon={UserCheck} />
              <StatCard label="Avg session" value={formatDuration(d.totals.avgSessionSeconds)} icon={Clock} />
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <Panel title="Daily activity (India time)">
                {d.daily.length === 0 ? <EmptyState compact icon={BarChart3} title="No data yet" description="Activity appears here once visitors accept analytics." /> : (
                  <div className="flex h-44 items-end gap-1.5 overflow-x-auto" role="img" aria-label="Daily page views">
                    {d.daily.map((x) => (
                      <div key={x.day} className="flex min-w-[1.5rem] flex-1 flex-col items-center justify-end gap-1" title={`${x.day}: ${x.pageViews} page views, ${x.visitors} visitors, ${x.logins} logins, ${x.failedLogins} failed`}>
                        <div className="w-full rounded-t bg-brand-500/70" style={{ height: `${Math.max(3, (x.pageViews / maxDay) * 100)}%` }} />
                        <span className="text-[9px] text-white/35">{x.day.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
              <Panel title="Top pages"><Bars rows={d.topPages.map((p) => ({ label: p.path, value: p.views }))} empty="No page views in this period." /></Panel>
              <Panel title="Devices"><Bars rows={d.devices.map((x) => ({ label: x.label, value: x.count }))} empty="No sessions in this period." /></Panel>
              <Panel title="Browsers"><Bars rows={d.browsers.map((x) => ({ label: x.label, value: x.count }))} empty="No sessions in this period." /></Panel>
              <Panel title="What people did"><Bars rows={d.eventsByType.map((x) => ({ label: EVENT_LABELS[x.type] ?? x.type, value: x.count }))} empty="No activity in this period." /></Panel>
            </div>
          </>
        )}
    </div>
  );
}
