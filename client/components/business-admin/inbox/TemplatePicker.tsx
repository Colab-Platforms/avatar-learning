"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileText, RefreshCw, Search, X } from "lucide-react";
import { apiErrorCode, describeApiError, fetchManagedTemplates, fetchTemplates, sendTemplate, type InboxMessage, type TemplateInfo } from "@/lib/businessAdminApi";
import { newClientRequestId, templateReady } from "@/lib/inboxLogic";
import { blockedReason, canSendTemplate, matchesName, statusKind, templateKey, valuesByName, type StatusFilter } from "@/lib/templateLogic";
import { ApprovalPill, TemplatePreview, headerFromInfo, type PreviewButton } from "../templates/TemplatePreview";

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "approved", label: "Approved" },
  { id: "pending", label: "Pending" },
  { id: "rejected", label: "Rejected" },
];

const statusText = (t: TemplateInfo) => t.status.charAt(0) + t.status.slice(1).toLowerCase().replace(/_/g, " ");
/** "first_name" -> "First name". Numbered variables keep their number so they match the {{n}} in the preview. */
const variableLabel = (name: string) => (/^\d+$/.test(name) ? `Variable {{${name}}}` : `${name.charAt(0).toUpperCase()}${name.slice(1).replace(/_/g, " ")}  {{${name}}}`);
/** A bare phone number is not a name: never put digits into a "name" slot. */
const looksLikeName = (s: string) => s.trim() !== "" && !/^\+?[\d\s-]+$/.test(s.trim());

export function TemplatePicker({ waId, contactName, onClose, onSent }: { waId: string; contactName: string; onClose: () => void; onSent: (m: InboxMessage) => void }) {
  const list = useQuery({ queryKey: ["biz-inbox", "templates"], queryFn: () => fetchTemplates(false), staleTime: 60_000, retry: false });
  // Buttons are not part of the live list. Join strictly on exact name + language; no match means no buttons are drawn.
  const managed = useQuery({ queryKey: ["biz-templates"], queryFn: fetchManagedTemplates, staleTime: 60_000, retry: false });
  const [selected, setSelected] = useState<string | null>(null);
  const [params, setParams] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const requestId = useRef<{ sig: string; id: string } | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const items = useMemo(() => [...(list.data?.items ?? [])].sort((a, b) => Number(canSendTemplate(b)) - Number(canSendTemplate(a)) || a.name.localeCompare(b.name)), [list.data]);
  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: items.length, approved: 0, pending: 0, rejected: 0, draft: 0 };
    for (const t of items) {
      const k = statusKind(t.status);
      if (k !== "other") c[k] += 1;
    }
    return c;
  }, [items]);
  const visible = useMemo(() => items.filter((t) => matchesName(t.name, q) && (filter === "all" || statusKind(t.status) === filter)), [items, q, filter]);
  const template = useMemo(() => items.find((t) => templateKey(t.name, t.language) === selected) ?? null, [items, selected]);
  const detail = useMemo(() => (template ? (managed.data?.items ?? []).find((m) => m.name === template.name && m.language === template.language) ?? null : null), [managed.data, template]);

  const variables = template?.variables ?? Array.from({ length: template?.variableCount ?? 0 }, (_, i) => String(i + 1));
  const sendable = !!template && canSendTemplate(template);
  const ready = sendable && templateReady(variables.length, params);
  const buttons: PreviewButton[] = (detail?.draft.buttons ?? []).map((b) => ({ type: b.type, text: "text" in b ? b.text : undefined }));

  const send = useMutation({
    mutationFn: () => {
      const t = template as TemplateInfo;
      if (!canSendTemplate(t)) throw new Error("Only approved templates can be sent.");
      const sig = `${selected}|${params.join("\u0001")}`;
      if (requestId.current?.sig !== sig) requestId.current = { sig, id: newClientRequestId() };
      return sendTemplate(waId, { name: t.name, language: t.language, params, clientRequestId: requestId.current.id });
    },
    onSuccess: (r) => onSent(r.message),
  });

  const choose = (t: TemplateInfo) => {
    if (!canSendTemplate(t)) return;
    const vars = t.variables ?? Array.from({ length: t.variableCount }, (_, i) => String(i + 1));
    setSelected(templateKey(t.name, t.language));
    setParams(vars.map((_, i) => (i === 0 && looksLikeName(contactName) ? contactName : "")));
    send.reset();
  };
  const code = send.isError ? apiErrorCode(send.error) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Send a template">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div ref={dialog} className="relative flex h-[92dvh] w-full flex-col rounded-t-2xl border border-white/10 bg-ink-900 shadow-2xl sm:h-[min(44rem,90dvh)] sm:max-w-5xl sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white">Send a template</h2>
            <p className="text-sm text-white/65">Approved templates are the only messages WhatsApp allows outside the 24-hour window.</p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => void list.refetch()} aria-label="Reload templates" className="rounded-lg p-2 text-white/65 hover:bg-white/10"><RefreshCw size={16} className={list.isFetching ? "animate-spin" : ""} /></button>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-white/65 hover:bg-white/10"><X size={18} /></button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-1 md:grid-cols-[22rem_1fr] md:grid-rows-none">
          {/* ── list ── */}
          <div className={`min-h-0 flex-col border-b border-white/10 md:flex md:border-b-0 md:border-r ${template ? "hidden" : "flex"}`}>
            <div className="space-y-2 border-b border-white/10 p-3">
              <label className="relative block">
                <span className="sr-only">Search templates by name</span>
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search template name" className="w-full rounded-lg border border-white/10 bg-ink-950/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none" />
              </label>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by approval status">
                {FILTERS.map((f) => (
                  <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className="ba-chip">{f.label} ({counts[f.id]})</button>
                ))}
              </div>
            </div>
            <ul className="min-h-0 flex-1 divide-y divide-white/6 overflow-y-auto" aria-label="Templates">
              {list.isLoading && <li className="px-4 py-3 text-sm text-white/65">Loading templates from WhatsApp…</li>}
              {list.isError && (
                <li role="alert" className="px-4 py-3 text-sm text-amber-200">
                  {describeApiError(list.error)} Templates come from your WhatsApp Business Account, so it needs WHATSAPP_BUSINESS_ACCOUNT_ID and an access token.
                </li>
              )}
              {list.data && items.length === 0 && <li className="px-4 py-3 text-sm text-white/65">Your WhatsApp Business Account has no message templates. Create one in the Templates tab and get it approved by Meta first.</li>}
              {list.data && items.length > 0 && visible.length === 0 && <li className="px-4 py-3 text-sm text-white/65">No template matches your search or filter.</li>}
              {visible.map((t) => {
                const key = templateKey(t.name, t.language);
                const reason = blockedReason(t);
                const on = selected === key;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      disabled={!!reason}
                      aria-current={on}
                      data-testid="picker-row"
                      data-template={t.name}
                      onClick={() => choose(t)}
                      className={`block w-full px-4 py-3 text-left disabled:cursor-not-allowed ${on ? "ba-selected" : reason ? "" : "hover:bg-white/5"}`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0 break-all text-sm font-bold text-white" data-testid="picker-name">{t.name}</span>
                        <ApprovalPill kind={statusKind(t.status)}>{statusText(t)}</ApprovalPill>
                      </span>
                      <span className="mt-0.5 block text-xs font-medium uppercase tracking-wide text-white/65">{t.category.toLowerCase()} · {t.language}</span>
                      {reason && <span className="mt-1 block text-xs text-white/65" data-testid="picker-reason">{reason}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── detail (on phones only one pane shows at a time) ── */}
          <div className={`min-h-0 flex-col md:flex ${template ? "flex" : "hidden"}`}>
            {!template ? (
              <div className="m-auto max-w-sm px-6 text-center">
                <FileText className="mx-auto mb-3 text-white/45" size={34} />
                <p className="text-base font-semibold text-white">Choose an approved template</p>
                <p className="mt-1 text-sm text-white/65">Pick one on the left to see exactly what the customer will receive. Pending and rejected templates are greyed out because WhatsApp will not deliver them.</p>
              </div>
            ) : (
              <form
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (ready && !send.isPending) send.mutate();
                }}
              >
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
                  <button type="button" onClick={() => setSelected(null)} className="text-sm font-semibold text-brand-400 hover:underline md:hidden" data-testid="picker-back">← All templates</button>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/65">Template</p>
                    <h3 className="break-all text-xl font-bold text-white" data-testid="selected-name">{template.name}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <ApprovalPill kind={statusKind(template.status)}>{statusText(template)}</ApprovalPill>
                      <span className="text-xs font-medium uppercase tracking-wide text-white/65">{template.category.toLowerCase()} · {template.language}</span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/65">Message preview</p>
                    <TemplatePreview header={headerFromInfo(template.header)} body={template.body} footer={template.footer} buttons={buttons} values={valuesByName(variables, params)} />
                    <p className="mt-2 text-xs text-white/65">
                      <mark className="ba-var-fill">Highlighted</mark> text is what you typed and will be sent. <span className="ba-var-empty">{"{{1}}"}</span> means a value is still missing.
                      {!detail && " Button details are not available for this template, so none are shown here."}
                    </p>
                  </div>

                  {variables.length > 0 && (
                    <fieldset className="space-y-3">
                      <legend className="mb-1 text-sm font-bold text-white">Fill in the variables</legend>
                      {variables.map((name, i) => {
                        const sample = detail?.draft.examples?.[name];
                        return (
                          <label key={name} className="block">
                            <span className="mb-1 block text-sm font-semibold text-white">{variableLabel(name)}</span>
                            <input
                              value={params[i] ?? ""}
                              onChange={(e) => setParams((p) => p.map((v, j) => (j === i ? e.target.value : v)))}
                              name={`param-${i + 1}`}
                              placeholder={sample ? `Sample submitted to Meta: ${sample}` : "Type the value to send"}
                              className="w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none"
                            />
                          </label>
                        );
                      })}
                      {variables.some((n) => detail?.draft.examples?.[n]) && <p className="text-xs text-white/65">Grey sample text is only a hint from the version submitted to Meta; it is never sent unless you type it.</p>}
                    </fieldset>
                  )}

                  {send.isError && (
                    <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300" data-testid="template-error">
                      {describeApiError(send.error)}
                      {code === "OPT_IN_REQUIRED" && " Open the customer details and record their consent first."}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-5 py-3">
                  <p className="text-xs text-white/65">{!ready && variables.length > 0 ? `Fill all ${variables.length} variable${variables.length === 1 ? "" : "s"} to send.` : "Consent and the 24-hour rules are checked again when you send."}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5">Cancel</button>
                    <button type="submit" disabled={!ready || send.isPending} className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">{send.isPending ? "Sending…" : "Send template"}</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
