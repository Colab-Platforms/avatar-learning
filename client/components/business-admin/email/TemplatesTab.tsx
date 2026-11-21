"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Eye, Mail, Pencil, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import {
  archiveEmailTemplate,
  createEmailTemplate,
  describeApiError,
  fetchEmailTemplates,
  previewEmail,
  searchEmailRecipients,
  sendEmailManually,
  sendTestEmail,
  updateEmailTemplate,
  type EmailTemplate,
  type EmailTemplateInput,
} from "@/lib/businessAdminApi";
import { Modal } from "@/components/business-admin/admins/AdminDialogs";
import { EmptyState, ErrorNote, Panel, StatusPill } from "@/components/business-admin/ui";
import { TZ, VARIABLES, btnGhost, btnPrimary, inputCls, localToIso, reasonText } from "./shared";

const BLANK: EmailTemplateInput = { name: "", subject: "", htmlBody: "<p>Hi {{first_name}},</p>\n<p></p>", textBody: "", type: "TRANSACTIONAL", status: "ACTIVE" };

/** Sandboxed preview: scripts, forms and navigation inside the email HTML cannot run. */
function PreviewFrame({ html }: { html: string }) {
  return <iframe title="Email preview" sandbox="" srcDoc={html} className="h-80 w-full rounded-lg border border-white/10 bg-white" />;
}

function TemplateEditor({ initial, onClose }: { initial: EmailTemplate | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState<EmailTemplateInput>(initial ? { name: initial.name, subject: initial.subject, htmlBody: initial.htmlBody, textBody: initial.textBody ?? "", type: initial.type, status: initial.status === "INACTIVE" ? "INACTIVE" : "ACTIVE" } : BLANK);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () => (initial ? updateEmailTemplate(initial.id, v) : createEmailTemplate(v)),
    onSuccess: () => {
      toast.success("Template saved.");
      void qc.invalidateQueries({ queryKey: ["email"] });
      onClose();
    },
    onError: (e) => setError(describeApiError(e)),
  });
  const prev = useMutation({
    mutationFn: () => previewEmail({ draft: v }),
    onSuccess: (r) => {
      setError(null);
      setPreview(r);
    },
    onError: (e) => setError(describeApiError(e)),
  });
  const set = <K extends keyof EmailTemplateInput>(k: K, val: EmailTemplateInput[K]) => setV((s) => ({ ...s, [k]: val }));

  return (
    <Modal title={initial ? "Edit template" : "New template"} label="Email template" onClose={onClose} wide>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          save.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-xs text-white/60">
            Name
            <input className={inputCls} value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="Welcome email" required maxLength={120} />
          </label>
          <label className="grid gap-1 text-xs text-white/60">
            Type
            <select className={inputCls} value={v.type} onChange={(e) => set("type", e.target.value as EmailTemplateInput["type"])}>
              <option value="TRANSACTIONAL">Account / service (no marketing consent needed)</option>
              <option value="PROMOTIONAL">Promotional (only to people who opted in)</option>
            </select>
            <span className="text-white/40">Scheduled emails to everyone need a Promotional template.</span>
          </label>
        </div>
        <label className="grid gap-1 text-xs text-white/60">
          Subject
          <input className={inputCls} value={v.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Welcome to {{app_name}}, {{first_name}}" required maxLength={200} />
        </label>
        <label className="grid gap-1 text-xs text-white/60">
          HTML content
          <textarea className={`${inputCls} min-h-48 font-mono text-xs`} value={v.htmlBody} onChange={(e) => set("htmlBody", e.target.value)} required spellCheck={false} />
        </label>
        <label className="grid gap-1 text-xs text-white/60">
          Plain-text version (optional, generated from the HTML when empty)
          <textarea className={`${inputCls} min-h-20 text-xs`} value={v.textBody ?? ""} onChange={(e) => set("textBody", e.target.value)} />
        </label>
        <p className="text-xs text-white/40">
          Variables: {VARIABLES.map((n) => <code key={n} className="mr-1.5 rounded bg-white/5 px-1 py-0.5 text-white/60">{`{{${n}}}`}</code>)}
          {v.type === "PROMOTIONAL" && " An unsubscribe link is added to the bottom automatically."}
        </p>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={v.status === "ACTIVE"} onChange={(e) => set("status", e.target.checked ? "ACTIVE" : "INACTIVE")} />
          Active (inactive templates cannot be sent)
        </label>

        {preview && (
          <div className="grid gap-2">
            <p className="text-xs text-white/50">
              Preview with sample data. Subject: <span className="text-white/80">{preview.subject}</span>
            </p>
            <PreviewFrame html={preview.html} />
          </div>
        )}
        {error && <p role="alert" className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="button" className={btnGhost} onClick={() => prev.mutate()} disabled={prev.isPending}><Eye size={14} /> Preview</button>
          <button type="submit" className={btnPrimary} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save template"}</button>
        </div>
      </form>
    </Modal>
  );
}

function SendDialog({ template, onClose }: { template: EmailTemplate; onClose: () => void }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [when, setWhen] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string[] | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  const people = useQuery({ queryKey: ["email", "recipients", debounced], queryFn: () => searchEmailRecipients(debounced) });
  const promo = template.type === "PROMOTIONAL";
  const ids = Object.keys(picked);

  const send = useMutation({
    mutationFn: () => sendEmailManually({ templateId: template.id, userIds: ids, scheduledFor: localToIso(when) }),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: ["email"] });
      const lines = r.results.map((x) => `${x.email ?? x.userId}: ${x.outcome === "needs_review" ? "needs review (outcome unknown, check Resend)" : x.outcome}${x.reason ? ` (${reasonText(x.reason)})` : ""}`);
      setSummary(lines);
      const ok = r.results.filter((x) => x.outcome === "sent" || x.outcome === "queued").length;
      if (ok) toast.success(`${ok} email${ok === 1 ? "" : "s"} ${when ? "scheduled" : "sent"}.`);
    },
    onError: (e) => setError(describeApiError(e)),
  });

  return (
    <Modal title={`Send “${template.name}”`} label="Send email" onClose={onClose}>
      {summary ? (
        <div className="grid gap-3">
          <ul className="grid gap-1 text-sm text-white/70">{summary.map((l) => <li key={l}>{l}</li>)}</ul>
          <div className="flex justify-end"><button className={btnPrimary} onClick={onClose}>Done</button></div>
        </div>
      ) : (
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); setError(null); send.mutate(); }}>
          <p className="text-xs text-white/45">Emails can only go to existing, verified Avatar AI Adoption accounts{promo ? ", and only to people who opted in to marketing" : ""}. Up to 25 at a time.</p>
          <label className="grid gap-1 text-xs text-white/60">
            Find people
            <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or email" />
          </label>
          <ul className="max-h-48 divide-y divide-white/5 overflow-y-auto rounded-lg border border-white/10">
            {people.data?.length === 0 && <li className="px-3 py-2 text-sm text-white/40">No matching accounts.</li>}
            {people.data?.map((p) => {
              const blocked = promo && (!p.marketingOptIn || p.unsubscribed);
              return (
                <li key={p.id}>
                  <label className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm ${blocked ? "opacity-50" : ""}`}>
                    <input
                      type="checkbox"
                      checked={p.id in picked}
                      disabled={blocked}
                      onChange={(e) => setPicked((s) => { const n = { ...s }; if (e.target.checked) n[p.id] = p.email; else delete n[p.id]; return n; })}
                    />
                    <span className="min-w-0 flex-1"><span className="block truncate text-white/85">{p.name}</span><span className="block truncate text-xs text-white/45">{p.email}</span></span>
                    {blocked && <span className="text-[11px] text-amber-300/80">{p.unsubscribed ? "Unsubscribed" : "No consent"}</span>}
                  </label>
                </li>
              );
            })}
          </ul>
          <label className="grid gap-1 text-xs text-white/60">
            Send later (optional, your time zone: {TZ})
            <input type="datetime-local" className={inputCls} value={when} onChange={(e) => setWhen(e.target.value)} />
          </label>
          {error && <p role="alert" className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={btnPrimary} disabled={ids.length === 0 || send.isPending}><Send size={14} /> {send.isPending ? "Sending…" : when ? `Schedule for ${ids.length}` : `Send to ${ids.length}`}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function TemplatesTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["email", "templates"], queryFn: fetchEmailTemplates });
  const [editing, setEditing] = useState<EmailTemplate | "new" | null>(null);
  const [sending, setSending] = useState<EmailTemplate | null>(null);
  const [viewing, setViewing] = useState<{ t: EmailTemplate; subject: string; html: string } | null>(null);
  const done = () => void qc.invalidateQueries({ queryKey: ["email"] });

  const test = useMutation({
    mutationFn: (id: string) => sendTestEmail(id),
    onSuccess: (r) => (r.status === "SENT" ? toast.success("Test email sent to your own address.") : toast.error(`Test email failed: ${r.reason ?? "unknown error"}`)),
    onError: (e) => toast.error(describeApiError(e)),
  });
  const archive = useMutation({
    mutationFn: (id: string) => archiveEmailTemplate(id),
    onSuccess: () => { toast.success("Template archived."); done(); },
    onError: (e) => toast.error(describeApiError(e)),
  });
  const view = useMutation({
    mutationFn: (t: EmailTemplate) => previewEmail({ templateId: t.id }).then((r) => ({ t, ...r })),
    onSuccess: setViewing,
    onError: (e) => toast.error(describeApiError(e)),
  });

  return (
    <Panel title="Email templates" action={<button className={btnPrimary} onClick={() => setEditing("new")}><Plus size={14} /> New template</button>}>
      {q.isError && <ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} />}
      {q.isLoading && <p className="text-sm text-white/35">Loading…</p>}
      {q.data?.length === 0 && <EmptyState icon={Mail} title="No templates yet" description="Create a template, then use it in an automation or send it by hand." compact />}
      {q.data && q.data.length > 0 && (
        <ul className="divide-y divide-white/5">
          {q.data.map((t) => (
            <li key={t.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-white">{t.name}</span>
                  <StatusPill tone={t.status === "ACTIVE" ? "ok" : "off"}>{t.status === "ACTIVE" ? "Active" : "Inactive"}</StatusPill>
                  <StatusPill tone={t.type === "PROMOTIONAL" ? "warn" : "info"}>{t.type === "PROMOTIONAL" ? "Promotional" : "Account / service"}</StatusPill>
                </div>
                <p className="mt-0.5 truncate text-xs text-white/45">{t.subject}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={btnGhost} onClick={() => view.mutate(t)} aria-label={`Preview ${t.name}`}><Eye size={14} /> Preview</button>
                <button className={btnGhost} onClick={() => setEditing(t)} aria-label={`Edit ${t.name}`}><Pencil size={14} /> Edit</button>
                <button className={btnGhost} onClick={() => test.mutate(t.id)} disabled={test.isPending} aria-label={`Send test of ${t.name} to me`}><Mail size={14} /> Test to me</button>
                <button className={btnGhost} onClick={() => setSending(t)} disabled={t.status !== "ACTIVE"} aria-label={`Send ${t.name}`}><Send size={14} /> Send</button>
                <button className={btnGhost} onClick={() => window.confirm(`Archive “${t.name}”?`) && archive.mutate(t.id)} aria-label={`Archive ${t.name}`}><Archive size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <TemplateEditor initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {sending && <SendDialog template={sending} onClose={() => setSending(null)} />}
      {viewing && (
        <Modal title={viewing.t.name} label="Template preview" onClose={() => setViewing(null)} wide>
          <p className="mb-2 text-xs text-white/50">Sample data. Subject: <span className="text-white/80">{viewing.subject}</span></p>
          <PreviewFrame html={viewing.html} />
        </Modal>
      )}
    </Panel>
  );
}
