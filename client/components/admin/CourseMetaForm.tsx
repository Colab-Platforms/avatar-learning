import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { updateCourse } from "@/lib/adminApi";
import { Field, Spinner, inputCls, primaryBtn } from "./FormField";
import { ToolsEditor } from "./ToolsEditor";
import { LearnItemEditor, CourseLearnItem } from "./LearnItemEditor";
import { CourseImageUpload } from "./CourseImageUpload";

interface Course {
    id: string; title: string; slug: string; level: string; price: number; totalWeeks: number;
    isPublished: boolean; description?: string; thumbnail?: string;
    heroImage?: string; bannerImage?: string;
    tools: string[]; sessions?: string; certificate: boolean;
    rating?: number; reviews?: string; startDate?: string; seats?: string;
    whatYouLearn?: unknown; audience?: unknown;
    category: { id: string; name: string };
    _count: { enrollments: number };
    lessons: any[];
}

export function CourseMetaForm({ course, onSaved }: { course: Course; onSaved: () => void }) {
    const [form, setForm] = useState({
        heroImage: course.heroImage ?? "",
        bannerImage: course.bannerImage ?? "",
        thumbnail: course.thumbnail ?? "",
        sessions: course.sessions ?? "",
        certificate: course.certificate,
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
                thumbnail: form.thumbnail || undefined,
                sessions: form.sessions || undefined,
                certificate: form.certificate,
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

            {/* Status message */}
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

            {/* ── Image uploads ── */}
            <div className="grid sm:grid-cols-3 gap-5">
                <CourseImageUpload
                    courseId={course.id}
                    field="heroImage"
                    label="Hero Image"
                    currentUrl={form.heroImage || undefined}
                    onUploaded={(url) => setForm((f) => ({ ...f, heroImage: url }))}
                />
                <CourseImageUpload
                    courseId={course.id}
                    field="bannerImage"
                    label="Banner Image"
                    currentUrl={form.bannerImage || undefined}
                    onUploaded={(url) => setForm((f) => ({ ...f, bannerImage: url }))}
                />
                <CourseImageUpload
                    courseId={course.id}
                    field="thumbnail"
                    label="Thumbnail"
                    currentUrl={form.thumbnail || undefined}
                    onUploaded={(url) => setForm((f) => ({ ...f, thumbnail: url }))}
                />
            </div>

            {/* Note: images are uploaded immediately on file selection.
                The URLs are saved to the DB when you click Save below. */}
            <p className="text-[11px] text-white/25 -mt-2">
                Images upload instantly to Cloudinary. Click <strong className="text-white/40">Save Metadata</strong> below to persist the URLs to the database.
            </p>

            {/* ── Other fields ── */}
            <div className="grid sm:grid-cols-2 gap-4">
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
            <div>
                <label className="flex items-center gap-2.5 text-sm text-white/55 cursor-pointer select-none">
                    <input type="checkbox" className="accent-brand-500 w-4 h-4 rounded"
                        checked={form.certificate}
                        onChange={(e) => setForm((f) => ({ ...f, certificate: e.target.checked }))} />
                    Include certificate on completion
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
