"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Workflow } from "lucide-react";
import { toast } from "sonner";
import {
  createEmailAutomation,
  deleteEmailAutomation,
  describeApiError,
  fetchEmailActivity,
  fetchEmailAutomations,
  fetchEmailTemplates,
  setEmailAutomationActive,
  updateEmailAutomation,
  type EmailAutomation,
  type EmailAutomationInput,
} from "@/lib/businessAdminApi";
import { Modal } from "@/components/business-admin/admins/AdminDialogs";
import { EmptyState, ErrorNote, Panel, StatusPill } from "@/components/business-admin/ui";
import { ANCHOR_LABEL, MessageStatus, TRIGGER_LABEL, TZ, btnGhost, btnPrimary, delayText, inputCls, isoToLocal, localToIso, reasonText, whenLocal } from "./shared";

function AutomationEditor({ initial, onClose }: { initial: EmailAutomation | null; onClose: () => void }) {
  const qc = useQueryClient();
  const templates = useQuery({ queryKey: ["email", "templates"], queryFn: fetchEmailTemplates });
  const [name, setName] = useState(initial?.name ?? "");
  const [trigger, setTrigger] = useState<EmailAutomationInput["trigger"]>((initial?.trigger as EmailAutomationInput["trigger"]) ?? "USER_REGISTERED");
  const [templateId, setTemplateId] = useState(initial?.templateId ?? "");
  const [anchor, setAnchor] = useState(initial?.anchorEvent ?? "USER_REGISTERED");
  const [delayValue, setDelayValue] = useState(String(initial ? (initial.delayMinutes % 1440 === 0 && initial.delayMinutes ? initial.delayMinutes / 1440 : initial.delayMinutes % 60 === 0 && initial.delayMinutes ? initial.delayMinutes / 60 : initial.delayMinutes) : 0));
  const [unit, setUnit] = useState<"1" | "60" | "1440">(initial ? (initial.delayMinutes % 1440 === 0 && initial.delayMinutes ? "1440" : initial.delayMinutes % 60 === 0 && initial.delayMinutes ? "60" : "1") : "60");
  const [when, setWhen] = useState(isoToLocal(initial?.scheduledAt));
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => {
      const body: EmailAutomationInput = {
        name,
        trigger,
        templateId,
        ...(trigger !== "SCHEDULED_EMAIL" ? { delayMinutes: Math.round(Number(delayValue) * Number(unit)) } : { scheduledAt: localToIso(when) }),
        ...(trigger === "FOLLOW_UP" ? { anchorEvent: anchor } : {}),
      };
      return initial ? updateEmailAutomation(initial.id, body) : createEmailAutomation(body);
    },
    onSuccess: () => {
      toast.success(initial ? "Automation saved." : "Automation created. It is switched off until you turn it on.");
      void qc.invalidateQueries({ queryKey: ["email"] });
      onClose();
    },
    onError: (e) => setError(describeApiError(e)),
  });

  return (
    <Modal title={initial ? "Edit automation" : "New automation"} label="Email automation" onClose={onClose}>
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); setError(null); save.mutate(); }}>
        <label className="grid gap-1 text-xs text-white/60">
          Name
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Welcome new accounts" required maxLength={120} />
        </label>
        <label className="grid gap-1 text-xs text-white/60">
          Trigger
          <select className={inputCls} value={trigger} onChange={(e) => { const next = e.target.value as EmailAutomationInput["trigger"]; setTrigger(next); const chosen = templates.data?.find((t) => t.id === templateId); if (next === "SCHEDULED_EMAIL" && chosen && chosen.type !== "PROMOTIONAL") setTemplateId(""); }} disabled={!!initial}>
            <option value="USER_REGISTERED">User registered (after they verify their email)</option>
            <option value="FOLLOW_UP">Follow-up (a delay after a real event)</option>
            <option value="SCHEDULED_EMAIL">Scheduled email (all eligible accounts, at a set time)</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs text-white/60">
          Email template
          <select className={inputCls} value={templateId} onChange={(e) => setTemplateId(e.target.value)} required>
            <option value="">Choose a template…</option>
            {templates.data?.filter((t) => t.status === "ACTIVE" && (trigger !== "SCHEDULED_EMAIL" || t.type === "PROMOTIONAL")).map((t) => <option key={t.id} value={t.id}>{t.name}{t.type === "PROMOTIONAL" ? " (promotional)" : ""}</option>)}
          </select>
          {trigger === "SCHEDULED_EMAIL" && <span className="text-white/40">A scheduled email goes to many people, so only Promotional templates are offered. It is sent only to people who opted in to marketing and have not unsubscribed.</span>}
        </label>
        {trigger === "FOLLOW_UP" && (
          <label className="grid gap-1 text-xs text-white/60">
            Counts from
            <select className={inputCls} value={anchor} onChange={(e) => setAnchor(e.target.value)}>
              <option value="USER_REGISTERED">Account registered (email verified)</option>
              <option value="DEMO_REQUESTED">Demo requested by a signed-in account</option>
            </select>
          </label>
        )}
        {trigger !== "SCHEDULED_EMAIL" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-xs text-white/60">
              {trigger === "FOLLOW_UP" ? "Wait" : "Delay (0 = right away)"}
              <input type="number" min={0} step={1} className={inputCls} value={delayValue} onChange={(e) => setDelayValue(e.target.value)} required />
            </label>
            <label className="grid gap-1 text-xs text-white/60">
              Unit
              <select className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value as "1" | "60" | "1440")}>
                <option value="1">minutes</option>
                <option value="60">hours</option>
                <option value="1440">days</option>
              </select>
            </label>
          </div>
        ) : (
          <label className="grid gap-1 text-xs text-white/60">
            Send at (your time zone: {TZ})
            <input type="datetime-local" className={inputCls} value={when} onChange={(e) => setWhen(e.target.value)} required />
          </label>
        )}
        {error && <p role="alert" className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

function History({ automation, onClose }: { automation: EmailAutomation; onClose: () => void }) {
  const q = useQuery({ queryKey: ["email", "activity", "automation", automation.id], queryFn: () => fetchEmailActivity({ automationId: automation.id }) });
  return (
    <Modal title={`History: ${automation.name}`} label="Execution history" onClose={onClose} wide>
      {q.isLoading && <p className="text-sm text-white/35">Loading…</p>}
      {q.isError && <ErrorNote message={describeApiError(q.error)} />}
      {q.data?.items.length === 0 && <p className="text-sm text-white/45">It has not run yet.</p>}
      <ul className="divide-y divide-white/5">
        {q.data?.items.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span className="min-w-0 truncate text-white/80">{m.toEmail}</span>
            <span className="flex items-center gap-2 text-xs text-white/45">
              {whenLocal(m.sentAt ?? m.scheduledFor)}
              <MessageStatus status={m.status} />
              {m.failureReason && <span className="max-w-48 truncate text-amber-300/80" title={reasonText(m.failureReason)}>{reasonText(m.failureReason)}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export function AutomationsTab({ engineEnabled }: { engineEnabled: boolean }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["email", "automations"], queryFn: fetchEmailAutomations });
  const [editing, setEditing] = useState<EmailAutomation | "new" | null>(null);
  const [history, setHistory] = useState<EmailAutomation | null>(null);
  const refresh = () => void qc.invalidateQueries({ queryKey: ["email"] });
  const toggle = useMutation({
    mutationFn: (a: EmailAutomation) => setEmailAutomationActive(a.id, !a.isActive),
    onSuccess: refresh,
    onError: (e) => toast.error(describeApiError(e)),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteEmailAutomation(id),
    onSuccess: () => { toast.success("Automation deleted."); refresh(); },
    onError: (e) => toast.error(describeApiError(e)),
  });

  const describe = (a: EmailAutomation) =>
    a.trigger === "USER_REGISTERED"
      ? `When someone verifies their email, send ${delayText(a.delayMinutes)}`
      : a.trigger === "FOLLOW_UP"
        ? `${delayText(a.delayMinutes)} after a ${ANCHOR_LABEL[a.anchorEvent ?? ""] ?? "event"}`
        : `At ${whenLocal(a.scheduledAt)} to every eligible account`;

  return (
    <Panel title="Automations" action={<button className={btnPrimary} onClick={() => setEditing("new")}><Plus size={14} /> New automation</button>}>
      {!engineEnabled && <p className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">The automation engine is switched off on the server (EMAIL_AUTOMATION_ENABLED), so nothing below will send until it is turned on.</p>}
      {q.isError && <ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} />}
      {q.isLoading && <p className="text-sm text-white/35">Loading…</p>}
      {q.data?.length === 0 && <EmptyState icon={Workflow} title="No automations yet" description="Create a welcome email, a follow-up or a scheduled email. New automations start switched off." compact />}
      <ul className="divide-y divide-white/5">
        {q.data?.map((a) => {
          const finished = !!a.firedAt || !!a.expiredAt;
          return (
            <li key={a.id} className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-white">{a.name}</span>
                  <StatusPill tone="info">{TRIGGER_LABEL[a.trigger]}</StatusPill>
                  {a.firedAt && <StatusPill tone="ok">Sent</StatusPill>}
                  {a.expiredAt && <StatusPill tone="warn">Expired</StatusPill>}
                </div>
                <p className="mt-0.5 text-xs text-white/45">{describe(a)} · template “{a.template.name}” {a.template.status !== "ACTIVE" && <span className="text-amber-300/80">(not active)</span>}</p>
                <p className="mt-0.5 text-xs text-white/35">{a.runs.sent} sent · {a.runs.queued} waiting · {a.runs.failed} failed · {a.runs.skipped} skipped{a.runs.needsReview > 0 && <span className="text-amber-300/90"> · {a.runs.needsReview} need review</span>}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 text-sm text-white/70">
                  <input type="checkbox" role="switch" checked={a.isActive} disabled={toggle.isPending || (finished && !a.isActive)} onChange={() => toggle.mutate(a)} aria-label={`${a.name} is ${a.isActive ? "on" : "off"}`} />
                  {a.isActive ? "On" : "Off"}
                </label>
                <button className={btnGhost} onClick={() => setHistory(a)}>History</button>
                <button className={btnGhost} onClick={() => setEditing(a)} disabled={!!a.firedAt} aria-label={`Edit ${a.name}`}><Pencil size={14} /></button>
                <button className={btnGhost} onClick={() => window.confirm(`Delete “${a.name}”? Waiting emails are cancelled; sent history stays.`) && del.mutate(a.id)} aria-label={`Delete ${a.name}`}><Trash2 size={14} /></button>
              </div>
            </li>
          );
        })}
      </ul>
      {editing && <AutomationEditor initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {history && <History automation={history} onClose={() => setHistory(null)} />}
    </Panel>
  );
}
