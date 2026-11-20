"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FilePlus2, Pencil, RefreshCw, Search, Send, Trash2, Upload } from "lucide-react";
import {
  apiFieldErrors,
  createManagedTemplate,
  deleteManagedTemplate,
  describeApiError,
  fetchManagedTemplates,
  submitManagedTemplate,
  syncManagedTemplates,
  updateManagedTemplate,
  uploadTemplateExample,
  type HeaderFormat,
  type ManagedTemplate,
  type TemplateButton,
  type TemplateCategory,
  type TemplateDraft,
  type TemplateInput,
} from "@/lib/businessAdminApi";
import { filterTemplates, isValidName, renderPreview, statusCounts, statusKind, statusLabel, suggestName, syncExamples, variableProblems, variablesIn, type ParameterFormat, type StatusFilter } from "@/lib/templateLogic";
import { Modal } from "@/components/business-admin/admins/AdminDialogs";
import { EmptyState, ErrorNote, Panel, formatWhen } from "@/components/business-admin/ui";
import { ApprovalPill, TemplatePreview } from "@/components/business-admin/templates/TemplatePreview";
import { MessageSquareText } from "lucide-react";

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "approved", label: "Approved" },
  { id: "pending", label: "Pending" },
  { id: "rejected", label: "Rejected" },
  { id: "draft", label: "Draft" },
];

const input = "w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none";
const LANGS: Array<[string, string]> = [["en", "English"], ["en_US", "English (US)"], ["en_GB", "English (UK)"], ["hi", "Hindi"], ["te", "Telugu"], ["ta", "Tamil"], ["kn", "Kannada"], ["ml", "Malayalam"], ["mr", "Marathi"], ["bn", "Bengali"], ["gu", "Gujarati"]];
const EMPTY: TemplateDraft = { header: null, body: { text: "" }, footer: null, buttons: [], examples: {} };

const blankInput = (): TemplateInput => ({ name: "", language: "en", category: "UTILITY", parameterFormat: "POSITIONAL", draft: structuredClone(EMPTY) });
const toInput = (t: ManagedTemplate): TemplateInput => ({ name: t.name, language: t.language, category: t.category as TemplateCategory, parameterFormat: t.parameterFormat, draft: structuredClone(t.draft) });

export function StatusBadge({ t }: { t: Pick<ManagedTemplate, "status" | "statusSource"> }) {
  return <ApprovalPill kind={statusKind(t.status, t.statusSource)}>{statusLabel(t.status, t.statusSource)}</ApprovalPill>;
}

/** Read-only view of a template exactly as it was submitted: header, body, footer, buttons and {{variables}}. */
function PreviewDialog({ t, onClose, onEdit }: { t: ManagedTemplate; onClose: () => void; onEdit?: () => void }) {
  const d = t.draft;
  const [samples, setSamples] = useState(false);
  const vars = [...variablesIn(d.body.text), ...variablesIn(d.header?.text ?? "")];
  const hasVars = vars.length > 0;
  // Only offer the toggle when sample values really exist; otherwise it would do nothing.
  const hasSamples = vars.some((v) => (d.examples[v] ?? "").trim() !== "") || (variablesIn(d.header?.text ?? "").length > 0 && (d.headerExample ?? "").trim() !== "");
  const values = samples ? { ...d.examples, ...Object.fromEntries(variablesIn(d.header?.text ?? "").map((v) => [v, d.headerExample ?? ""])) } : {};
  return (
    <Modal title="Template preview" label={`Preview of ${t.name}`} wide onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h3 className="break-all text-xl font-bold text-white" data-testid="preview-name">{t.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusBadge t={t} />
            <span className="text-xs font-medium uppercase tracking-wide text-white/65">{t.category} · {t.language} · {t.parameterFormat === "NAMED" ? "named variables" : "numbered variables"}</span>
          </div>
        </div>
        {t.rejectedReason && (
          <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300" data-testid="preview-rejected">Rejected by Meta: {t.rejectedReason.replace(/_/g, " ").toLowerCase()}</p>
        )}
        {t.lastError && <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{t.lastError}</p>}
        <TemplatePreview
          header={d.header ? { format: d.header.format, text: d.header.text } : null}
          body={d.body.text}
          footer={d.footer}
          buttons={d.buttons.map((b) => ({ type: b.type, text: "text" in b ? b.text : undefined }))}
          values={values}
          authentication={t.category === "AUTHENTICATION"}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          {hasSamples ? (
            <label className="inline-flex items-center gap-2 text-sm font-medium text-white/80">
              <input type="checkbox" checked={samples} onChange={(e) => setSamples(e.target.checked)} /> Show the sample values submitted to Meta
            </label>
          ) : (
            <span className="text-sm text-white/65" data-testid="no-samples">{hasVars ? "Variables are shown as placeholders: no sample values are stored for this template." : "This template has no variables."}</span>
          )}
          <div className="flex gap-2">
            {onEdit && (
              <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-2 text-sm font-semibold text-white/80 hover:bg-white/5"><Pencil size={14} /> Edit</button>
            )}
            <button type="button" onClick={onClose} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Close</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/** WhatsApp-style bubble preview. */
function Preview({ value }: { value: TemplateInput }) {
  const { draft } = value;
  const ex = draft.examples;
  const auth = value.category === "AUTHENTICATION";
  return (
    <div className="rounded-2xl bg-[#0b141a] p-3">
      <div className="max-w-[18rem] rounded-xl rounded-tl-sm bg-[#202c33] p-3 text-[13px] leading-snug text-white/90 shadow">
        {draft.header?.format === "TEXT" && <p className="mb-1 font-semibold">{renderPreview(draft.header.text ?? "", { ...ex, ...Object.fromEntries(variablesIn(draft.header.text ?? "").map((v) => [v, draft.headerExample ?? ""])) })}</p>}
        {draft.header && draft.header.format !== "TEXT" && <div className="mb-2 flex h-24 items-center justify-center rounded-lg bg-white/5 text-xs text-white/40">{draft.header.format.toLowerCase()} header</div>}
        <p className="whitespace-pre-wrap">{auth ? "123456 is your verification code." : renderPreview(draft.body.text, ex) || <span className="text-white/30">Your message appears here</span>}</p>
        {draft.footer && <p className="mt-1.5 text-[11px] text-white/45">{draft.footer}</p>}
        {auth && draft.authentication?.securityRecommendation && <p className="mt-1.5 text-[11px] text-white/45">For your security, do not share this code.</p>}
      </div>
      {(draft.buttons.length > 0 || auth) && (
        <div className="mt-1 max-w-[18rem] space-y-1">
          {auth ? (
            <div className="rounded-lg bg-[#202c33] py-2 text-center text-[13px] font-medium text-sky-300">{draft.authentication?.buttonText || "Copy code"}</div>
          ) : (
            draft.buttons.map((b, i) => (
              <div key={i} className="rounded-lg bg-[#202c33] py-2 text-center text-[13px] font-medium text-sky-300">
                {b.type === "COPY_CODE" ? "Copy code" : b.text || "Button"}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Editor({ existing, onClose }: { existing: ManagedTemplate | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState<TemplateInput>(existing ? toInput(existing) : blankInput());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const live = existing ? existing.statusSource === "meta" : false; // already at Meta: name/language/style are locked
  const auth = v.category === "AUTHENTICATION";
  const d = v.draft;
  const setDraft = (patch: Partial<TemplateDraft>) => setV((p) => ({ ...p, draft: { ...p.draft, ...patch } }));
  const bodyVars = useMemo(() => variablesIn(d.body.text), [d.body.text]);
  const headerVars = useMemo(() => (d.header?.format === "TEXT" ? variablesIn(d.header.text ?? "") : []), [d.header]);
  const problems = useMemo(() => (auth ? [] : variableProblems(d.body.text, v.parameterFormat)), [auth, d.body.text, v.parameterFormat]);

  const onBody = (text: string) => setV((p) => ({ ...p, draft: { ...p.draft, body: { text }, examples: syncExamples(variablesIn(text), p.draft.examples) } }));
  const save = useMutation({
    mutationFn: () => (existing ? updateManagedTemplate(existing.id, v) : createManagedTemplate(v)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["biz-templates"] });
      onClose();
    },
    onError: (err) => {
      const fe = apiFieldErrors(err);
      if (fe.length) setErrors(Object.fromEntries(fe.map((e) => [e.field, e.message])));
      else setFormError(describeApiError(err));
    },
  });
  const err = (f: string) => (errors[f] ? <span role="alert" className="mt-1 block text-xs text-red-300">{errors[f]}</span> : null);
  const label = (t: string) => <span className="mb-1 block text-xs font-semibold text-white/60">{t}</span>;
  const setButton = (i: number, patch: Partial<TemplateButton>) => setDraft({ buttons: d.buttons.map((b, j) => (j === i ? ({ ...b, ...patch } as TemplateButton) : b)) });
  const addButton = (type: TemplateButton["type"]) => {
    const b: TemplateButton = type === "QUICK_REPLY" ? { type, text: "" } : type === "URL" ? { type, text: "", url: "https://" } : type === "PHONE_NUMBER" ? { type, text: "", phoneNumber: "+91" } : { type: "COPY_CODE", example: "" };
    setDraft({ buttons: [...d.buttons, b] });
  };
  const upload = async (file: File) => {
    if (!d.header || d.header.format === "TEXT") return;
    setUploading(true);
    try {
      const r = await uploadTemplateExample(d.header.format, file);
      setDraft({ header: { format: d.header.format, exampleHandle: r.handle } });
      setErrors((e) => ({ ...e, "draft.header": "" }));
    } catch (e) {
      setErrors((x) => ({ ...x, "draft.header": describeApiError(e) }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title={existing ? `Edit ${existing.name}` : "New template"} label="Template editor" wide onClose={onClose}>
      <div className="grid gap-5 md:grid-cols-[1fr_19rem]">
        <form
          noValidate
          className="min-w-0 space-y-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            setErrors({});
            setFormError(null);
            save.mutate();
          }}
        >
          {existing?.rejectedReason && <ErrorNote message={`Meta rejected this template: ${existing.rejectedReason.replace(/_/g, " ").toLowerCase()}. Edit it and save to resubmit.`} />}
          {existing?.lastError && <ErrorNote message={existing.lastError} />}
          <label className="block">
            {label("Name")}
            <input name="name" disabled={live} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={input} placeholder="order_confirmation" />
            {v.name && !isValidName(v.name) && !live && (
              <button type="button" onClick={() => setV({ ...v, name: suggestName(v.name) })} className="mt-1 text-xs text-amber-300 underline">
                Use {suggestName(v.name)}
              </button>
            )}
            {err("name")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              {label("Category")}
              <select disabled={live && existing?.status === "APPROVED"} value={v.category} onChange={(e) => setV({ ...v, category: e.target.value as TemplateCategory })} className={input}>
                <option value="UTILITY">Utility</option>
                <option value="MARKETING">Marketing</option>
                <option value="AUTHENTICATION">Authentication</option>
              </select>
              {err("category")}
            </label>
            <label className="block">
              {label("Language")}
              <select disabled={live} value={v.language} onChange={(e) => setV({ ...v, language: e.target.value })} className={input}>
                {LANGS.map(([c, n]) => (
                  <option key={c} value={c}>{n}</option>
                ))}
              </select>
              {err("language")}
            </label>
          </div>

          {auth ? (
            <div className="space-y-3 rounded-xl border border-white/8 p-3">
              <p className="text-xs text-white/50">Meta writes the message for one-time-code templates. Choose the options:</p>
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={d.authentication?.securityRecommendation !== false} onChange={(e) => setDraft({ authentication: { expiryMinutes: null, buttonText: "Copy code", ...d.authentication, securityRecommendation: e.target.checked } })} />
                Add “do not share this code” line
              </label>
              <label className="block">
                {label("Code expires after (minutes, optional)")}
                <input inputMode="numeric" value={d.authentication?.expiryMinutes ?? ""} onChange={(e) => setDraft({ authentication: { securityRecommendation: true, buttonText: "Copy code", ...d.authentication, expiryMinutes: e.target.value ? Number(e.target.value) : null } })} className={input} />
                {err("draft.authentication.expiryMinutes")}
              </label>
              <label className="block">
                {label("Button text")}
                <input value={d.authentication?.buttonText ?? "Copy code"} onChange={(e) => setDraft({ authentication: { securityRecommendation: true, expiryMinutes: null, ...d.authentication, buttonText: e.target.value } })} className={input} />
              </label>
            </div>
          ) : (
            <>
              <fieldset className="flex gap-4 text-sm text-white/70">
                <legend className="mb-1 text-xs font-semibold text-white/60">Variables</legend>
                {(["POSITIONAL", "NAMED"] as ParameterFormat[]).map((f) => (
                  <label key={f} className="flex items-center gap-1.5">
                    <input type="radio" name="fmt" disabled={live} checked={v.parameterFormat === f} onChange={() => setV({ ...v, parameterFormat: f })} />
                    {f === "POSITIONAL" ? "Numbered {{1}}" : "Named {{first_name}}"}
                  </label>
                ))}
              </fieldset>

              <div>
                {label("Header (optional)")}
                <select
                  value={d.header?.format ?? ""}
                  onChange={(e) => setDraft({ header: e.target.value ? ({ format: e.target.value as HeaderFormat, ...(e.target.value === "TEXT" ? { text: "" } : {}) } as TemplateDraft["header"]) : null })}
                  className={input}
                >
                  <option value="">No header</option>
                  <option value="TEXT">Text</option>
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                  <option value="DOCUMENT">Document</option>
                </select>
                {d.header?.format === "TEXT" && (
                  <>
                    <input value={d.header.text ?? ""} onChange={(e) => setDraft({ header: { format: "TEXT", text: e.target.value } })} className={`${input} mt-2`} placeholder="Order update" maxLength={80} />
                    {headerVars.length > 0 && <input value={d.headerExample ?? ""} onChange={(e) => setDraft({ headerExample: e.target.value })} className={`${input} mt-2`} placeholder={`Sample for {{${headerVars[0]}}}`} />}
                    {err("draft.headerExample")}
                  </>
                )}
                {d.header && d.header.format !== "TEXT" && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
                    <input ref={fileRef} type="file" hidden accept={d.header.format === "IMAGE" ? "image/jpeg,image/png" : d.header.format === "VIDEO" ? "video/mp4" : "application/pdf"} onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
                    <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5 disabled:opacity-50">
                      <Upload size={13} /> {uploading ? "Uploading…" : d.header.exampleHandle ? "Replace sample" : "Upload sample"}
                    </button>
                    {d.header.exampleHandle && <span className="text-emerald-300">Sample uploaded</span>}
                  </div>
                )}
                {err("draft.header")}
              </div>

              <label className="block">
                {label("Body")}
                <textarea name="body" rows={5} value={d.body.text} onChange={(e) => onBody(e.target.value)} className={input} placeholder={v.parameterFormat === "NAMED" ? "Hi {{first_name}}, your order {{order_id}} is confirmed." : "Hi {{1}}, your order {{2}} is confirmed."} />
                <span className="mt-1 flex justify-between text-[11px] text-white/35">
                  <span>{d.body.text.length}/1024</span>
                </span>
                {problems.map((p) => (
                  <span key={p} className="block text-xs text-amber-300">{p}</span>
                ))}
                {err("draft.body")}
              </label>

              {bodyVars.length > 0 && (
                <div className="space-y-2 rounded-xl border border-white/8 p-3">
                  <p className="text-xs text-white/50">Sample values (Meta reviews these):</p>
                  {bodyVars.map((n) => (
                    <label key={n} className="flex items-center gap-2 text-sm">
                      <code className="w-24 shrink-0 truncate text-xs text-brand-300">{`{{${n}}}`}</code>
                      <input value={d.examples[n] ?? ""} onChange={(e) => setDraft({ examples: { ...d.examples, [n]: e.target.value } })} className={input} placeholder="Sample" />
                    </label>
                  ))}
                  {bodyVars.map((n) => err(`draft.examples.${n}`))}
                </div>
              )}

              <label className="block">
                {label("Footer (optional)")}
                <input value={d.footer ?? ""} onChange={(e) => setDraft({ footer: e.target.value || null })} className={input} maxLength={80} />
                {err("draft.footer")}
              </label>

              <div>
                {label("Buttons (optional)")}
                <div className="space-y-2">
                  {d.buttons.map((b, i) => (
                    <div key={i} className="space-y-1.5 rounded-lg border border-white/8 p-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/40">
                        {b.type.replace("_", " ")}
                        <button type="button" aria-label="Remove button" onClick={() => setDraft({ buttons: d.buttons.filter((_x, j) => j !== i) })} className="text-white/40 hover:text-red-300"><Trash2 size={13} /></button>
                      </div>
                      {b.type !== "COPY_CODE" && <input value={b.text} onChange={(e) => setButton(i, { text: e.target.value })} className={input} placeholder="Button text" maxLength={25} />}
                      {b.type === "URL" && (
                        <>
                          <input value={b.url} onChange={(e) => setButton(i, { url: e.target.value })} className={input} placeholder="https://example.com/{{1}}" />
                          {/\{\{/.test(b.url) && <input value={b.example ?? ""} onChange={(e) => setButton(i, { example: e.target.value })} className={input} placeholder="Sample full address" />}
                        </>
                      )}
                      {b.type === "PHONE_NUMBER" && <input value={b.phoneNumber} onChange={(e) => setButton(i, { phoneNumber: e.target.value })} className={input} placeholder="+919876543210" />}
                      {b.type === "COPY_CODE" && <input value={b.example} onChange={(e) => setButton(i, { example: e.target.value })} className={input} placeholder="Sample code" maxLength={15} />}
                      {err(`draft.buttons.${i}`)}
                    </div>
                  ))}
                </div>
                {err("draft.buttons")}
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {(["QUICK_REPLY", "URL", "PHONE_NUMBER", "COPY_CODE"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => addButton(t)} className="rounded-lg border border-white/10 px-2.5 py-1 text-white/60 hover:bg-white/5">
                      + {t === "QUICK_REPLY" ? "Quick reply" : t === "URL" ? "Web link" : t === "PHONE_NUMBER" ? "Call" : "Copy code"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {formError && <ErrorNote message={formError} />}
          <p className="text-xs text-white/40">{live ? "Saving sends the edit to Meta, which puts the template back into review." : "Saving keeps a local draft. It is not sent to Meta, and it is not approved, until you submit it."}</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={save.isPending} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-50">
              {save.isPending ? "Saving…" : live ? "Save and resubmit to Meta" : "Save draft"}
            </button>
          </div>
        </form>
        <div className="md:sticky md:top-0 md:self-start">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">Preview</p>
          <Preview value={v} />
        </div>
      </div>
    </Modal>
  );
}

export function TemplateManager() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["biz-templates"], queryFn: fetchManagedTemplates, retry: false });
  const [editing, setEditing] = useState<ManagedTemplate | "new" | null>(null);
  const [previewing, setPreviewing] = useState<ManagedTemplate | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const refresh = () => void qc.invalidateQueries({ queryKey: ["biz-templates"] });
  const act = (fn: () => Promise<unknown>, ok: string) => async () => {
    setProblem(null);
    setNotice(null);
    try {
      await fn();
      setNotice(ok);
      refresh();
    } catch (e) {
      setProblem(describeApiError(e));
    }
  };
  const sync = useMutation({
    mutationFn: syncManagedTemplates,
    onSuccess: (r) => {
      setProblem(null);
      setNotice(`Synced ${r.total} template${r.total === 1 ? "" : "s"} from Meta (${Object.entries(r.byStatus).map(([k, n]) => `${n} ${k.toLowerCase()}`).join(", ") || "none"}).`);
      refresh();
    },
    onError: (e) => setProblem(describeApiError(e)),
  });
  const items = useMemo(() => list.data?.items ?? [], [list.data]);
  const counts = useMemo(() => statusCounts(items), [items]);
  const shown = useMemo(() => filterTemplates(items, { q, status: filter }), [items, q, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-2xl text-sm text-white/65">Templates are approved by Meta, not by us. A new template stays a local draft until you submit it, and its status then comes only from Meta.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => sync.mutate()} disabled={sync.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 disabled:opacity-50">
            <RefreshCw size={14} className={sync.isPending ? "animate-spin" : ""} /> Sync from Meta
          </button>
          <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-400">
            <FilePlus2 size={14} /> New template
          </button>
        </div>
      </div>
      {notice && <p role="status" className="rounded-xl border border-[var(--st-ok-bd)] bg-[var(--st-ok-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--st-ok-fg)]">{notice}</p>}
      {problem && <ErrorNote message={problem} />}
      {list.isError && <ErrorNote message={describeApiError(list.error)} onRetry={() => void list.refetch()} />}
      {list.isLoading ? (
        <p className="text-sm text-white/65">Loading templates…</p>
      ) : items.length === 0 && !list.isError ? (
        <EmptyState icon={MessageSquareText} compact title="No templates yet" description="Create a template, or sync the ones already in your WhatsApp Business account." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block w-full sm:w-72">
              <span className="sr-only">Search templates by name</span>
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search template name" className="w-full rounded-lg border border-white/10 bg-ink-950/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none" />
            </label>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
              {FILTERS.map((f) => (
                <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className="ba-chip" data-filter={f.id}>{f.label} ({counts[f.id]})</button>
              ))}
            </div>
          </div>
          <Panel flush>
            <ul className="divide-y divide-white/6" aria-label="Templates">
              {shown.length === 0 && <li className="px-5 py-6 text-center text-sm text-white/65">No template matches your search or filter.</li>}
              {shown.map((t) => (
                <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4" data-testid="manager-row" data-template={t.name}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-all text-base font-bold text-white" data-testid="manager-name">{t.name}</span>
                      <StatusBadge t={t} />
                      <span className="text-xs font-medium uppercase tracking-wide text-white/65">{t.category} · {t.language}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-white/80">{t.category === "AUTHENTICATION" ? "One-time code message (written by Meta)" : t.draft.body.text}</p>
                    {t.rejectedReason && <p className="mt-1.5 text-sm font-semibold text-amber-300" data-testid="manager-rejected">Rejected by Meta: {t.rejectedReason.replace(/_/g, " ").toLowerCase()}</p>}
                    {t.lastError && <p className="mt-1 text-sm font-medium text-red-300">{t.lastError}</p>}
                    <p className="mt-1 text-xs text-white/65">{t.lastSyncedAt ? `Checked with Meta ${formatWhen(t.lastSyncedAt)}` : "Never sent to Meta"}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <button type="button" aria-label={`Preview ${t.name}`} onClick={() => setPreviewing(t)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/5">
                      <Eye size={14} /> Preview
                    </button>
                    {t.canSubmit && (
                      <button type="button" onClick={act(() => submitManagedTemplate(t.id), `“${t.name}” was submitted. Meta decides its status.`)} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/30 px-3 py-1.5 text-sm font-semibold text-brand-300 hover:bg-brand-500/10">
                        <Send size={14} /> Submit to Meta
                      </button>
                    )}
                    {t.canEdit && (
                      <button type="button" aria-label={`Edit ${t.name}`} onClick={() => setEditing(t)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/5">
                        <Pencil size={14} /> Edit
                      </button>
                    )}
                    {t.canDelete && (
                      <button type="button" aria-label={`Delete ${t.name}`} onClick={() => window.confirm(`Delete the draft “${t.name}”?`) && void act(() => deleteManagedTemplate(t.id), "Draft deleted.")()} className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-red-500/10 hover:text-red-300">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}
      {previewing && <PreviewDialog t={previewing} onClose={() => setPreviewing(null)} onEdit={previewing.canEdit ? () => (setEditing(previewing), setPreviewing(null)) : undefined} />}
      {editing && <Editor existing={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
