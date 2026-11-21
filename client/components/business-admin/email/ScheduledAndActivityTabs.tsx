"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, RotateCcw, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { cancelScheduledEmail, describeApiError, fetchEmailActivity, fetchScheduledEmails, resolveEmail, retryEmail, type EmailMessage } from "@/lib/businessAdminApi";
import { EmptyState, ErrorNote, Panel } from "@/components/business-admin/ui";
import { MessageStatus, TRIGGER_LABEL, TZ, btnGhost, inputCls, reasonText, whenLocal } from "./shared";

export function ScheduledTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["email", "scheduled"], queryFn: fetchScheduledEmails, refetchInterval: 30_000 });
  const cancel = useMutation({
    mutationFn: (id: string) => cancelScheduledEmail(id),
    onSuccess: () => { toast.success("Cancelled."); void qc.invalidateQueries({ queryKey: ["email"] }); },
    onError: (e) => toast.error(describeApiError(e)),
  });
  return (
    <Panel title="Scheduled emails" flush>
      <p className="px-5 pb-2 text-xs text-white/40">Emails waiting to be sent (including retries). Times are shown in your time zone ({TZ}); the server stores UTC.</p>
      {q.isError && <div className="px-5 pb-3"><ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} /></div>}
      {q.isLoading && <p className="px-5 pb-4 text-sm text-white/35">Loading…</p>}
      {q.data?.length === 0 && <div className="px-5 pb-5"><EmptyState icon={CalendarClock} title="Nothing scheduled" description="Follow-ups and scheduled sends appear here until they go out." compact /></div>}
      {q.data && q.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-white/35">
              <tr>{["Recipient", "Subject", "Template", "Scheduled for", "Status", ""].map((h) => <th key={h} className="px-5 py-2 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {q.data.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-2.5 text-white/85">{m.toEmail}</td>
                  <td className="max-w-56 truncate px-5 py-2.5 text-white/60">{m.subject}</td>
                  <td className="px-5 py-2.5 text-white/60">{m.template?.name ?? "—"}{m.automation && <span className="block text-xs text-white/35">{m.automation.name}</span>}</td>
                  <td className="px-5 py-2.5 text-white/60">{whenLocal(m.scheduledFor)}</td>
                  <td className="px-5 py-2.5"><MessageStatus status={m.status} /></td>
                  <td className="px-5 py-2.5 text-right">{m.status === "QUEUED" && <button className={btnGhost} onClick={() => cancel.mutate(m.id)} disabled={cancel.isPending} aria-label={`Cancel email to ${m.toEmail}`}>Cancel</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

const STATUSES = ["ALL", "UNCONFIRMED", "SENT", "DELIVERED", "QUEUED", "FAILED", "BOUNCED", "COMPLAINED", "SKIPPED", "CANCELLED"];
const STATUS_LABEL: Record<string, string> = { ALL: "All statuses", UNCONFIRMED: "Needs review" };

export function ActivityTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const q = useQuery({ queryKey: ["email", "activity", debounced, status, page], queryFn: () => fetchEmailActivity({ search: debounced || undefined, status, page }), placeholderData: (p) => p });
  const retry = useMutation({
    mutationFn: (id: string) => retryEmail(id),
    onSuccess: () => { toast.success("Queued again."); void qc.invalidateQueries({ queryKey: ["email"] }); },
    onError: (e) => toast.error(describeApiError(e)),
  });
  const resolve = useMutation({
    mutationFn: (v: { id: string; outcome: "SENT" | "NOT_SENT" }) => resolveEmail(v.id, v.outcome),
    onSuccess: () => { toast.success("Recorded. Nothing was sent."); void qc.invalidateQueries({ queryKey: ["email"] }); },
    onError: (e) => toast.error(describeApiError(e)),
  });
  const confirmResolve = (m: EmailMessage, outcome: "SENT" | "NOT_SENT") => {
    const text =
      outcome === "SENT"
        ? `Only choose this if you checked Resend and the email to ${m.toEmail} (“${m.subject}”) WAS accepted. The record will be marked as sent.`
        : `Only choose this if you checked Resend and the email to ${m.toEmail} (“${m.subject}”) was NOT accepted. It will be closed and never retried. To send again, send a new email by hand.`;
    if (window.confirm(text)) resolve.mutate({ id: m.id, outcome });
  };
  const pages = q.data ? Math.max(1, Math.ceil(q.data.total / q.data.limit)) : 1;
  const detail = (m: EmailMessage) => (m.failureReason ? reasonText(m.failureReason) : "");

  return (
    <Panel title="Email activity" flush>
      <div className="flex flex-col gap-2 px-5 pb-3 sm:flex-row">
        <input className={inputCls} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search recipient or subject" aria-label="Search email activity" />
        <select className={`${inputCls} sm:w-48`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] ?? s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>
      {q.isError && <div className="px-5 pb-3"><ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} /></div>}
      {q.isLoading && <p className="px-5 pb-4 text-sm text-white/35">Loading…</p>}
      {q.data?.items.length === 0 && <div className="px-5 pb-5"><EmptyState icon={ScrollText} title="No emails yet" description="Every email the system sends, schedules or skips is recorded here." compact /></div>}
      {q.data && q.data.items.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-white/35">
                <tr>{["Recipient", "Subject", "Source", "Sent", "Status", "Details", ""].map((h) => <th key={h} className="px-5 py-2 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {q.data.items.map((m) => (
                  <tr key={m.id}>
                    <td className="px-5 py-2.5 text-white/85">{m.toEmail}</td>
                    <td className="max-w-56 truncate px-5 py-2.5 text-white/60" title={m.subject}>{m.subject}</td>
                    <td className="px-5 py-2.5 text-white/60">{m.automation?.name ?? TRIGGER_LABEL[m.trigger]}{m.template && <span className="block text-xs text-white/35">{m.template.name}</span>}</td>
                    <td className="px-5 py-2.5 text-white/60">{whenLocal(m.sentAt)}</td>
                    <td className="px-5 py-2.5"><MessageStatus status={m.status} /></td>
                    <td className="max-w-56 px-5 py-2.5 text-xs text-white/45"><span className="line-clamp-2" title={detail(m)}>{detail(m)}</span>{m.resendId && <span className="block truncate font-mono text-[10px] text-white/25" title="Resend message ID">{m.resendId}</span>}</td>
                    <td className="px-5 py-2.5 text-right">
                      {m.status === "FAILED" && !m.maybeAccepted && <button className={btnGhost} onClick={() => retry.mutate(m.id)} disabled={retry.isPending} aria-label={`Retry email to ${m.toEmail}`}><RotateCcw size={14} /> Retry</button>}
                      {m.status === "UNCONFIRMED" && (
                        <span className="inline-flex flex-wrap justify-end gap-1.5">
                          <button className={btnGhost} onClick={() => confirmResolve(m, "SENT")} disabled={resolve.isPending} aria-label={`Mark email to ${m.toEmail} as sent`}>Was sent</button>
                          <button className={btnGhost} onClick={() => confirmResolve(m, "NOT_SENT")} disabled={resolve.isPending} aria-label={`Mark email to ${m.toEmail} as not sent`}>Was not sent</button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 text-xs text-white/45">
            <span>{q.data.total} email{q.data.total === 1 ? "" : "s"}</span>
            <span className="flex items-center gap-2">
              <button className={btnGhost} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              Page {page} of {pages}
              <button className={btnGhost} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </span>
          </div>
        </>
      )}
    </Panel>
  );
}
