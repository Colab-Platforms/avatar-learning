import { useState, useEffect, useRef } from "react";
import { Save, Eye, Upload, Trash2, Image as ImageIcon, X } from "lucide-react";
import { updateCourse, uploadCourseImage } from "@/lib/adminApi";
import { Field, Spinner, inputCls, primaryBtn } from "./FormField";
import { ToolsEditor } from "./ToolsEditor";
import { LearnItemEditor, CourseLearnItem } from "./LearnItemEditor";

interface Course {
    id: string; title: string; slug: string; level: string; price: number; totalWeeks: number;
    isPublished: boolean; description?: string; thumbnail?: string;
    heroImage?: string; bannerImage?: string;
    tools: string[]; sessions?: string; certificate: boolean;
    isDirect2HireCourse: boolean;
    rating?: number; reviews?: string; startDate?: string; seats?: string;
    whatYouLearn?: unknown; audience?: unknown;
    category: { id: string; name: string };
    _count: { enrollments: number };
    lessons: any[];
}

/* ── Lazy image card with View / Replace / Delete ──────────────────────────── */

interface ImageCardProps {
    label: string;
    sublabel: string;
    url: string;
    onReplace: (url: string) => void;
    onDelete: () => void;
}

function ImageCard({ label, sublabel, url, onReplace, onDelete }: ImageCardProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [viewing, setViewing] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) { setUploadError("Only image files are allowed."); return; }
        setUploadError("");
        setUploading(true);
        try {
            const newUrl = await uploadCourseImage(file);
            onReplace(newUrl);
        } catch {
            setUploadError("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-white/8 bg-ink-900">
                {/* icon */}
                <div className="w-9 h-9 rounded-lg bg-ink-700 border border-white/6 flex items-center justify-center shrink-0">
                    <ImageIcon size={16} className="text-brand-400/70" />
                </div>

                {/* name */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/85 truncate">{label}</p>
                    <p className="text-[11px] text-white/35 mt-0.5">{sublabel}</p>
                </div>

                {/* actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => { setImgLoaded(false); setViewing(true); }}
                        title="View image"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-white/50 text-xs hover:text-brand-300 hover:border-brand-500/30 hover:bg-brand-500/6 transition-colors"
                    >
                        <Eye size={12} /> View
                    </button>
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        title="Replace image"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-white/50 text-xs hover:text-white/80 hover:bg-white/4 transition-colors disabled:opacity-40"
                    >
                        {uploading ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Upload size={12} />}
                        {uploading ? "Uploading…" : "Replace"}
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        title="Remove image"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 text-white/50 text-xs hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/6 transition-colors"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>

                {uploadError && <p className="text-[10px] text-red-400 mt-1 w-full">{uploadError}</p>}

                <input ref={inputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
            </div>

            {/* View modal */}
            {viewing && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setViewing(false)}
                >
                    <div
                        className="relative max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-ink-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* modal header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                            <div>
                                <p className="text-sm font-semibold text-white">{label}</p>
                                <p className="text-[11px] text-white/35 mt-0.5">{sublabel}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewing(false)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-colors"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* image area */}
                        <div className="relative bg-ink-950 min-h-64 flex items-center justify-center">
                            {/* skeleton shown until image loads */}
                            {!imgLoaded && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                    <span className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs text-white/30">Loading image…</p>
                                </div>
                            )}
                            <img
                                src={url}
                                alt={label}
                                onLoad={() => setImgLoaded(true)}
                                className={`w-full max-h-[70vh] object-contain transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                            />
                        </div>

                        {/* footer with URL */}
                        <div className="px-5 py-3 border-t border-white/8 flex items-center gap-3">
                            <p className="flex-1 text-[10px] text-white/25 truncate font-mono">{url}</p>
                            <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors shrink-0"
                            >
                                Open original ↗
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ── Empty upload zone (no image set yet) ──────────────────────────────────── */

interface EmptyImageSlotProps {
    label: string;
    sublabel: string;
    onUploaded: (url: string) => void;
}

function EmptyImageSlot({ label, sublabel, onUploaded }: EmptyImageSlotProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) { setError("Only image files are allowed."); return; }
        setError("");
        setUploading(true);
        try {
            const url = await uploadCourseImage(file);
            onUploaded(url);
        } catch {
            setError("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <div
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-dashed border-white/10 bg-ink-900 cursor-pointer hover:border-brand-500/30 hover:bg-brand-500/4 transition-colors"
                onClick={() => !uploading && inputRef.current?.click()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onDragOver={(e) => e.preventDefault()}
            >
                <div className="w-9 h-9 rounded-lg bg-ink-700 border border-white/6 flex items-center justify-center shrink-0">
                    {uploading
                        ? <span className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                        : <ImageIcon size={16} className="text-white/20" />
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/40">{label}</p>
                    <p className="text-[11px] text-white/25 mt-0.5">{sublabel}</p>
                </div>
                <span className="text-[11px] text-brand-400/70 shrink-0">
                    {uploading ? "Uploading…" : "Click or drop to upload"}
                </span>
            </div>
            {error && <p className="text-[10px] text-red-400">{error}</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        </div>
    );
}

/* ── Main form ─────────────────────────────────────────────────────────────── */

export function CourseMetaForm({ course, onSaved }: { course: Course; onSaved: () => void }) {
    const [form, setForm] = useState({
        heroImage: course.heroImage ?? "",
        bannerImage: course.bannerImage ?? "",
        sessions: course.sessions ?? "",
        certificate: course.certificate,
        isDirect2HireCourse: course.isDirect2HireCourse,
        rating: course.rating?.toString() ?? "",
        reviews: course.reviews ?? "",
        startDate: course.startDate ?? "",
        seats: course.seats ?? "",
    });
    const [tools, setTools] = useState<string[]>(course.tools ?? []);
    const toLearnItems = (raw: unknown): CourseLearnItem[] => {
        if (!Array.isArray(raw)) return [];
        return (raw as CourseLearnItem[]).map((item) => ({
            title: item?.title ?? "",
            body: item?.body ?? "",
        }));
    };
    const [whatYouLearn, setWhatYouLearn] = useState<CourseLearnItem[]>(
        () => toLearnItems(course.whatYouLearn)
    );
    const [audience, setAudience] = useState<CourseLearnItem[]>(
        () => toLearnItems(course.audience)
    );
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

    useEffect(() => {
        if (!msg) return;
        const t = setTimeout(() => setMsg(null), 4000);
        return () => clearTimeout(t);
    }, [msg]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            await updateCourse(course.id, {
                heroImage: form.heroImage || undefined,
                bannerImage: form.bannerImage || undefined,
                sessions: form.sessions || undefined,
                certificate: form.certificate,
                isDirect2HireCourse: form.isDirect2HireCourse,
                rating: form.rating ? parseFloat(form.rating) : undefined,
                reviews: form.reviews || undefined,
                startDate: form.startDate || undefined,
                seats: form.seats || undefined,
                tools,
                whatYouLearn: whatYouLearn.filter((item) => item.title.trim() && item.body.trim()),
                audience: audience.filter((item) => item.title.trim() && item.body.trim()),
            });
            setMsg({ text: "Metadata saved successfully!", ok: true });
            setTimeout(() => onSaved(), 1500);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            const detail = e?.response?.data?.message ?? "Failed to save. Please try again.";
            setMsg({ text: detail, ok: false });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="bg-ink-800 border border-white/6 rounded-2xl p-6 space-y-6">
            <h2 className="text-sm font-semibold text-white mb-1">Course Metadata</h2>

            {msg && (
                <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                    msg.ok
                        ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-300"
                        : "border-red-500/30 bg-red-500/8 text-red-300"
                }`}>
                    <span className="mt-0.5 text-lg leading-none">{msg.ok ? "✓" : "✕"}</span>
                    <span>{msg.text}</span>
                </div>
            )}

            {/* Course images — lazy loaded, no Cloudinary call until View is clicked */}
            <div className="space-y-2">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Course Images</p>
                {form.heroImage ? (
                    <ImageCard
                        label="Hero Image"
                        sublabel="Full-width banner shown at top of the course page"
                        url={form.heroImage}
                        onReplace={(url) => setForm((f) => ({ ...f, heroImage: url }))}
                        onDelete={() => setForm((f) => ({ ...f, heroImage: "" }))}
                    />
                ) : (
                    <EmptyImageSlot
                        label="Hero Image"
                        sublabel="Full-width banner shown at top of the course page"
                        onUploaded={(url) => setForm((f) => ({ ...f, heroImage: url }))}
                    />
                )}
                {form.bannerImage ? (
                    <ImageCard
                        label="Banner Image"
                        sublabel="Secondary promotional image used in listings and sidebars"
                        url={form.bannerImage}
                        onReplace={(url) => setForm((f) => ({ ...f, bannerImage: url }))}
                        onDelete={() => setForm((f) => ({ ...f, bannerImage: "" }))}
                    />
                ) : (
                    <EmptyImageSlot
                        label="Banner Image"
                        sublabel="Secondary promotional image used in listings and sidebars"
                        onUploaded={(url) => setForm((f) => ({ ...f, bannerImage: url }))}
                    />
                )}
            </div>

            {/* Basic fields */}
            <div className="grid sm:grid-cols-2 gap-4 border-t border-white/5 pt-6">
                <Field label="Sessions (e.g. 12 sessions)">
                    <input value={form.sessions} onChange={(e) => setForm((f) => ({ ...f, sessions: e.target.value }))}
                        placeholder="12 sessions" className={inputCls} />
                </Field>
                <Field label="Start Date">
                    <input value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                        placeholder="Jan 2025" className={inputCls} />
                </Field>
                <Field label="Seats (e.g. 30 seats)">
                    <input value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
                        placeholder="30 seats" className={inputCls} />
                </Field>
                <Field label="Rating (0–5)">
                    <input type="number" step="0.1" min={0} max={5}
                        value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                        placeholder="4.8" className={inputCls} />
                </Field>
                <Field label="Reviews text (e.g. 240 reviews)" className="sm:col-span-2">
                    <input value={form.reviews} onChange={(e) => setForm((f) => ({ ...f, reviews: e.target.value }))}
                        placeholder="240 reviews" className={inputCls} />
                </Field>
            </div>

            {/* Tools */}
            <div>
                <Field label="Tools" className="mb-1.5">
                    <ToolsEditor tools={tools} onChange={setTools} />
                </Field>
                <p className="text-[10px] text-white/25">Type a tool name and press Enter or comma to add it.</p>
            </div>

            {/* Certificate */}
            <div className="space-y-3">
                <label className="flex items-center gap-2.5 text-sm text-white/55 cursor-pointer select-none">
                    <input type="checkbox" className="accent-brand-500 w-4 h-4 rounded"
                        checked={form.certificate}
                        onChange={(e) => setForm((f) => ({ ...f, certificate: e.target.checked }))} />
                    Include certificate on completion
                </label>
                <label className="flex items-center gap-2.5 text-sm text-white/55 cursor-pointer select-none">
                    <input type="checkbox" className="accent-brand-500 w-4 h-4 rounded"
                        checked={form.isDirect2HireCourse}
                        onChange={(e) => setForm((f) => ({ ...f, isDirect2HireCourse: e.target.checked }))} />
                    Part of the Direct2Hire course bundle (auto-enrolled on payment)
                </label>
            </div>

            {/* What You'll Learn */}
            <div className="border-t border-white/5 pt-6">
                <LearnItemEditor
                    label="What You'll Learn"
                    items={whatYouLearn}
                    onChange={setWhatYouLearn}
                />
            </div>

            {/* Audience */}
            <div className="border-t border-white/5 pt-6">
                <LearnItemEditor
                    label="Who This Program Is For (Audience)"
                    items={audience}
                    onChange={setAudience}
                />
            </div>

            {/* Save button */}
            <div className="flex justify-end border-t border-white/5 pt-6">
                <button type="submit" disabled={saving} className={`${primaryBtn} disabled:opacity-50`}>
                    {saving ? <><Spinner /> Saving…</> : <><Save size={14} /> Save Metadata</>}
                </button>
            </div>
        </form>
    );
}
