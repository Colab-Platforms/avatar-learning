"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, History, Pencil, Plus, RotateCcw, Trash2, Workflow } from "lucide-react";
import {
  apiErrorField,
  createRule,
  deleteRule,
  describeApiError,
  fetchApprovedTemplates,
  fetchAutomationMeta,
  fetchExecutions,
  fetchRules,
  retryExecution,
  seedSuggestedTemplates,
  setRuleActive,
  simulateActivity,
  updateRule,
  type ApprovedTemplate,
  type AutomationEvent,
  type AutomationExecution,
  type AutomationRule,
  type EndpointInfo,
  type RuleInput,
  type VariableSource,
} from "@/lib/businessAdminApi";
import { renderPreview } from "@/lib/templateLogic";
import { Modal } from "@/components/business-admin/admins/AdminDialogs";
import { EmptyState, ErrorNote, Panel, StatusPill, formatWhen } from "@/components/business-admin/ui";

const input = "w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none";
type Tab = "activities" | "history";

const EXEC_TONE: Record<string, "ok" | "warn" | "off" | "info"> = { SENT: "ok", DELIVERED: "ok", READ: "ok", QUEUED: "info", SENDING: "info", FAILED: "warn", SKIPPED: "off" };
const SKIP_TEXT: Record<string, string> = {
  AUTOMATION_DISABLED: "Automation sending is switched off on the server",
  CONSENT_WITHDRAWN: "Customer opted out",
  OPT_IN_REQUIRED: "No recorded opt-in and outside the 24-hour window",
  WINDOW_CLOSED: "24-hour window closed",
  TEMPLATE_INVALID: "Template no longer approved",
  TEMPLATE_UNAVAILABLE: "Template no longer approved",
  MISSING_VARIABLE: "A template value was missing",
  NO_PHONE: "No valid WhatsApp number on the event",
  EXPIRED: "Waited too long to send safely",
  NO_CONVERSATION: "No conversation",
};

/** The real website endpoint behind an activity, exactly as the code has it. */
export function EndpointLine({ ep }: { ep: EndpointInfo | null }) {
  if (!ep) return <StatusPill tone="off">Endpoint not connected</StatusPill>;
  if (ep.status === "connected") {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono font-semibold text-emerald-300">{ep.method}</span>
        <code className="text-white/70">{ep.route}</code>
        <StatusPill tone="ok">Connected</StatusPill>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {ep.route && (
        <>
          <span className="rounded bg-white/8 px-1.5 py-0.5 font-mono font-semibold text-white/60">{ep.method}</span>
          <code className="text-white/50">{ep.route}</code>
        </>
      )}
      <StatusPill tone="warn">Endpoint not connected</StatusPill>
    </span>
  );
}

function RuleEditor({ rule, event: presetEvent, events, onClose }: { rule: AutomationRule | null; event: AutomationEvent | null; events: AutomationEvent[]; onClose: () => void }) {
  const qc = useQueryClient();
  const templates = useQuery({ queryKey: ["biz-approved-templates"], queryFn: fetchApprovedTemplates, retry: false });
  const first = presetEvent ?? events[0];
  const [v, setV] = useState<RuleInput>(
    rule
      ? { name: rule.name, triggerEvent: rule.triggerEvent, templateName: rule.templateName, templateLanguage: rule.templateLanguage, variableMapping: structuredClone(rule.variableMapping) }
      : { name: first?.activity ?? "", triggerEvent: first?.key ?? "", templateName: "", templateLanguage: "", variableMapping: {} },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const items = templates.data?.items ?? [];
  const tpl: ApprovedTemplate | undefined = items.find((t) => t.name === v.templateName && t.language === v.templateLanguage);
  const event = events.find((e) => e.key === v.triggerEvent);

  // New activity: if the suggested template is already approved, preselect it with its default mapping.
  useEffect(() => {
    if (rule || v.templateName || !event) return;
    const s = items.find((t) => t.name === event.suggested.name);
    if (!s) return;
    const mapping: Record<string, VariableSource> = {};
    s.variables.forEach((n, i) => {
      const key = event.suggested.mapping[i];
      if (key) mapping[n] = { source: "field", key, fallback: key === "name" ? "there" : undefined };
    });
    setV((p) => ({ ...p, templateName: s.name, templateLanguage: s.language, variableMapping: mapping }));
  }, [items, event, rule, v.templateName]);

  const save = useMutation({
    mutationFn: () => (rule ? updateRule(rule.id, v) : createRule(v)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["biz-rules"] });
      onClose();
    },
    onError: (err) => setErrors({ [apiErrorField(err) ?? "form"]: describeApiError(err) }),
  });
  const setMap = (variable: string, m: VariableSource) => setV((p) => ({ ...p, variableMapping: { ...p.variableMapping, [variable]: m } }));
  const err = (k: string) => (errors[k] ? <span role="alert" className="mt-1 block text-xs text-red-300">{errors[k]}</span> : null);
  const label = (t: string) => <span className="mb-1 block text-xs font-semibold text-white/60">{t}</span>;

  // Live message preview: event fields show as «Customer name», fixed text as typed.
  const preview = useMemo(() => {
    if (!tpl) return "";
    const samples: Record<string, string> = {};
    for (const n of tpl.variables) {
      const m = v.variableMapping[n];
      samples[n] = m?.source === "static" ? m.value : m?.source === "field" ? `‹${event?.fields.find((f) => f.key === m.key)?.label ?? m.key}›` : "";
    }
    return renderPreview(tpl.body, samples);
  }, [tpl, v.variableMapping, event]);

  return (
    <Modal title={rule ? "Edit activity" : "New activity"} label="Activity editor" wide onClose={onClose}>
      <form
        noValidate
        className="grid gap-5 md:grid-cols-[1fr_17rem]"
        onSubmit={(e) => {
          e.preventDefault();
          setErrors({});
          save.mutate();
        }}
      >
        <div className="min-w-0 space-y-3.5">
          <label className="block">
            {label("Activity name")}
            <input name="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={input} placeholder="Book a demo" />
            {err("name")}
          </label>
          <label className="block">
            {label("Trigger event")}
            <select value={v.triggerEvent} onChange={(e) => setV({ ...v, triggerEvent: e.target.value, templateName: "", templateLanguage: "", variableMapping: {} })} className={input}>
              {events.map((e) => (
                <option key={e.key} value={e.key}>{e.label} ({e.key})</option>
              ))}
            </select>
            {event && <span className="mt-1 block text-xs text-white/35">{event.description}</span>}
            {err("triggerEvent")}
          </label>
          <div className="rounded-xl border border-white/8 p-3">
            <p className="mb-1.5 text-xs font-semibold text-white/60">Website endpoint</p>
            <EndpointLine ep={event?.endpoint ?? null} />
            {event?.endpoint?.firesWhen && event.endpoint.status === "connected" && <p className="mt-1.5 text-xs text-white/40">{event.endpoint.firesWhen}</p>}
            {event?.endpoint && event.endpoint.alsoVia.length > 0 && <p className="mt-1 text-xs text-white/35">Also fires from: {event.endpoint.alsoVia.join("; ")}</p>}
            {event?.endpoint?.needs && (
              <p className="mt-2 flex gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                <AlertTriangle size={14} className="mt-px shrink-0" /> {event.endpoint.needs} You can still configure this activity now; it only starts running once the endpoint is connected.
              </p>
            )}
          </div>
          <label className="block">
            {label("Send this approved template")}
            <select
              value={tpl ? `${tpl.name}::${tpl.language}` : ""}
              onChange={(e) => {
                const [name, language] = e.target.value.split("::");
                setV({ ...v, templateName: name ?? "", templateLanguage: language ?? "", variableMapping: {} });
              }}
              className={input}
            >
              <option value="">{templates.isLoading ? "Loading…" : "Choose a template"}</option>
              {items.map((t) => (
                <option key={`${t.name}::${t.language}`} value={`${t.name}::${t.language}`}>{t.name} ({t.language})</option>
              ))}
            </select>
            {templates.isError && <span className="mt-1 block text-xs text-red-300">{describeApiError(templates.error)}</span>}
            {!templates.isLoading && !templates.isError && items.length === 0 && (
              <span className="mt-1 block text-xs text-amber-300">No approved templates yet. Create and submit one in WhatsApp Inbox → Templates, then wait for Meta to approve it.</span>
            )}
            {event && <span className="mt-1 block text-xs text-white/35">Suggested: “{event.suggested.name}” — create it as a draft with “Create suggested template drafts”.</span>}
            {err("templateName")}
          </label>
          {tpl && tpl.variables.length > 0 && (
            <div className="space-y-2.5 rounded-xl border border-white/8 p-3">
              <p className="text-xs text-white/50">Fill each template variable:</p>
              {tpl.variables.map((n) => {
                const m = v.variableMapping[n];
                const mode = m?.source ?? "field";
                return (
                  <div key={n} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <code className="w-24 shrink-0 truncate text-xs text-brand-300">{`{{${n}}}`}</code>
                      <select aria-label={`Source for ${n}`} value={mode} onChange={(e) => setMap(n, e.target.value === "static" ? { source: "static", value: "" } : { source: "field", key: event?.fields[0]?.key ?? "" })} className={input}>
                        <option value="field">From the event</option>
                        <option value="static">Fixed text</option>
                      </select>
                    </div>
                    {m?.source === "static" ? (
                      <input aria-label={`Text for ${n}`} value={m.value} onChange={(e) => setMap(n, { source: "static", value: e.target.value })} className={input} placeholder="Text to always use" />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <select aria-label={`Field for ${n}`} value={m?.key ?? ""} onChange={(e) => setMap(n, { source: "field", key: e.target.value, fallback: m?.source === "field" ? m.fallback : undefined })} className={input}>
                          <option value="">Choose a field</option>
                          {event?.fields.map((f) => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                        </select>
                        <input aria-label={`Fallback for ${n}`} value={m?.source === "field" ? (m.fallback ?? "") : ""} onChange={(e) => setMap(n, { source: "field", key: m?.source === "field" ? m.key : "", fallback: e.target.value })} className={input} placeholder="If empty, use…" />
                      </div>
                    )}
                    {err(`variableMapping.${n}`)}
                  </div>
                );
              })}
            </div>
          )}
          {err("form")}
          <p className="text-xs text-white/40">New activities are saved switched off. Messages go only to customers who have not opted out, and only when the server has automation sending enabled.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={save.isPending} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-50">{save.isPending ? "Saving…" : "Save activity"}</button>
          </div>
        </div>
        <div className="md:sticky md:top-0 md:self-start">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">Message preview</p>
          <div className="rounded-2xl bg-[#0b141a] p-3">
            <div className="rounded-xl rounded-tl-sm bg-[#202c33] p-3 text-[13px] leading-snug text-white/90" data-testid="rule-preview">
              {preview ? <p className="whitespace-pre-wrap">{preview}</p> : <p className="text-white/30">Choose a template to preview the message.</p>}
            </div>
          </div>
          <p className="mt-2 text-[11px] text-white/35">‹Names in brackets› are replaced with the customer's real details when the activity runs.</p>
        </div>
      </form>
    </Modal>
  );
}

/** Dev sandbox only: pretend a customer just did this. The mock sender is the only thing that can "send". */
function SimulateDialog({ ev, onClose }: { ev: AutomationEvent; onClose: () => void }) {
  const qc = useQueryClient();
  const [phone, setPhone] = useState("15555550101");
  const [outcome, setOutcome] = useState<"success" | "failed" | "incomplete">("success");
  const [eventId, setEventId] = useState(() => `sim-${Math.random().toString(36).slice(2, 8)}`);
  const [result, setResult] = useState<string | null>(null);
  const run = useMutation({
    mutationFn: () => simulateActivity({ event: ev.key, phone, eventId }),
    onSuccess: (r) => {
      setResult(r.matched === 0 ? "No active rule for this activity: nothing was queued." : `Matched ${r.matched} rule · queued ${r.queued} · skipped ${r.skipped} · duplicate (already handled) ${r.duplicates}. See Execution history and the WhatsApp Inbox.`);
      void qc.invalidateQueries({ queryKey: ["biz-executions"] });
      void qc.invalidateQueries({ queryKey: ["biz-automation-meta"] });
      void qc.invalidateQueries({ queryKey: ["biz-inbox"] });
    },
    onError: (e) => setResult(describeApiError(e)),
  });
  return (
    <Modal title={`Simulate: ${ev.activity}`} label="Simulate customer action" onClose={onClose}>
      <form
        className="space-y-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          setResult(null);
          // Like the real website code, nothing is emitted unless the customer's action actually succeeded.
          if (outcome !== "success") return setResult(`No event fired: the customer's action ${outcome === "failed" ? "failed" : "was not completed"}, so no message is triggered.`);
          run.mutate();
        }}
      >
        <p className="text-xs text-white/45">Sandbox only. This sends nothing to WhatsApp: the message goes to a mock sender and appears in the sandbox Inbox.</p>
        <label className="block"><span className="mb-1 block text-xs font-semibold text-white/60">Customer</span>
          <select aria-label="Customer" value={phone} onChange={(e) => setPhone(e.target.value)} className={input}>
            <option value="15555550101">Test Contact One · inside 24h window</option>
            <option value="15555550104">Test Contact Four · window closed, no opt-in</option>
          </select>
        </label>
        <label className="block"><span className="mb-1 block text-xs font-semibold text-white/60">Customer action result</span>
          <select aria-label="Action result" value={outcome} onChange={(e) => setOutcome(e.target.value as typeof outcome)} className={input}>
            <option value="success">Completed successfully</option>
            <option value="failed">Failed</option>
            <option value="incomplete">Incomplete / abandoned</option>
          </select>
        </label>
        <label className="block"><span className="mb-1 block text-xs font-semibold text-white/60">Event id (repeat the same id to test duplicate prevention)</span>
          <input aria-label="Event id" value={eventId} onChange={(e) => setEventId(e.target.value)} className={input} />
        </label>
        {result && <p role="status" data-testid="simulate-result" className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80">{result}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Close</button>
          <button type="submit" disabled={run.isPending} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-50">{run.isPending ? "Running…" : "Run simulation"}</button>
        </div>
      </form>
    </Modal>
  );
}

function ActivityRow({ ev, sandbox, onSimulate, rules, onConfigure, onEdit, onToggle, onDelete, onHistory, busy }: {
  ev: AutomationEvent;
  sandbox: boolean;
  onSimulate: () => void;
  rules: AutomationRule[];
  onConfigure: () => void;
  onEdit: (r: AutomationRule) => void;
  onToggle: (r: AutomationRule) => void;
  onDelete: (r: AutomationRule) => void;
  onHistory: (r: AutomationRule) => void;
  busy: boolean;
}) {
  const connected = ev.endpoint?.status === "connected";
  return (
    <li className="px-5 py-4" data-testid="activity-row" data-event={ev.key}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{ev.activity}</h3>
            <code className="text-[11px] text-white/35">{ev.key}</code>
          </div>
          <div className="mt-1.5"><EndpointLine ep={ev.endpoint} /></div>
        </div>
        <div className="flex shrink-0 gap-2">
          {sandbox && <button type="button" onClick={onSimulate} className="rounded-lg border border-brand-500/30 px-3 py-1.5 text-xs font-semibold text-brand-300 hover:bg-brand-500/10">Simulate</button>}
          <button type="button" onClick={onConfigure} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5">
            <Plus size={13} /> {rules.length ? "Add another message" : "Configure"}
          </button>
        </div>
      </div>
      {!connected && ev.endpoint?.needs && <p className="mt-2 text-xs text-amber-200/80">{ev.endpoint.needs}</p>}
      {rules.length === 0 ? (
        <p className="mt-2 text-xs text-white/35">Not configured. No message is sent for this activity.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rules.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/[0.02] px-3.5 py-2.5" data-testid="rule-row">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-white">{r.name}</span>
                  <StatusPill tone={r.isActive ? "ok" : "off"}>{r.isActive ? "On" : "Off"}</StatusPill>
                  {r.isActive && !connected && <StatusPill tone="warn">Waiting for endpoint</StatusPill>}
                </div>
                <p className="mt-0.5 text-xs text-white/45">Sends <code className="text-brand-300">{r.templateName}</code> ({r.templateLanguage})</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => onHistory(r)} aria-label={`History of ${r.name}`} title="Execution history" className="rounded-lg border border-white/10 p-1.5 text-white/60 hover:bg-white/5"><History size={14} /></button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={r.isActive}
                  aria-label={`${r.isActive ? "Disable" : "Enable"} ${r.name}`}
                  disabled={busy}
                  onClick={() => onToggle(r)}
                  className={`relative h-6 w-11 rounded-full transition ${r.isActive ? "bg-emerald-500" : "bg-white/15"} disabled:opacity-50`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${r.isActive ? "left-[22px]" : "left-0.5"}`} />
                </button>
                <button type="button" aria-label={`Edit ${r.name}`} onClick={() => onEdit(r)} className="rounded-lg border border-white/10 p-1.5 text-white/60 hover:bg-white/5"><Pencil size={14} /></button>
                <button type="button" aria-label={`Delete ${r.name}`} onClick={() => onDelete(r)} className="rounded-lg border border-white/10 p-1.5 text-white/60 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Activities({ events, sandbox, onHistory }: { events: AutomationEvent[]; sandbox: boolean; onHistory: (r: AutomationRule) => void }) {
  const [simulating, setSimulating] = useState<AutomationEvent | null>(null);
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["biz-rules"], queryFn: fetchRules, retry: false });
  const [editing, setEditing] = useState<{ rule: AutomationRule | null; event: AutomationEvent | null } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const refresh = () => void qc.invalidateQueries({ queryKey: ["biz-rules"] });
  const toggle = useMutation({
    mutationFn: (r: AutomationRule) => setRuleActive(r.id, !r.isActive),
    onSuccess: () => (setProblem(null), refresh()),
    onError: (e) => setProblem(describeApiError(e)),
  });
  const remove = useMutation({ mutationFn: (id: string) => deleteRule(id), onSuccess: refresh, onError: (e) => setProblem(describeApiError(e)) });
  const seed = useMutation({
    mutationFn: () => seedSuggestedTemplates(),
    onSuccess: (r) => {
      setProblem(null);
      void qc.invalidateQueries({ queryKey: ["biz-templates"] });
      setNotice(`${r.created.length} template draft${r.created.length === 1 ? "" : "s"} saved${r.skipped.length ? `, ${r.skipped.length} already existed` : ""}. They are local drafts: open WhatsApp Inbox → Templates to review, edit and submit them to Meta.`);
    },
    onError: (e) => setProblem(describeApiError(e)),
  });
  const rules = list.data?.items ?? [];
  const byEvent = useMemo(() => {
    const m = new Map<string, AutomationRule[]>();
    for (const r of rules) m.set(r.triggerEvent, [...(m.get(r.triggerEvent) ?? []), r]);
    return m;
  }, [rules]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-2xl text-sm text-white/45">Each customer activity can send an approved WhatsApp template. The website endpoint shown is the real one that performs the activity.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => seed.mutate()} disabled={seed.isPending} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/5 disabled:opacity-50">
            {seed.isPending ? "Saving drafts…" : "Create suggested template drafts"}
          </button>
          <button type="button" onClick={() => setEditing({ rule: null, event: null })} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-400">
            <Plus size={14} /> New activity
          </button>
        </div>
      </div>
      {notice && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">{notice}</p>}
      {problem && <ErrorNote message={problem} />}
      {list.isError && <ErrorNote message={describeApiError(list.error)} onRetry={() => void list.refetch()} />}
      {list.isLoading ? (
        <p className="text-sm text-white/40">Loading activities…</p>
      ) : events.length === 0 ? (
        <EmptyState icon={Workflow} compact title="No activities available" description="The activity catalog could not be loaded." />
      ) : (
        <Panel flush>
          <ul className="divide-y divide-white/6">
            {events.map((ev) => (
              <ActivityRow
                key={ev.key}
                ev={ev}
                sandbox={sandbox}
                onSimulate={() => setSimulating(ev)}
                rules={byEvent.get(ev.key) ?? []}
                busy={toggle.isPending}
                onConfigure={() => setEditing({ rule: null, event: ev })}
                onEdit={(r) => setEditing({ rule: r, event: ev })}
                onToggle={(r) => toggle.mutate(r)}
                onDelete={(r) => window.confirm(`Delete “${r.name}”? Its history is kept.`) && remove.mutate(r.id)}
                onHistory={onHistory}
              />
            ))}
          </ul>
        </Panel>
      )}
      {simulating && <SimulateDialog ev={simulating} onClose={() => setSimulating(null)} />}
      {editing && <RuleEditor rule={editing.rule} event={editing.event} events={events} onClose={() => setEditing(null)} />}
    </div>
  );
}

function HistoryRow({ e, onRetry }: { e: AutomationExecution; onRetry: () => void }) {
  const [open, setOpen] = useState(false);
  const reason = e.skipReason ? (SKIP_TEXT[e.skipReason] ?? e.skipReason) : e.lastError;
  return (
    <li className="px-5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={EXEC_TONE[e.status] ?? "off"}>{e.status.charAt(0) + e.status.slice(1).toLowerCase()}</StatusPill>
            <span className="truncate text-sm font-medium text-white">{e.ruleName}</span>
            <span className="text-xs text-white/35">+{e.contactWaId.replace(/^(\d{2})\d+(\d{3})$/, "$1•••••$2")} · {e.templateName}</span>
          </div>
          {reason && <p className="mt-1 text-xs text-white/45">{reason}</p>}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/35">
          {formatWhen(e.createdAt)}
          {e.attempts > 0 && <span>· {e.attempts} attempt{e.attempts === 1 ? "" : "s"}</span>}
          <button type="button" onClick={() => setOpen(!open)} className="rounded border border-white/10 px-2 py-0.5 hover:bg-white/5">{open ? "Hide" : "Details"}</button>
          {e.status === "FAILED" && <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-0.5 hover:bg-white/5"><RotateCcw size={11} /> Retry</button>}
        </div>
      </div>
      {open && (
        <ol className="mt-2 space-y-0.5 border-l border-white/10 pl-3 text-xs text-white/50">
          {e.history.map((h, i) => (
            <li key={i}>{formatWhen(h.at)} · {h.event.replace(/_/g, " ")}{h.detail ? ` — ${h.detail}` : ""}</li>
          ))}
        </ol>
      )}
    </li>
  );
}

function HistoryTab({ rule, onClearRule, counts }: { rule: AutomationRule | null; onClearRule: () => void; counts: Record<string, number> }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [problem, setProblem] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["biz-executions", status, rule?.id ?? "", page], queryFn: () => fetchExecutions({ status: status || undefined, ruleId: rule?.id, page }), retry: false, refetchInterval: 15_000 });
  const items = q.data?.items ?? [];
  const total = q.data?.total ?? 0;
  const retry = useMutation({
    mutationFn: retryExecution,
    onSuccess: () => (setProblem(null), void qc.invalidateQueries({ queryKey: ["biz-executions"] })),
    onError: (e) => setProblem(describeApiError(e)),
  });
  const stat = (label: string, keys: string[]) => (
    <div key={label} className="rounded-xl border border-white/6 bg-ink-900 px-4 py-3" data-testid={`stat-${label.toLowerCase()}`}>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-white">{keys.reduce((n, k) => n + (counts[k] ?? 0), 0)}</p>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stat("Sent", ["SENT", "DELIVERED", "READ"])}
        {stat("Delivered", ["DELIVERED", "READ"])}
        {stat("Read", ["READ"])}
        {stat("Skipped", ["SKIPPED"])}
        {stat("Failed", ["FAILED"])}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select aria-label="Filter by status" value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))} className={`${input} max-w-[12rem]`}>
            <option value="">All results</option>
            {["QUEUED", "SENT", "DELIVERED", "READ", "FAILED", "SKIPPED"].map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
          {rule && (
            <button type="button" onClick={onClearRule} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/30 px-2.5 py-1.5 text-xs text-brand-300">
              {rule.name} ✕
            </button>
          )}
        </div>
        <span className="text-xs text-white/35">{total} total</span>
      </div>
      {problem && <ErrorNote message={problem} />}
      {q.isError && <ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} />}
      {q.isLoading ? (
        <p className="text-sm text-white/40">Loading history…</p>
      ) : items.length === 0 && !q.isError ? (
        <EmptyState icon={History} compact title="No automation activity yet" description="Every time an activity runs, is skipped or fails, it is recorded here with the reason." />
      ) : (
        <Panel flush>
          <ul className="divide-y divide-white/6">
            {items.map((e) => (
              <HistoryRow key={e.id} e={e} onRetry={() => retry.mutate(e.id)} />
            ))}
          </ul>
        </Panel>
      )}
      {total > 25 && (
        <div className="flex items-center justify-end gap-2 text-sm text-white/60">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span>Page {page}</span>
          <button type="button" disabled={page * 25 >= total} onClick={() => setPage(page + 1)} className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

export function AutomationsView() {
  const meta = useQuery({ queryKey: ["biz-automation-meta"], queryFn: fetchAutomationMeta, retry: false, refetchInterval: 30_000 });
  const [tab, setTab] = useState<Tab>("activities");
  const [historyRule, setHistoryRule] = useState<AutomationRule | null>(null);
  const tabs: Array<[Tab, string]> = [["activities", "Activities"], ["history", "Execution history"]];
  return (
    <div className="space-y-5">
      {meta.data && !meta.data.enabled && (
        <div role="status" className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <b>Automatic sending is switched off.</b> You can configure and test activities, but nothing is sent until an administrator sets <code>WHATSAPP_AUTOMATION_ENABLED=true</code> on the server.
        </div>
      )}
      {meta.isError && <ErrorNote message={describeApiError(meta.error)} onRetry={() => void meta.refetch()} />}
      <div role="tablist" aria-label="Automation sections" className="flex gap-1 border-b border-white/8">
        {tabs.map(([k, t]) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === k ? "border-brand-400 text-white" : "border-transparent text-white/45 hover:text-white/70"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "activities" && (
        <Activities
          events={meta.data?.events ?? []}
          sandbox={meta.data?.sandbox === true}
          onHistory={(r) => {
            setHistoryRule(r);
            setTab("history");
          }}
        />
      )}
      {tab === "history" && <HistoryTab rule={historyRule} onClearRule={() => setHistoryRule(null)} counts={meta.data?.counts ?? {}} />}
    </div>
  );
}
