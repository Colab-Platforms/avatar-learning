"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, BookOpen, Eye, EyeOff, Trash2, Settings2, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import {
    fetchAdminCourses,
    fetchAdminCoursesPaginated,
    fetchCategories,
    createCourse,
    deleteCourse,
    toggleCoursePublish,
} from "@/lib/adminApi";
import type { PaginatedResponse } from "@/lib/coursesApi";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

interface Category { id: string; name: string; slug: string; }
interface Course {
    id: string;
    title: string;
    slug: string;
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    price: number;
    totalWeeks: number;
    isPublished: boolean;
    category: { id: string; name: string };
    _count: { lessons: number; enrollments: number };
}

const LEVEL_COLOR: Record<string, string> = {
    BEGINNER: "text-emerald-400 bg-emerald-400/10",
    INTERMEDIATE: "text-amber-400 bg-amber-400/10",
    ADVANCED: "text-red-400 bg-red-400/10",
};

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [allCoursesCount, setAllCoursesCount] = useState(0);
    const [pagination, setPagination] = useState<Omit<PaginatedResponse<Course>, 'data'> | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filterLevel, setFilterLevel] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [form, setForm] = useState({
        categoryId: "", title: "", description: "", thumbnail: "",
        level: "BEGINNER" as Course["level"], price: 0, totalWeeks: 1,
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [res, cats] = await Promise.all([fetchAdminCoursesPaginated(currentPage, 10), fetchCategories()]);
            setCourses(res.data);
            setAllCoursesCount(res.totalRecords);
            setPagination({
                currentPage: res.currentPage,
                pageSize: res.pageSize,
                totalRecords: res.totalRecords,
                totalPages: res.totalPages,
                hasNextPage: res.hasNextPage,
                hasPreviousPage: res.hasPreviousPage,
            });
            setCategories(cats);
        } finally { setLoading(false); }
    }, [currentPage]);

    useEffect(() => { load(); }, [load]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const filtered = courses.filter((c) => {
        const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.category.name.toLowerCase().includes(search.toLowerCase());
        const matchLevel = filterLevel === "ALL" || c.level === filterLevel;
        const matchStatus = filterStatus === "ALL" ||
            (filterStatus === "PUBLISHED" ? c.isPublished : !c.isPublished);
        return matchSearch && matchLevel && matchStatus;
    });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await createCourse(form);
            setForm({ categoryId: "", title: "", description: "", thumbnail: "", level: "BEGINNER", price: 0, totalWeeks: 1 });
            setShowForm(false);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to create course");
        } finally { setSaving(false); }
    };

    const handleToggle = async (id: string) => {
        setTogglingId(id);
        try { await toggleCoursePublish(id); await load(); }
        catch { setError("Failed to toggle publish state"); }
        finally { setTogglingId(null); }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}" and all its lessons and videos?`)) return;
        setDeletingId(id);
        try { await deleteCourse(id); await load(); }
        catch { setError("Failed to delete course"); }
        finally { setDeletingId(null); }
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Courses</h1>
                    <p className="text-sm text-white/40 mt-0.5">{allCoursesCount} total · {courses.filter(c => c.isPublished).length} on this page</p>
                </div>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors"
                >
                    <Plus size={15} />
                    New Course
                </button>
            </div>

            {error && (
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            {/* Create Form */}
            {showForm && (
                <div className="bg-ink-800 border border-brand-500/20 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-5">New Course</h2>
                    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Category" required>
                            <select
                                value={form.categoryId}
                                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                                className={selectCls}
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Title" required>
                            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                placeholder="Course title" className={inputCls} required />
                        </Field>
                        <Field label="Description" className="sm:col-span-2">
                            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="Short course description" rows={2} className={`${inputCls} resize-none`} />
                        </Field>
                        <div className="sm:col-span-2">
                            <ImageUploadField
                                label="Thumbnail"
                                value={form.thumbnail}
                                onChange={(url) => setForm((f) => ({ ...f, thumbnail: url }))}
                            />
                        </div>
                        <Field label="Level" required>
                            <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as Course["level"] }))}
                                className={selectCls} required>
                                <option value="BEGINNER">Beginner</option>
                                <option value="INTERMEDIATE">Intermediate</option>
                                <option value="ADVANCED">Advanced</option>
                            </select>
                        </Field>
                        <Field label="Price (₹)">
                            <input type="number" min={0} value={form.price}
                                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className={inputCls} />
                        </Field>
                        <Field label="Total Weeks">
                            <input type="number" min={1} value={form.totalWeeks}
                                onChange={(e) => setForm((f) => ({ ...f, totalWeeks: Number(e.target.value) }))} className={inputCls} />
                        </Field>
                        {error && <p className="sm:col-span-2 text-red-400 text-xs">{error}</p>}
                        <div className="sm:col-span-2 flex gap-3">
                            <button type="submit" disabled={saving} className={`${primaryBtn} disabled:opacity-50`}>
                                {saving && <Spinner />}
                                {saving ? "Creating…" : "Create Course"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className={ghostBtn}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-52">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                    <input
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search courses…"
                        className="w-full bg-ink-800 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand-500/40 transition"
                    />
                </div>
                <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}
                    className="bg-ink-800 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white/70 focus:outline-none focus:border-brand-500/40 transition">
                    <option value="ALL">All Levels</option>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-ink-800 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white/70 focus:outline-none focus:border-brand-500/40 transition">
                    <option value="ALL">All Status</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
                <div className="hidden sm:grid grid-cols-12 px-6 py-2.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest border-b border-white/4">
                    <span className="col-span-4">Course</span>
                    <span className="col-span-2">Category</span>
                    <span className="col-span-1">Level</span>
                    <span className="col-span-1">Price</span>
                    <span className="col-span-1 text-center">Lessons</span>
                    <span className="col-span-1 text-center">Students</span>
                    <span className="col-span-2 text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="p-6 space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-14 rounded-lg bg-ink-700/40 animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <GraduationCap size={32} className="mx-auto text-white/15 mb-3" />
                        <p className="text-sm text-white/35">{search ? "No courses match your search." : "No courses yet."}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/4">
                        {filtered.map((course) => (
                            <div key={course.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-ink-700/25 transition-colors gap-y-1">
                                {/* Title + status */}
                                <div className="col-span-12 sm:col-span-4 flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-ink-700 flex items-center justify-center shrink-0">
                                        <BookOpen size={14} className="text-white/35" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white/90 truncate">{course.title}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                                course.isPublished ? "bg-brand-500/10 text-brand-400" : "bg-white/5 text-white/30"
                                            }`}>
                                                {course.isPublished ? "LIVE" : "DRAFT"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <span className="col-span-4 sm:col-span-2 text-xs text-white/45 truncate">{course.category.name}</span>

                                <span className={`col-span-4 sm:col-span-1 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${LEVEL_COLOR[course.level]}`}>
                                    {course.level.slice(0, 3)}
                                </span>

                                <span className="hidden sm:block col-span-1 text-xs text-white/50">
                                    {course.price === 0 ? <span className="text-brand-400 font-semibold">Free</span> : `₹${course.price}`}
                                </span>

                                <span className="hidden sm:block col-span-1 text-center text-xs text-white/50">{course._count.lessons}</span>
                                <span className="hidden sm:block col-span-1 text-center text-xs text-white/50">{course._count.enrollments}</span>

                                <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1.5">
                                    <Link
                                        href={`/admin/courses/${course.id}`}
                                        className="p-1.5 rounded-lg text-white/35 hover:text-brand-400 hover:bg-brand-500/8 transition-colors"
                                        title="Manage"
                                    >
                                        <Settings2 size={14} />
                                    </Link>
                                    <button
                                        onClick={() => handleToggle(course.id)}
                                        disabled={togglingId === course.id}
                                        className="p-1.5 rounded-lg text-white/35 hover:text-brand-400 hover:bg-brand-500/8 transition-colors disabled:opacity-40"
                                        title={course.isPublished ? "Unpublish" : "Publish"}
                                    >
                                        {togglingId === course.id
                                            ? <Spinner small />
                                            : course.isPublished ? <EyeOff size={14} /> : <Eye size={14} />
                                        }
                                    </button>
                                    <button
                                        onClick={() => handleDelete(course.id, course.title)}
                                        disabled={deletingId === course.id}
                                        className="p-1.5 rounded-lg text-white/35 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40"
                                        title="Delete"
                                    >
                                        {deletingId === course.id ? <Spinner small /> : <Trash2 size={14} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.hasPreviousPage}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            pagination.hasPreviousPage
                                ? "border border-white/10 text-white/60 hover:border-brand-500/40 hover:text-brand-300 hover:bg-brand-500/5"
                                : "border border-white/5 text-white/20 cursor-not-allowed"
                        }`}
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
                                    currentPage === page
                                        ? "bg-brand-500 text-ink-950 font-semibold"
                                        : "border border-white/8 text-white/60 hover:border-brand-500/40 hover:text-brand-300 hover:bg-brand-500/5"
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            pagination.hasNextPage
                                ? "border border-white/10 text-white/60 hover:border-brand-500/40 hover:text-brand-300 hover:bg-brand-500/5"
                                : "border border-white/5 text-white/20 cursor-not-allowed"
                        }`}
                    >
                        Next
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

/* ── Shared micro-components ─────────────────── */
function Field({ label, required, className, children }: {
    label: string; required?: boolean; className?: string; children: React.ReactNode;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                {label}{required && <span className="text-brand-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

function Spinner({ small }: { small?: boolean }) {
    const s = small ? "w-3 h-3 border" : "w-3.5 h-3.5 border-2";
    return <span className={`${s} border-current border-t-transparent rounded-full animate-spin`} />;
}

const inputCls = "w-full bg-ink-900 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition";
const selectCls = `${inputCls}`;
const primaryBtn = "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors";
const ghostBtn = "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/55 text-sm hover:text-white/80 hover:bg-white/4 transition-colors";
