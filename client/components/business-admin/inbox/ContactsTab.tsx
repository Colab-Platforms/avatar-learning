"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Contact, FileUp, MessageCircle, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import {
  createContact,
  deleteContact,
  describeApiError,
  apiErrorField,
  fetchContactTags,
  fetchContacts,
  fetchGroupsStatus,
  importContacts,
  updateContact,
  type ContactRecord,
  type OptInStatus,
} from "@/lib/businessAdminApi";
import { debounce, parseContactsCsv } from "@/lib/inboxLogic";
import { Modal } from "@/components/business-admin/admins/AdminDialogs";
import { EmptyState, ErrorNote, PageHeader, Panel, StatusPill } from "@/components/business-admin/ui";

const input = "w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none";

function OptInPill({ s }: { s: OptInStatus }) {
  return s === "GRANTED" ? <StatusPill tone="ok">Opted in</StatusPill> : s === "WITHDRAWN" ? <StatusPill tone="warn">Opted out</StatusPill> : <StatusPill tone="off">Not recorded</StatusPill>;
}

export function ContactForm({ contact, onClose, onSaved }: { contact: ContactRecord | null; onClose: () => void; onSaved?: (c: ContactRecord) => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: contact?.name ?? "", phone: contact ? `+${contact.waId}` : "", email: contact?.email ?? "", company: contact?.company ?? "", tags: (contact?.tags ?? []).join(", "), notes: contact?.notes ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const m = useMutation({
    mutationFn: () => {
      const payload = { name: f.name, email: f.email, company: f.company, notes: f.notes, tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean) };
      return contact ? updateContact(contact.id, { ...payload, ...(f.phone !== `+${contact.waId}` ? { phone: f.phone } : {}) }) : createContact({ ...payload, phone: f.phone });
    },
    onSuccess: (saved) => {
      void qc.invalidateQueries({ queryKey: ["biz-contacts"] });
      onSaved?.(saved);
      onClose();
    },
    onError: (err) => {
      const field = apiErrorField(err);
      setErrors(field ? { [field]: describeApiError(err) } : { form: describeApiError(err) });
    },
  });
  const field = (k: keyof typeof f, label: string, props: Record<string, unknown> = {}) => (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-white/60">{label}</span>
      <input name={k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={input} {...props} />
      {errors[k === "phone" ? "phone" : k] && <span role="alert" className="mt-1 block text-xs text-red-300">{errors[k]}</span>}
    </label>
  );
  return (
    <Modal title={contact ? "Edit contact" : "New contact"} label={contact ? "Edit contact" : "New contact"} onClose={onClose}>
      <form
        noValidate
        className="space-y-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          const errs: Record<string, string> = {};
          if (f.name.trim().length < 1) errs.name = "Enter a name.";
          if (!f.phone.trim()) errs.phone = "Enter a phone number.";
          setErrors(errs);
          if (!Object.keys(errs).length) m.mutate();
        }}
      >
        {field("name", "Name")}
        {field("phone", "WhatsApp number", { placeholder: "+91 98765 43210", inputMode: "tel" })}
        {field("email", "Email (optional)", { type: "email" })}
        {field("company", "Company (optional)")}
        {field("tags", "Tags (comma separated)", { placeholder: "vip, demo" })}
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-white/60">Notes (optional)</span>
          <textarea name="notes" rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={`${input} resize-y`} />
          {errors.notes && <span role="alert" className="mt-1 block text-xs text-red-300">{errors.notes}</span>}
        </label>
        {errors.form && <p role="alert" className="text-sm text-red-300">{errors.form}</p>}
        <p className="text-[11px] text-white/35">Saving a contact does not record WhatsApp consent. Do that from the conversation, with the evidence.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
          <button type="submit" disabled={m.isPending} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">{m.isPending ? "Saving…" : "Save contact"}</button>
        </div>
      </form>
    </Modal>
  );
}

function ImportDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const picker = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<{ name: string; rows: Array<Record<string, string>> } | null>(null);
  const [problem, setProblem] = useState("");
  const m = useMutation({
    mutationFn: () => importContacts((parsed?.rows ?? []) as never),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["biz-contacts"] }),
  });
  const read = async (file: File | undefined) => {
    if (!file) return;
    m.reset();
    if (file.size > 2 * 1024 * 1024) return setProblem("Choose a file under 2 MB.");
    const r = parseContactsCsv(await file.text());
    if (r.problem) return (setParsed(null), setProblem(r.problem));
    if (r.rows.length > 500) return (setParsed(null), setProblem("Import at most 500 contacts at a time. Split the file."));
    setProblem("");
    setParsed({ name: file.name, rows: r.rows });
  };
  const res = m.data;
  return (
    <Modal title="Import contacts" label="Import contacts" onClose={onClose}>
      <p className="text-sm text-white/55">Upload a CSV with a header row. Columns: <b>name</b>, <b>phone</b> (required), email, company, tags, notes. Importing never records WhatsApp consent.</p>
      <input ref={picker} type="file" accept=".csv,text/csv" className="sr-only" data-testid="csv-input" onChange={(e) => void read(e.target.files?.[0])} />
      <button type="button" onClick={() => picker.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-sm text-white/80 hover:bg-white/5"><FileUp size={15} /> Choose CSV file</button>
      {problem && <p role="alert" className="mt-3 text-sm text-red-300">{problem}</p>}
      {parsed && !res && <p className="mt-3 text-sm text-white/70" data-testid="import-ready">{parsed.name}: {parsed.rows.length} row{parsed.rows.length === 1 ? "" : "s"} ready to import.</p>}
      {m.isError && <p role="alert" className="mt-3 text-sm text-red-300">{describeApiError(m.error)}</p>}
      {res && (
        <div className="mt-3 space-y-2 text-sm" data-testid="import-result" role="status">
          <p className="text-emerald-300">{res.created} created · {res.updated} updated · {res.skipped} skipped</p>
          {res.errors.length > 0 && (
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/8 p-2 text-xs text-amber-200">
              {res.errors.map((e) => <li key={e.row}>Row {e.row}: {e.reason}</li>)}
            </ul>
          )}
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">{res ? "Done" : "Cancel"}</button>
        {!res && <button type="button" disabled={!parsed || m.isPending} onClick={() => m.mutate()} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">{m.isPending ? "Importing…" : "Import"}</button>}
      </div>
    </Modal>
  );
}

/** Contacts tab of the WhatsApp Inbox. Clicking a contact (or "Open chat") opens their conversation. */
export function ContactsTab({ onOpenChat }: { onOpenChat: (waId: string) => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [optIn, setOptIn] = useState<OptInStatus | "">("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ kind: "form"; contact: ContactRecord | null } | { kind: "import" } | { kind: "delete"; contact: ContactRecord } | null>(null);

  const push = useMemo(() => debounce((v: string) => (setQ(v.trim()), setPage(1)), 300), []);
  useEffect(() => () => push.cancel(), [push]);

  const tags = useQuery({ queryKey: ["biz-contacts", "tags"], queryFn: fetchContactTags, staleTime: 60_000 });
  const list = useQuery({ queryKey: ["biz-contacts", "list", q, tag, optIn, page], queryFn: () => fetchContacts({ q, tag, optIn, page, pageSize: 25 }), placeholderData: (p) => p });
  const groups = useQuery({ queryKey: ["biz-contacts", "groups"], queryFn: fetchGroupsStatus, staleTime: 10 * 60_000 });
  const del = useMutation({
    mutationFn: (c: ContactRecord) => deleteContact(c.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["biz-contacts"] });
      setDialog(null);
    },
  });

  const items = list.data?.items ?? [];
  const totalPages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;
  const filtered = q !== "" || tag !== "" || optIn !== "";

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Contacts"
        description="People and businesses you message on WhatsApp. Saved contacts show their name in the inbox and hold the consent record needed to send templates."
        actions={
          <>
            <button type="button" onClick={() => setDialog({ kind: "import" })} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2 text-sm text-white/75 hover:bg-white/5"><FileUp size={15} /> Import CSV</button>
            <button type="button" onClick={() => setDialog({ kind: "form", contact: null })} className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"><Plus size={15} /> New contact</button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label className="relative block flex-1 sm:max-w-md">
          <span className="sr-only">Search contacts</span>
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="search" value={search} onChange={(e) => (setSearch(e.target.value), push(e.target.value))} placeholder="Search name, email, company or number" className="w-full rounded-lg border border-white/8 bg-ink-900 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none" />
        </label>
        <select aria-label="Filter by tag" value={tag} onChange={(e) => (setTag(e.target.value), setPage(1))} className="rounded-lg border border-white/8 bg-ink-900 px-3 py-2 text-sm text-white/80">
          <option value="">All tags</option>
          {(tags.data?.items ?? []).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select aria-label="Filter by consent" value={optIn} onChange={(e) => (setOptIn(e.target.value as OptInStatus | ""), setPage(1))} className="rounded-lg border border-white/8 bg-ink-900 px-3 py-2 text-sm text-white/80">
          <option value="">Any consent</option>
          <option value="GRANTED">Opted in</option>
          <option value="UNKNOWN">Not recorded</option>
          <option value="WITHDRAWN">Opted out</option>
        </select>
      </div>

      {list.isError && <div className="mb-4"><ErrorNote message={describeApiError(list.error)} onRetry={() => void list.refetch()} /></div>}
      {list.isLoading && <p className="text-sm text-white/35">Loading contacts…</p>}

      {list.data && items.length === 0 &&
        (filtered ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-white/45">No contacts match these filters.</p>
        ) : (
          <EmptyState icon={Contact} title="No contacts yet" description="Add a contact, import a CSV, or save a number from a conversation in the WhatsApp Inbox." compact />
        ))}

      {items.length > 0 && (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-white/6 bg-ink-900 md:block">
            <table className="w-full text-left text-sm" data-testid="contacts-table">
              <thead>
                <tr className="border-b border-white/6 text-[11px] uppercase tracking-widest text-white/35">
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">WhatsApp</th>
                  <th className="px-4 py-3 font-semibold">Tags</th>
                  <th className="px-4 py-3 font-semibold">Consent</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((c) => (
                  <tr key={c.id} data-testid="contact-row">
                    <td className="px-4 py-3 align-top"><button type="button" onClick={() => onOpenChat(c.waId)} className="text-left font-medium text-white hover:text-brand-300 hover:underline" title="Open conversation">{c.name}</button><p className="text-xs text-white/40">{[c.company, c.email].filter(Boolean).join(" · ")}</p></td>
                    <td className="px-4 py-3 align-top text-white/70">+{c.waId}</td>
                    <td className="px-4 py-3 align-top"><span className="flex flex-wrap gap-1">{c.tags.map((t) => <span key={t} className="rounded bg-white/6 px-1.5 py-px text-[11px] text-white/60">{t}</span>)}</span></td>
                    <td className="px-4 py-3 align-top"><OptInPill s={c.optIn.status} /></td>
                    <td className="px-4 py-3 text-right align-top">
                      <span className="inline-flex gap-1.5">
                        <button type="button" aria-label={`Open chat with ${c.name}`} onClick={() => onOpenChat(c.waId)} className="rounded-lg border border-brand-500/30 p-1.5 text-brand-300 hover:bg-brand-500/10"><MessageCircle size={13} /></button>
                        <button type="button" aria-label={`Edit ${c.name}`} onClick={() => setDialog({ kind: "form", contact: c })} className="rounded-lg border border-white/10 p-1.5 text-white/65 hover:bg-white/5"><Pencil size={13} /></button>
                        <button type="button" aria-label={`Delete ${c.name}`} onClick={() => setDialog({ kind: "delete", contact: c })} className="rounded-lg border border-red-400/30 p-1.5 text-red-300 hover:bg-red-500/10"><Trash2 size={13} /></button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden" aria-label="Contacts">
            {items.map((c) => (
              <li key={c.id} data-testid="contact-card" className="rounded-2xl border border-white/6 bg-ink-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate font-medium text-white">{c.name}</p><p className="text-xs text-white/40">+{c.waId}</p></div>
                  <OptInPill s={c.optIn.status} />
                </div>
                {c.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{c.tags.map((t) => <span key={t} className="rounded bg-white/6 px-1.5 py-px text-[11px] text-white/60">{t}</span>)}</div>}
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => onOpenChat(c.waId)} className="rounded-lg border border-brand-500/30 px-3 py-1 text-xs text-brand-300">Open chat</button>
                  <button type="button" onClick={() => setDialog({ kind: "form", contact: c })} className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/70">Edit</button>
                  <button type="button" onClick={() => setDialog({ kind: "delete", contact: c })} className="rounded-lg border border-red-400/30 px-3 py-1 text-xs text-red-300">Delete</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between text-xs text-white/45">
            <span>{list.data?.total} contact{list.data?.total === 1 ? "" : "s"}</span>
            {totalPages > 1 && (
              <span className="flex items-center gap-3">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="hover:text-white disabled:opacity-30">Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="hover:text-white disabled:opacity-30">Next</button>
              </span>
            )}
          </div>
        </>
      )}

      <div className="mt-6">
        <Panel title="WhatsApp groups">
          <div className="flex items-start gap-3" data-testid="groups-status">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/6 text-white/50"><Users size={15} /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Group messaging is not enabled <StatusPill tone="off">Not available</StatusPill></p>
              {groups.data ? (
                <>
                  <p className="mt-1 text-sm text-white/50">{groups.data.reason}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/45">{groups.data.nextSteps.map((s) => <li key={s}>{s}</li>)}</ul>
                </>
              ) : groups.isError ? (
                <p role="alert" className="mt-1 text-sm text-red-300">{describeApiError(groups.error)}</p>
              ) : (
                <p className="mt-1 text-sm text-white/35">Checking…</p>
              )}
            </div>
          </div>
        </Panel>
      </div>

      {dialog?.kind === "form" && <ContactForm contact={dialog.contact} onClose={() => setDialog(null)} />}
      {dialog?.kind === "import" && <ImportDialog onClose={() => setDialog(null)} />}
      {dialog?.kind === "delete" && (
        <Modal title={`Delete ${dialog.contact.name}?`} label="Delete contact" onClose={() => setDialog(null)}>
          <p className="text-sm text-white/60">This removes the saved contact and its consent record. Their WhatsApp messages and conversation history are kept.</p>
          {del.isError && <p role="alert" className="mt-3 text-sm text-red-300">{describeApiError(del.error)}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setDialog(null)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
            <button type="button" disabled={del.isPending} onClick={() => del.mutate(dialog.contact)} className="rounded-lg border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60">{del.isPending ? "Deleting…" : "Delete"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
