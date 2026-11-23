"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ErrorNote, PageHeader, Panel, StatusPill } from "@/components/business-admin/ui";
import { DeviceCell, LiveDot, MonitoringTabs, PathChip, Skeleton, Td, TableShell, Th } from "@/components/business-admin/monitoring/parts";
import { TimelinePanel } from "@/components/business-admin/monitoring/TimelinePanel";
import { describeApiError } from "@/lib/businessAdminApi";
import { fetchVisitorDetail } from "@/lib/monitoringApi";
import { formatDuration, sessionLength } from "@/lib/monitoringLogic";

const Row = ({ k, children }: { k: string; children: React.ReactNode }) => <div className="flex justify-between gap-4 py-1.5 text-sm"><dt className="text-white/40">{k}</dt><dd className="min-w-0 truncate text-right text-white/80">{children}</dd></div>;

export default function VisitorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({ queryKey: ["monitoring", "visitor", id], queryFn: () => fetchVisitorDetail(id), refetchInterval: 15_000 });
  const d = q.data;
  return (
    <div>
      <Link href="/admin-adaption/monitoring/people" className="mb-2 inline-flex items-center gap-1 text-xs text-white/45 hover:text-white"><ArrowLeft size={12} /> Visitors &amp; Users</Link>
      <PageHeader title={d?.visitor.label ?? "Visitor"} description="An anonymous browser. Its history is kept separately until the person signs in." actions={d && <><LiveDot online={d.online} />{d.currentPath && <PathChip path={d.currentPath} />}</>} />
      <MonitoringTabs />
      {q.isError ? <ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} /> : !d ? <Skeleton rows={6} /> : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Visitor">
              <dl className="divide-y divide-white/5">
                <Row k="Account"><>{d.visitor.userId ? <Link href={`/admin-adaption/monitoring/user/${d.visitor.userId}`} className="text-brand-300 hover:underline">Linked to a registered user →</Link> : <StatusPill tone="off">Guest</StatusPill>}</></Row>
                <Row k="First seen">{new Date(d.visitor.firstSeenAt).toLocaleString("en-IN")}</Row>
                <Row k="Last seen">{new Date(d.visitor.lastSeenAt).toLocaleString("en-IN")}</Row>
                <Row k="Page views">{d.visitor.pageViews}</Row>
                <Row k="First page">{d.visitor.firstPath ?? "—"}</Row>
                <Row k="Came from">{d.visitor.referrer ?? "Direct"}</Row>
                <Row k="Country">{d.visitor.country ?? "—"}</Row>
                <Row k="Device"><DeviceCell device={d.visitor.device} /></Row>
              </dl>
            </Panel>
            <Panel title="Sessions" flush>
              <TableShell>
                <thead><tr className="border-b border-white/6"><Th>Started</Th><Th>Status</Th><Th>Last page</Th><Th>Length</Th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {d.sessions.map((s) => (
                    <tr key={s.id}>
                      <Td className="whitespace-nowrap text-xs text-white/60">{new Date(s.startedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })}</Td>
                      <Td>{s.endedAt ? <StatusPill tone="off">Ended</StatusPill> : <LiveDot online={s.online} />}</Td>
                      <Td><PathChip path={s.currentPath} /></Td>
                      <Td className="text-xs tabular-nums text-white/60">{formatDuration(sessionLength(s))}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            </Panel>
          </div>
          <TimelinePanel kind="visitor" id={id} title="Browsing history" />
        </div>
      )}
    </div>
  );
}
