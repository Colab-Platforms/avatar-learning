"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ChevronRight, Eye, EyeOff, Plus, FileText, CheckCircle, Clock, Users,
} from "lucide-react";
import {
    fetchAdminCourse, createLesson, deleteLesson, deleteResource, toggleCoursePublish,
} from "@/lib/adminApi";
import { Field, Spinner, inputCls, primaryBtn } from "@/components/admin/FormField";
import { ModuleListEditor } from "@/components/admin/ModuleEditors";
import { WeekRow } from "@/components/admin/WeekRow";
import { CourseMetaForm } from "@/components/admin/CourseMetaForm";

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Resource {
    id: string; title: string; category: string; type: string; url: string;
    bunnyVideoId?: string; size?: string;
}

interface Lesson {
    id: string; weekNumber: number; title: string; description?: string;
    modules: string[]; isPublished: boolean; isFreePreview: boolean;
    lessonOrder: number; resources: Resource[];
}

interface Course {
    id: string; title: string; slug: string; level: string; price: number; totalWeeks: number;
    isPublished: boolean; description?: string; thumbnail?: string;
    heroImage?: string; bannerImage?: string;
    tools: string[]; sessions?: string; certificate: boolean;
    rating?: number; reviews?: string; startDate?: string; seats?: string;
    whatYouLearn?: unknown; audience?: unknown;
    category: { id: string; name: string };
    _count: { enrollments: number };
    lessons: Lesson[];
}

const LEVEL_COLOR: Record<string, string> = {
    BEGINNER: "text-emerald-400 bg-emerald-400/10",
    INTERMEDIATE: "text-amber-400 bg-amber-400/10",
    ADVANCED: "text-red-400 bg-red-400/10",
};

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function CourseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"weeks" | "meta">("weeks");
    const [togglingPublish, setTogglingPublish] = useState(false);
    const [showAddLesson, setShowAddLesson] = useState(false);
    const [savingLesson, setSavingLesson] = useState(false);
    const [deletingLesson, setDeletingLesson] = useState<string | null>(null);
    const [deletingResource, setDeletingResource] = useState<string | null>(null);
    const [uploadingFor, setUploadingFor] = useState<string | null>(null);
    const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
    const [editingModules, setEditingModules] = useState<string | null>(null);
    const [lessonForm, setLessonForm] = useState({
        weekNumber: 1, title: "", description: "", lessonOrder: 1, isFreePreview: false, modules: [] as string[],
    });

    const load = useCallback(async () => {
        setLoading(true);
        try { setCourse(await fetchAdminCourse(id)); }
        catch { setError("Failed to load course."); }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const handlePublish = async () => {
        setTogglingPublish(true);
        try { await toggleCoursePublish(id); await load(); }
        catch { setError("Failed to toggle publish state."); }
        finally { setTogglingPublish(false); }
    };

    const submitLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingLesson(true);
        setError("");
        try {
            await createLesson(id, lessonForm);
            setLessonForm({ weekNumber: 1, title: "", description: "", lessonOrder: 1, isFreePreview: false, modules: [] });
            setShowAddLesson(false);
            await load();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e?.response?.data?.message ?? "Failed to add lesson.");
        } finally { setSavingLesson(false); }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm("Delete this week and all its videos?")) return;
        setDeletingLesson(lessonId);
        try { await deleteLesson(lessonId); await load(); }
        catch { setError("Failed to delete lesson."); }
        finally { setDeletingLesson(null); }
    };

    const handleDeleteResource = async (resourceId: string) => {
        if (!confirm("Delete this resource? If it's a video, it will also be removed from Bunny.net.")) return;
        setDeletingResource(resourceId);
        try { await deleteResource(resourceId); await load(); }
        catch { setError("Failed to delete resource."); }
        finally { setDeletingResource(null); }
    };

    if (loading) return (
        <div className="p-8 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className={`rounded-2xl bg-ink-800 animate-pulse ${i === 0 ? "h-32" : "h-24"}`} />)}
        </div>
    );

    if (!course) return (
        <div className="p-8 text-center">
            <p className="text-red-400 text-sm">{error || "Course not found."}</p>
            <Link href="/admin/courses" className="mt-3 inline-block text-xs text-brand-400">← Back to courses</Link>
        </div>
    );

    const sortedLessons = [...course.lessons].sort((a, b) => a.weekNumber - b.weekNumber);

    return (
        <div className="p-8 space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-white/35">
                <Link href="/admin" className="hover:text-white/60 transition-colors">Admin</Link>
                <ChevronRight size={12} />
                <Link href="/admin/courses" className="hover:text-white/60 transition-colors">Courses</Link>
                <ChevronRight size={12} />
                <span className="text-white/55 truncate max-w-48">{course.title}</span>
            </div>

            {error && (
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            {/* Course Header */}
            <div className="bg-ink-800 border border-white/6 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full sm:w-40 h-24 object-cover rounded-xl shrink-0 bg-ink-700" />
                    ) : (
                        <div className="w-full sm:w-40 h-24 rounded-xl bg-ink-700 border border-white/5 flex items-center justify-center shrink-0">
                            <FileText size={28} className="text-white/20" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h1 className="text-xl font-bold text-white">{course.title}</h1>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLOR[course.level]}`}>
                                {course.level}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                course.isPublished ? "bg-brand-500/10 text-brand-400" : "bg-white/6 text-white/35"
                            }`}>
                                {course.isPublished ? "Live" : "Draft"}
                            </span>
                        </div>
                        {course.description && (
                            <p className="text-sm text-white/45 mb-3 line-clamp-2">{course.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-white/40">
                            <span className="flex items-center gap-1.5"><Users size={12} /> {course._count.enrollments} enrolled</span>
                            <span className="flex items-center gap-1.5"><Clock size={12} /> {course.totalWeeks} weeks</span>
                            <span className="flex items-center gap-1.5"><FileText size={12} /> {course.lessons.length} weeks added</span>
                            <span className="flex items-center gap-1.5">
                                {course.price === 0
                                    ? <><CheckCircle size={12} className="text-brand-400" /><span className="text-brand-400">Free</span></>
                                    : `₹${course.price}`}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handlePublish}
                        disabled={togglingPublish}
                        className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                            course.isPublished
                                ? "bg-white/6 text-white/60 hover:bg-white/10 border border-white/10"
                                : "bg-brand-500 text-ink-950 hover:bg-brand-400"
                        }`}
                    >
                        {togglingPublish ? <Spinner /> : course.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                        {course.isPublished ? "Unpublish" : "Publish"}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-ink-900/60 border border-white/5 rounded-xl p-1 w-fit">
                {(["weeks", "meta"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === tab
                                ? "bg-ink-800 text-white border border-white/8"
                                : "text-white/35 hover:text-white/60"
                        }`}>
                        {tab === "weeks" ? "Weeks & Modules" : "Course Metadata"}
                    </button>
                ))}
            </div>

            {/* ── WEEKS TAB ── */}
            {activeTab === "weeks" && (
                <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                        <h2 className="text-sm font-semibold text-white">
                            Weeks <span className="text-white/30 font-normal">({sortedLessons.length} / {course.totalWeeks})</span>
                        </h2>
                        <button
                            onClick={() => setShowAddLesson((v) => !v)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/10 text-white/55 text-xs hover:text-white/80 hover:bg-white/4 transition-colors"
                        >
                            <Plus size={13} />
                            {showAddLesson ? "Cancel" : "Add Week"}
                        </button>
                    </div>

                    {/* Add Lesson Form */}
                    {showAddLesson && (
                        <div className="px-6 py-5 border-b border-white/5 bg-ink-900/50">
                            <form onSubmit={submitLesson} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Week Number" required>
                                    <input type="number" min={1} max={course.totalWeeks}
                                        value={lessonForm.weekNumber}
                                        onChange={(e) => setLessonForm((f) => ({ ...f, weekNumber: Number(e.target.value) }))}
                                        className={inputCls} required />
                                </Field>
                                <Field label="Order" required>
                                    <input type="number" min={1} value={lessonForm.lessonOrder}
                                        onChange={(e) => setLessonForm((f) => ({ ...f, lessonOrder: Number(e.target.value) }))}
                                        className={inputCls} required />
                                </Field>
                                <Field label="Week Title" required className="sm:col-span-2">
                                    <input value={lessonForm.title}
                                        onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                                        placeholder="Week 1: Introduction to Generative AI" className={inputCls} required />
                                </Field>
                                <Field label="Description" className="sm:col-span-2">
                                    <textarea value={lessonForm.description}
                                        onChange={(e) => setLessonForm((f) => ({ ...f, description: e.target.value }))}
                                        rows={2} placeholder="What will students cover this week?" className={`${inputCls} resize-none`} />
                                </Field>

                                {/* Modules inline editor */}
                                <Field label="Lesson Topics (modules)" className="sm:col-span-2">
                                    <ModuleListEditor
                                        modules={lessonForm.modules}
                                        onChange={(mods) => setLessonForm((f) => ({ ...f, modules: mods }))}
                                    />
                                </Field>

                                <div className="sm:col-span-2 flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm text-white/55 cursor-pointer select-none">
                                        <input type="checkbox" className="accent-brand-500 rounded"
                                            checked={lessonForm.isFreePreview}
                                            onChange={(e) => setLessonForm((f) => ({ ...f, isFreePreview: e.target.checked }))} />
                                        Free Preview
                                    </label>
                                    <button type="submit" disabled={savingLesson} className={`${primaryBtn} disabled:opacity-50`}>
                                        {savingLesson && <Spinner />}
                                        {savingLesson ? "Saving…" : "Add Week"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Weeks List */}
                    {sortedLessons.length === 0 ? (
                        <div className="py-14 text-center">
                            <FileText size={28} className="mx-auto text-white/15 mb-3" />
                            <p className="text-sm text-white/35">No weeks yet. Add the first one above.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/4">
                            {sortedLessons.map((lesson) => (
                                <WeekRow
                                    key={lesson.id}
                                    lesson={lesson}
                                    isExpanded={expandedWeek === lesson.id}
                                    isEditingModules={editingModules === lesson.id}
                                    onToggleExpand={() => setExpandedWeek(expandedWeek === lesson.id ? null : lesson.id)}
                                    onEditModules={() => setEditingModules(lesson.id)}
                                    onModulesSaved={() => { setEditingModules(null); load(); }}
                                    onDelete={() => handleDeleteLesson(lesson.id)}
                                    isDeleting={deletingLesson === lesson.id}
                                    onDeleteResource={handleDeleteResource}
                                    deletingResource={deletingResource}
                                    uploadingFor={uploadingFor}
                                    onStartUpload={() => setUploadingFor(lesson.id)}
                                    onUploadDone={async () => { setUploadingFor(null); await load(); }}
                                    onCancelUpload={() => setUploadingFor(null)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── META TAB ── */}
            {activeTab === "meta" && (
                <CourseMetaForm course={course} onSaved={() => { load(); setError(""); }} />
            )}
        </div>
    );
}

