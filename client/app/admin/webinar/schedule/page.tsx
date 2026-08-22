"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, CalendarClock, Trash2, Pencil, Radio, RadioTower } from "lucide-react";
import {
    fetchWebinarSchedules,
    createWebinarSchedule,
    updateWebinarSchedule,
    deleteWebinarSchedule,
    publishWebinarSchedule,
    setWebinarScheduleLive,
    unsetWebinarScheduleLive,
    type WebinarSchedule,
} from "@/lib/adminApi";

function toLocalInputValue(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const emptyForm = { title: "", scheduledAt: "", durationMinutes: 60, meetLink: "" };

export default function AdminWebinarSchedulePage() {
    const [schedules, setSchedules] = useState<WebinarSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState(emptyForm);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState(emptyForm);
    const [editSaving, setEditSaving] = useState(false);

    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setSchedules(await fetchWebinarSchedules());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await createWebinarSchedule({
                title: form.title || undefined,
                scheduledAt: new Date(form.scheduledAt).toISOString(),
                durationMinutes: form.durationMinutes,
                meetLink: form.meetLink || undefined,
            });
            setForm(emptyForm);
            setShowForm(false);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to create webinar schedule");
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (s: WebinarSchedule) => {
        setEditingId(s.id);
        setEditForm({
            title: s.title,
            scheduledAt: toLocalInputValue(s.scheduledAt),
            durationMinutes: s.durationMinutes,
            meetLink: s.meetLink ?? "",
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setError("");
    };

    const saveEdit = async (id: string) => {
        setEditSaving(true);
        setError("");
        try {
            await updateWebinarSchedule(id, {
                title: editForm.title,
                scheduledAt: new Date(editForm.scheduledAt).toISOString(),
                durationMinutes: editForm.durationMinutes,
                meetLink: editForm.meetLink || undefined,
            });
            setEditingId(null);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to update webinar schedule");
        } finally {
            setEditSaving(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete webinar "${title}"?`)) return;
        setBusyId(id);
        try {
            await deleteWebinarSchedule(id);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to delete webinar schedule");
        } finally {
            setBusyId(null);
        }
    };

    const handleTogglePublish = async (s: WebinarSchedule) => {
        setBusyId(s.id);
        setError("");
        try {
            await publishWebinarSchedule(s.id, !s.isPublished);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to update publish state");
        } finally {
            setBusyId(null);
        }
    };

    const handleToggleLive = async (s: WebinarSchedule) => {
        setBusyId(s.id);
        setError("");
        try {
            if (s.isLive) await unsetWebinarScheduleLive(s.id);
            else await setWebinarScheduleLive(s.id);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to update live state");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Webinar Schedule</h1>
                    <p className="text-sm text-white/40 mt-0.5">
                        {schedules.length} scheduled &middot; only one can be live at a time
                    </p>
                </div>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors"
                >
                    <Plus size={15} />
                    New Webinar
                </button>
            </div>

            {error && (
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {showForm && (
                <div className="bg-ink-800 border border-brand-500/20 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-5">New Webinar</h2>
                    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <Field label="Title" className="sm:col-span-2">
                            <input
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                placeholder="AI Tools Live Workshop"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Date & Time" required>
                            <input
                                type="datetime-local"
                                value={form.scheduledAt}
                                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                                className={inputCls}
                                required
                            />
                        </Field>
                        <Field label="Duration (min)">
                            <input
                                type="number"
                                min={15}
                                max={480}
                                value={form.durationMinutes}
                                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Meet Link (optional)" className="sm:col-span-4">
                            <input
                                value={form.meetLink}
                                onChange={(e) => setForm((f) => ({ ...f, meetLink: e.target.value }))}
                                placeholder="https://meet.google.com/..."
                                className={inputCls}
                            />
                        </Field>
                        {error && <p className="sm:col-span-4 text-red-400 text-xs">{error}</p>}
                        <div className="sm:col-span-4 flex gap-3">
                            <button type="submit" disabled={saving} className={`${primaryBtn} disabled:opacity-50`}>
                                {saving && <Spinner />}
                                {saving ? "Creating…" : "Create Webinar"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className={ghostBtn}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
                <div className="hidden sm:grid grid-cols-12 px-6 py-2.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest border-b border-white/4">
                    <span className="col-span-4">Webinar</span>
                    <span className="col-span-3">Date &amp; Time</span>
                    <span className="col-span-1">Duration</span>
                    <span className="col-span-1">Status</span>
                    <span className="col-span-3 text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="p-6 space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-14 rounded-lg bg-ink-700/40 animate-pulse" />
                        ))}
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="py-16 text-center">
                        <CalendarClock size={32} className="mx-auto text-white/15 mb-3" />
                        <p className="text-sm text-white/35">No webinars scheduled yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/4">
                        {schedules.map((s) => (
                            <div
                                key={s.id}
                                className="grid grid-cols-12 items-center px-6 py-4 hover:bg-ink-700/25 transition-colors gap-y-2"
                            >
                                {editingId === s.id ? (
                                    <>
                                        <div className="col-span-12 sm:col-span-4">
                                            <input
                                                value={editForm.title}
                                                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                                                className={`${inputCls} py-1.5 text-xs`}
                                            />
                                        </div>
                                        <div className="col-span-8 sm:col-span-3">
                                            <input
                                                type="datetime-local"
                                                value={editForm.scheduledAt}
                                                onChange={(e) => setEditForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                                                className={`${inputCls} py-1.5 text-xs`}
                                            />
                                        </div>
                                        <div className="col-span-4 sm:col-span-1">
                                            <input
                                                type="number"
                                                min={15}
                                                max={480}
                                                value={editForm.durationMinutes}
                                                onChange={(e) =>
                                                    setEditForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))
                                                }
                                                className={`${inputCls} py-1.5 text-xs`}
                                            />
                                        </div>
                                        <span className="hidden sm:block col-span-1" />
                                        <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => saveEdit(s.id)}
                                                disabled={editSaving}
                                                className="px-3 py-1.5 rounded-lg bg-brand-500 text-ink-950 text-xs font-semibold hover:bg-brand-400 transition-colors disabled:opacity-50"
                                            >
                                                {editSaving ? <Spinner small /> : "Save"}
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="px-3 py-1.5 rounded-lg border border-white/10 text-white/55 text-xs hover:bg-white/4 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="col-span-12 sm:col-span-4 min-w-0">
                                            <p className="text-sm font-semibold text-white/90 truncate">{s.title}</p>
                                            {s.meetLink && (
                                                <p className="text-[11px] text-white/35 truncate">{s.meetLink}</p>
                                            )}
                                        </div>
                                        <span className="hidden sm:block col-span-3 text-xs text-white/50">
                                            {formatDateTime(s.scheduledAt)}
                                        </span>
                                        <span className="hidden sm:block col-span-1 text-xs text-white/45">
                                            {s.durationMinutes}m
                                        </span>
                                        <div className="col-span-6 sm:col-span-1 flex flex-col gap-1">
                                            <span
                                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit ${
                                                    s.isPublished
                                                        ? "bg-brand-500/10 text-brand-400"
                                                        : "bg-white/5 text-white/30"
                                                }`}
                                            >
                                                {s.isPublished ? "PUBLISHED" : "DRAFT"}
                                            </span>
                                            {s.isLive && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit bg-red-500/10 text-red-400">
                                                    LIVE
                                                </span>
                                            )}
                                        </div>

                                        <div className="col-span-6 sm:col-span-3 flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => handleToggleLive(s)}
                                                disabled={busyId === s.id || (!s.isPublished && !s.isLive)}
                                                title={
                                                    !s.isPublished && !s.isLive
                                                        ? "Publish this webinar first"
                                                        : s.isLive
                                                            ? "Take off live"
                                                            : "Make this the live webinar"
                                                }
                                                className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                                                    s.isLive
                                                        ? "text-red-400 hover:bg-red-500/8"
                                                        : "text-white/35 hover:text-red-400 hover:bg-red-500/8"
                                                }`}
                                            >
                                                {busyId === s.id ? (
                                                    <Spinner small />
                                                ) : s.isLive ? (
                                                    <RadioTower size={14} />
                                                ) : (
                                                    <Radio size={14} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleTogglePublish(s)}
                                                disabled={busyId === s.id}
                                                className="px-2.5 py-1.5 rounded-lg border border-white/10 text-white/55 text-[11px] font-semibold hover:bg-white/4 transition-colors disabled:opacity-40"
                                            >
                                                {s.isPublished ? "Unpublish" : "Publish"}
                                            </button>
                                            <button
                                                onClick={() => startEdit(s)}
                                                className="p-1.5 rounded-lg text-white/35 hover:text-brand-400 hover:bg-brand-500/8 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(s.id, s.title)}
                                                disabled={busyId === s.id}
                                                className="p-1.5 rounded-lg text-white/35 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function Field({
    label,
    required,
    className,
    children,
}: {
    label: string;
    required?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                {label}
                {required && <span className="text-brand-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

function Spinner({ small }: { small?: boolean }) {
    const s = small ? "w-3 h-3 border" : "w-3.5 h-3.5 border-2";
    return <span className={`${s} border-current border-t-transparent rounded-full animate-spin`} />;
}

const inputCls =
    "w-full bg-ink-900 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition";
const primaryBtn =
    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors";
const ghostBtn =
    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/55 text-sm hover:text-white/80 hover:bg-white/4 transition-colors";
