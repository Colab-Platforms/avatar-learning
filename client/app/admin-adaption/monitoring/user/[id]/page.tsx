"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ErrorNote, PageHeader, Panel, StatusPill } from "@/components/business-admin/ui";
import { Ago, DeviceCell, LiveDot, MonitoringTabs, PathChip, Skeleton, Td, TableShell, TerminateButton, Th, useNow } from "@/components/business-admin/monitoring/parts";
import { TimelinePanel } from "@/components/business-admin/monitoring/TimelinePanel";
import { describeApiError } from "@/lib/businessAdminApi";
import { fetchUserDetail } from "@/lib/monitoringApi";
import { EVENT_LABELS, formatDuration, sessionLength } from "@/lib/monitoringLogic";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const Row = ({ k, children }: { k: string; children: React.ReactNode }) => <div className="flex justify-between gap-4 py-1.5 text-sm"><dt className="text-white/40">{k}</dt><dd className="min-w-0 truncate text-right text-white/80">{children}</dd></div>;

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const now = useNow();
  const q = useQuery({ queryKey: ["monitoring", "user", id], queryFn: () => fetchUserDetail(id), refetchInterval: 15_000 });
  const d = q.data;

  return (
    <div>
      <Link href="/admin-adaption/monitoring/people" className="mb-2 inline-flex items-center gap-1 text-xs text-white/45 hover:text-white"><ArrowLeft size={12} /> Visitors &amp; Users</Link>
      <PageHeader title={d?.account.name ?? d?.account.email ?? "User"} description={d?.account.email} actions={d && <><LiveDot online={d.online} />{d.currentPath && <PathChip path={d.currentPath} />}</>} />
      <MonitoringTabs />
      {q.isError ? <ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} /> : !d ? <Skeleton rows={8} /> : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Account">
              <dl className="divide-y divide-white/5">
                <Row k="Status"><StatusPill tone={d.account.isActive ? "ok" : "warn"}>{d.account.isActive ? "Active" : "Deactivated"}</StatusPill></Row>
                <Row k="Roles">{d.account.roles.join(", ") || "—"}</Row>
                <Row k="Email verified">{d.account.emailVerified ? "Yes" : "No"}</Row>
                <Row k="Phone">{d.account.phone ?? "—"}</Row>
                <Row k="Location">{d.account.location ?? "—"}</Row>
              </dl>
            </Panel>
            <Panel title="Registration">
              <dl className="divide-y divide-white/5">
                <Row k="Registered">{day(d.registration.registeredAt)}</Row>
                <Row k="Sign-in method">{d.registration.provider === "GOOGLE" ? "Google" : "Email & password"}</Row>
                <Row k="Page views">{d.eventCounts.PAGE_VIEW ?? 0}</Row>
                <Row k="Logins">{d.eventCounts.LOGIN_SUCCESS ?? 0}</Row>
                <Row k="Failed logins">{d.eventCounts.LOGIN_FAILED ?? 0}</Row>
              </dl>
            </Panel>
            <Panel title="Devices">
              {d.devices.length === 0 ? <p className="text-xs text-white/35">No sessions recorded yet.</p> : (
                <ul className="space-y-2">{d.devices.map((x) => <li key={`${x.deviceType}${x.browser}${x.os}`} className="flex items-center justify-between gap-2"><DeviceCell device={{ type: x.deviceType, browser: x.browser, os: x.os }} /><span className="text-[11px] text-white/35">{x.sessions}× · <Ago iso={x.lastUsedAt} now={now} /></span></li>)}</ul>
              )}
            </Panel>
          </div>

          <Panel title="Session history" flush>
            {d.sessions.length === 0 ? <p className="p-5 pt-3 text-xs text-white/35">No sessions recorded yet.</p> : (
              <TableShell>
                <thead><tr className="border-b border-white/6"><Th>Started</Th><Th>Status</Th><Th>Device</Th><Th>Last page</Th><Th>Length</Th><Th /></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {d.sessions.map((s) => (
                    <tr key={s.id}>
                      <Td className="whitespace-nowrap text-xs text-white/60">{new Date(s.startedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })}</Td>
                      <Td>{s.endedAt ? <StatusPill tone={s.endReason === "TERMINATED" ? "warn" : "off"}>{s.endReason === "LOGOUT" ? "Signed out" : s.endReason === "TERMINATED" ? "Ended by admin" : s.endReason === "EXPIRED" ? "Sign-in expired" : "Inactive"}</StatusPill> : <LiveDot online={s.online} />}</Td>
                      <Td className="max-w-[11rem]"><DeviceCell device={s.device} /></Td>
                      <Td><PathChip path={s.currentPath} /></Td>
                      <Td className="text-xs tabular-nums text-white/60">{formatDuration(sessionLength(s))}</Td>
                      <Td className="text-right">{s.canTerminate && <TerminateButton sessionId={s.id} name={d.account.name ?? d.account.email} onDone={() => void q.refetch()} />}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Login history">
              {d.logins.length === 0 ? <p className="text-xs text-white/35">No sign-ins recorded.</p> : (
                <ul className="divide-y divide-white/5 text-sm">{d.logins.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="flex items-center gap-2"><StatusPill tone={l.type === "LOGIN_SUCCESS" ? "ok" : "warn"}>{EVENT_LABELS[l.type] ?? l.type}</StatusPill><DeviceCell device={l.device} /></span>
                    <span className="text-xs text-white/40">{new Date(l.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })}</span>
                  </li>))}
                </ul>
              )}
            </Panel>
            <Panel title="Courses &amp; payments">
              {d.courses.length === 0 && d.payments.length === 0 ? <p className="text-xs text-white/35">No enrolments or payments.</p> : (
                <div className="space-y-3 text-sm">
                  {d.courses.map((c) => <div key={c.courseId} className="flex items-center justify-between gap-3"><span className="truncate text-white/80">{c.title}</span><span className="shrink-0 text-xs text-white/45">{c.completed ? "Completed" : `${c.progress}%`} · {day(c.enrolledAt)}</span></div>)}
                  {d.payments.length > 0 && <div className="border-t border-white/5 pt-3">{d.payments.map((p) => <div key={p.id} className="flex items-center justify-between gap-3 py-0.5"><span className="text-white/70">₹{p.amount} · {p.product.replace(/_/g, " ").toLowerCase()}</span><StatusPill tone={p.status === "PAID" ? "ok" : "warn"}>{p.status}</StatusPill></div>)}</div>}
                </div>
              )}
            </Panel>
          </div>

          <TimelinePanel kind="user" id={id} title="Complete activity timeline" />
        </div>
      )}
    </div>
  );
}
