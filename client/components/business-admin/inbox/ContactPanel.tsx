"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, ShieldCheck, ShieldOff, StickyNote, Tag, UserPlus, X } from "lucide-react";
import {
  addNote,
  assignConversation,
  createContact,
  describeApiError,
  fetchConversationProfile,
  fetchEvents,
  setContactOptIn,
  updateContact,
  type ContactDetail,
  type ContactRecord,
  type ConversationEvent,
  type PersonRef,
} from "@/lib/businessAdminApi";
import { displayName, initials, windowLabel } from "@/lib/inboxLogic";
import { formatWhen } from "../ui";

const MAX_NOTE = 2000;
const input = "w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none";

const EVIDENCE_LABEL: Record<string, string> = {
  website_form: "Website form (Book a Demo or similar)",
  whatsapp_optin_flow: "WhatsApp opt-in flow",
  written: "Written / signed",
  verbal_recorded: "Verbal, recorded",
  existing_customer_agreement: "Customer agreement terms",
};

function historyLine(e: ConversationEvent): string {
  const by = e.author?.name ?? "Someone";
  if (e.type === "ASSIGNED") return `${by} assigned this to ${e.assignee?.name ?? "a team member"}`;
  return `${by} unassigned this${e.assignee ? ` (was ${e.assignee.name})` : ""}`;
}

/** Saved-contact profile: details, tags and the consent register used for business-initiated (template) messages. */
function ProfileSection({ waId, contact, profile, evidenceTypes, onChanged }: { waId: string; contact: ContactDetail | undefined; profile: ContactRecord | null; evidenceTypes: string[]; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", tags: "" });
  const [consent, setConsent] = useState({ evidence: "", note: "" });
  const [error, setError] = useState("");

  const begin = () => {
    setForm({ name: profile?.name ?? contact?.contactName ?? "", email: profile?.email ?? "", company: profile?.company ?? "", tags: (profile?.tags ?? []).join(", ") });
    setError("");
    setEditing(true);
  };
  const save = useMutation({
    mutationFn: () => {
      const payload = { name: form.name, email: form.email, company: form.company, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) };
      return profile ? updateContact(profile.id, payload) : createContact({ ...payload, phone: `+${waId}` });
    },
    onSuccess: () => {
      setEditing(false);
      onChanged();
    },
    onError: (err) => setError(describeApiError(err)),
  });
  const optIn = useMutation({
    mutationFn: (v: { status: "GRANTED" | "WITHDRAWN"; evidence?: string; note?: string }) => setContactOptIn((profile as ContactRecord).id, v),
    onSuccess: () => {
      setConsentOpen(false);
      setConsent({ evidence: "", note: "" });
      onChanged();
    },
    onError: (err) => setError(describeApiError(err)),
  });
  const status = profile?.optIn.status ?? "UNKNOWN";

  return (
    <section className="border-b border-white/5 p-4" data-testid="profile-section">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/35"><Tag size={12} /> Contact profile</h3>
        {!editing && (
          <button type="button" onClick={begin} className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300">
            {profile ? <Pencil size={11} /> : <UserPlus size={11} />} {profile ? "Edit" : "Save contact"}
          </button>
        )}
      </div>

      {editing ? (
        <form
          className="mt-3 space-y-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.name.trim().length < 2) return setError("Enter a name.");
            setError("");
            save.mutate();
          }}
        >
          <input aria-label="Name" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
          <input aria-label="Email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
          <input aria-label="Company" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={input} />
          <input aria-label="Tags" placeholder="Tags, comma separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={input} />
          {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={save.isPending} className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60">{save.isPending ? "Saving…" : "Save"}</button>
          </div>
        </form>
      ) : profile ? (
        <dl className="mt-3 space-y-1.5 text-xs">
          {profile.email && <div className="flex justify-between gap-3"><dt className="text-white/40">Email</dt><dd className="truncate text-white/80">{profile.email}</dd></div>}
          {profile.company && <div className="flex justify-between gap-3"><dt className="text-white/40">Company</dt><dd className="truncate text-white/80">{profile.company}</dd></div>}
          <div className="flex flex-wrap gap-1 pt-1">
            {profile.tags.length === 0 ? <span className="text-white/30">No tags</span> : profile.tags.map((t) => <span key={t} className="rounded bg-white/8 px-1.5 py-px text-[11px] text-white/65">{t}</span>)}
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-xs text-white/35">This number is not saved as a contact yet.</p>
      )}

      {/* Consent register */}
      <div className="mt-4 rounded-lg border border-white/8 p-3" data-testid="consent-box">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
          {status === "GRANTED" ? <ShieldCheck size={13} className="text-emerald-400" /> : <ShieldOff size={13} className={status === "WITHDRAWN" ? "text-red-400" : "text-white/40"} />}
          WhatsApp consent: {status === "GRANTED" ? "Opted in" : status === "WITHDRAWN" ? "Opted out" : "Not recorded"}
        </p>
        {status === "GRANTED" && <p className="mt-1 text-[11px] text-white/45">{profile?.optIn.evidence} · {formatWhen(profile?.optIn.at)}</p>}
        {status === "WITHDRAWN" && <p className="mt-1 text-[11px] text-red-200/70">{profile?.optIn.bySomeoneElse ? "Withdrawn by your team" : "The customer opted out"} · {formatWhen(profile?.optIn.outAt)}. Sending is blocked.</p>}
        {status === "UNKNOWN" && <p className="mt-1 text-[11px] text-white/40">Needed to message this customer with a template after 24 hours of silence. Replies inside the 24-hour window do not need it.</p>}
        {!profile ? (
          <p className="mt-2 text-[11px] text-white/35">Save the contact first to record consent.</p>
        ) : consentOpen ? (
          <form
            className="mt-2 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!consent.evidence) return setError("Choose how the customer agreed.");
              if (consent.note.trim().length < 3) return setError("Add a short reference, for example the form name or date.");
              setError("");
              optIn.mutate({ status: "GRANTED", evidence: consent.evidence, note: consent.note });
            }}
          >
            <select aria-label="How did the customer agree?" value={consent.evidence} onChange={(e) => setConsent({ ...consent, evidence: e.target.value })} className={input}>
              <option value="">How did they agree?</option>
              {evidenceTypes.map((t) => <option key={t} value={t}>{EVIDENCE_LABEL[t] ?? t}</option>)}
            </select>
            <input aria-label="Consent reference" placeholder="Reference (form name, date, ticket…)" value={consent.note} onChange={(e) => setConsent({ ...consent, note: e.target.value })} className={input} />
            {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConsentOpen(false)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5">Cancel</button>
              <button type="submit" disabled={optIn.isPending} className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60">Record consent</button>
            </div>
          </form>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {status !== "GRANTED" && <button type="button" onClick={() => (setError(""), setConsentOpen(true))} className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/75 hover:bg-white/5">Record opt-in…</button>}
            {status !== "WITHDRAWN" && <button type="button" disabled={optIn.isPending} onClick={() => optIn.mutate({ status: "WITHDRAWN" })} className="rounded-lg border border-red-400/30 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10">Mark opted out</button>}
          </div>
        )}
        {error && !consentOpen && !editing && <p role="alert" className="mt-1.5 text-xs text-red-300">{error}</p>}
      </div>
    </section>
  );
}

export function ContactPanel({ waId, contact, team, onClose }: { waId: string; contact: ContactDetail | undefined; team: PersonRef[]; onClose?: () => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const events = useQuery({ queryKey: ["biz-inbox", "events", waId], queryFn: () => fetchEvents(waId), refetchInterval: 30_000 });
  const profileQ = useQuery({ queryKey: ["biz-inbox", "profile", waId], queryFn: () => fetchConversationProfile(waId), refetchInterval: 30_000 });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["biz-inbox", "events", waId] });
    void qc.invalidateQueries({ queryKey: ["biz-inbox", "contact", waId] });
    void qc.invalidateQueries({ queryKey: ["biz-inbox", "profile", waId] });
    void qc.invalidateQueries({ queryKey: ["biz-inbox", "conversations"] });
  };
  const assign = useMutation({ mutationFn: (id: string | null) => assignConversation(waId, id), onSuccess: refresh });
  const save = useMutation({
    mutationFn: (body: string) => addNote(waId, body),
    onSuccess: () => {
      setNote("");
      refresh();
    },
  });

  const items = events.data?.items ?? [];
  const notes = items.filter((e) => e.type === "NOTE");
  const history = items.filter((e) => e.type !== "NOTE");
  const win = contact ? windowLabel(contact.windowOpen, contact.windowExpiresAt) : null;
  const profile = profileQ.data?.contact ?? null;
  const name = profile?.name ?? (contact ? displayName(contact) : `+${waId}`);
  const assignedId = contact?.assignee?.id ?? "";
  const options = contact?.assignee && !team.some((m) => m.id === contact.assignee?.id) ? [...team, contact.assignee] : team;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto" data-testid="contact-panel">
      <div className="flex items-start justify-between gap-3 border-b border-white/5 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-500/60 to-elec-500/60 text-sm font-bold text-white">{initials(name)}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-white/40">+{waId}</p>
          </div>
        </div>
        {onClose && <button type="button" onClick={onClose} aria-label="Close details" className="rounded-lg p-1.5 text-white/50 hover:bg-white/5"><X size={16} /></button>}
      </div>

      <dl className="space-y-2 border-b border-white/5 p-4 text-xs">
        <div className="flex justify-between gap-3"><dt className="text-white/40">Messages</dt><dd className="text-white/80">{contact?.messageCount ?? "…"}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-white/40">First message</dt><dd className="text-white/80">{formatWhen(contact?.firstMessageAt)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-white/40">Last from customer</dt><dd className="text-white/80">{formatWhen(contact?.lastInboundAt)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-white/40">Reply window</dt><dd className={win?.open ? "text-emerald-300" : "text-amber-300"}>{win ? win.text : "…"}</dd></div>
      </dl>

      {profileQ.isError ? (
        <p role="alert" className="border-b border-white/5 p-4 text-xs text-red-300">{describeApiError(profileQ.error)}</p>
      ) : (
        <ProfileSection waId={waId} contact={contact} profile={profile} evidenceTypes={profileQ.data?.evidenceTypes ?? []} onChanged={refresh} />
      )}

      <section className="border-b border-white/5 p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/35">Assigned to</h3>
        <select aria-label="Assign conversation" value={assignedId} disabled={assign.isPending} onChange={(e) => assign.mutate(e.target.value === "" ? null : e.target.value)} className={`${input} mt-2 disabled:opacity-60`}>
          <option value="">Unassigned</option>
          {options.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        {assign.isError && <p role="alert" className="mt-1.5 text-xs text-red-300">{describeApiError(assign.error)}</p>}
        {history.length > 0 && (
          <ul aria-label="Assignment history" className="mt-3 space-y-1.5">
            {history.slice(0, 6).map((e) => <li key={e.id} className="text-[11px] leading-snug text-white/40">{historyLine(e)} <span className="text-white/25">· {formatWhen(e.createdAt)}</span></li>)}
          </ul>
        )}
      </section>

      <section className="border-b border-white/5 p-4">
        <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/35"><StickyNote size={12} /> Internal notes</h3>
        <p className="mt-1 text-[11px] text-white/30">Only your team sees these. They are never sent to the customer.</p>
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            const body = note.trim();
            if (body && !save.isPending) save.mutate(body);
          }}
        >
          <label className="block">
            <span className="sr-only">Add an internal note</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={MAX_NOTE} placeholder="Add a note for your team…" className={`${input} resize-y`} />
          </label>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[10px] text-white/25">{note.length}/{MAX_NOTE}</span>
            <button type="submit" disabled={!note.trim() || save.isPending} className="rounded-lg bg-white/8 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/12 disabled:opacity-40">{save.isPending ? "Saving…" : "Save note"}</button>
          </div>
          {save.isError && <p role="alert" className="mt-1.5 text-xs text-red-300">{describeApiError(save.error)}</p>}
        </form>
        <ul aria-label="Internal notes" className="mt-3 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg border border-amber-300/15 bg-amber-300/5 px-3 py-2">
              <p className="whitespace-pre-wrap break-words text-xs text-white/80">{n.body}</p>
              <p className="mt-1 text-[10px] text-white/35">{n.author?.name ?? "Someone"} · {formatWhen(n.createdAt)}</p>
            </li>
          ))}
          {events.isLoading && <li className="text-xs text-white/30">Loading…</li>}
          {events.isError && <li role="alert" className="text-xs text-red-300">{describeApiError(events.error)}</li>}
          {!events.isLoading && !events.isError && notes.length === 0 && <li className="text-xs text-white/30">No notes yet.</li>}
        </ul>
      </section>

      <section className="p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/35">CRM &amp; Customer 360</h3>
        <p className="mt-2 rounded-lg border border-dashed border-white/10 px-3 py-3 text-xs text-white/35">Not linked yet. Leads, orders and account details will appear here once CRM is connected to WhatsApp.</p>
      </section>
    </div>
  );
}
