"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Eye, EyeOff, Trash2, Briefcase, ChevronLeft, ChevronRight, Settings2, Users } from "lucide-react";
import Link from "next/link";
import {
    fetchAdminInternships,
    fetchAdminInternshipsPaginated,
    fetchCategories,
    createInternship,
    deleteInternship,
    toggleInternshipPublish,
} from "@/lib/adminApi";
import type { PaginatedResponse } from "@/lib/internshipsApi";

interface Category { id: string; name: string; slug: string; }
interface Internship {
    id: string;
    title: string;
    slug: string;
    company: string;
    employmentType: "FULL_TIME" | "PART_TIME" | "REMOTE";
    stipend?: string;
    isPublished: boolean;
    category: { id: string; name: string };
    _count: { applications: number };
}

const EMPLOYMENT_COLOR: Record<string, string> = {
    FULL_TIME: "text-emerald-400 bg-emerald-400/10",
    PART_TIME: "text-amber-400 bg-amber-400/10",
    REMOTE: "text-blue-400 bg-blue-400/10",
};

export default function AdminInternshipsPage() {
    const [internships, setInternships] = useState<Internship[]>([]);
    const [allInternshipsCount, setAllInternshipsCount] = useState(0);
    const [pagination, setPagination] = useState<Omit<PaginatedResponse<Internship>, 'data'> | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filterEmployment, setFilterEmployment] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [form, setForm] = useState({
        categoryId: "", title: "", company: "", description: "",
        employmentType: "FULL_TIME" as Internship["employmentType"], stipend: "", location: "", deadline: "", domain: "",
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [res, cats] = await Promise.all([
                fetchAdminInternshipsPaginated(currentPage, 10),
                fetchCategories(),
            ]);
            setInternships(res.data);
            setAllInternshipsCount(res.totalRecords);
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

    const filtered = internships.filter((i) => {
        const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) ||
            i.company.toLowerCase().includes(search.toLowerCase());
        const matchEmployment = filterEmployment === "ALL" || i.employmentType === filterEmployment;
        const matchStatus = filterStatus === "ALL" ||
            (filterStatus === "PUBLISHED" ? i.isPublished : !i.isPublished);
        return matchSearch && matchEmployment && matchStatus;
    });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await createInternship({
                categoryId: form.categoryId,
                title: form.title,
                company: form.company,
                description: form.description,
                employmentType: form.employmentType,
                stipend: form.stipend,
                location: form.location,
                deadline: form.deadline,
                domain: form.domain,
            });
            setForm({
                categoryId: "", title: "", company: "", description: "",
                employmentType: "FULL_TIME", stipend: "", location: "", deadline: "", domain: "",
            });
            setShowForm(false);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to create internship");
        } finally { setSaving(false); }
    };

    const handleToggle = async (id: string) => {
        setTogglingId(id);
        try { await toggleInternshipPublish(id); await load(); }
        catch { setError("Failed to toggle publish state"); }
        finally { setTogglingId(null); }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}" internship?`)) return;
        setDeletingId(id);
        try { await deleteInternship(id); await load(); }
        catch { setError("Failed to delete internship"); }
        finally { setDeletingId(null); }
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Internships</h1>
                    <p className="text-sm text-white/40 mt-0.5">
                        {allInternshipsCount} total · {internships.filter(i => i.isPublished).length} published
                    </p>
                </div>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors"
                >
                    <Plus size={15} />
                    New Internship
                </button>
            </div>

            {error && (
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            {/* Create Form */}
            {showForm && (
                <div className="bg-ink-800 border border-brand-500/20 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-5">New Internship</h2>
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
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                className={inputCls}
                                placeholder="Internship title"
                                required
                            />
                        </Field>
                        <Field label="Company" required>
                            <input
                                type="text"
                                value={form.company}
                                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                                className={inputCls}
                                placeholder="Company name"
                                required
                            />
                        </Field>
                        <Field label="Employment Type" required>
                            <select
                                value={form.employmentType}
                                onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value as any }))}
                                className={selectCls}
                                required
                            >
                                <option value="FULL_TIME">Full Time</option>
                                <option value="PART_TIME">Part Time</option>
                                <option value="REMOTE">Remote</option>
                            </select>
                        </Field>
                        <Field label="Location">
                            <input
                                type="text"
                                value={form.location}
                                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                                className={inputCls}
                                placeholder="Location"
                            />
                        </Field>
                        <Field label="Stipend">
                            <input
                                type="text"
                                value={form.stipend}
                                onChange={(e) => setForm((f) => ({ ...f, stipend: e.target.value }))}
                                className={inputCls}
                                placeholder="e.g., ₹10,000/month"
                            />
                        </Field>
                        <Field label="Domain">
                            <input
                                type="text"
                                value={form.domain}
                                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                                className={inputCls}
                                placeholder="Domain"
                            />
                        </Field>
                        <Field label="Deadline">
                            <input
                                type="date"
                                value={form.deadline}
                                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Description" span>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                className={inputCls}
                                placeholder="Description"
                                rows={3}
                            />
                        </Field>
                        <div className="col-span-full flex gap-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 rounded-lg bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 disabled:opacity-50"
                            >
                                {saving ? "Creating..." : "Create Internship"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-semibold hover:bg-white/5"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
                    <input
                        type="text"
                        placeholder="Search internships..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={inputCls + " pl-10"}
                    />
                </div>
                <select
                    value={filterEmployment}
                    onChange={(e) => setFilterEmployment(e.target.value)}
                    className={selectCls}
                >
                    <option value="ALL">All Types</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="REMOTE">Remote</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={selectCls}
                >
                    <option value="ALL">All Status</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                </select>
            </div>

            {/* Table */}
            <div className="border border-white/5 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-white/3 border-b border-white/5">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Title</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Company</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Applications</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-white/40">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-white/40">No internships found</td></tr>
                        ) : (
                            filtered.map((i) => (
                                <tr key={i.id} className="hover:bg-white/2 transition-colors">
                                    <td className="px-4 py-3 text-white font-medium">{i.title}</td>
                                    <td className="px-4 py-3 text-white/60">{i.company}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${EMPLOYMENT_COLOR[i.employmentType]}`}>
                                            {i.employmentType.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-white/60">{i.category.name}</td>
                                    <td className="px-4 py-3 text-white/60">{i._count.applications}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <Link
                                                href={`/admin/internships/${i.id}`}
                                                className="p-1.5 rounded-lg text-white/35 hover:text-brand-400 hover:bg-brand-500/8 transition-colors"
                                                title="Manage"
                                            >
                                                <Settings2 size={14} />
                                            </Link>
                                            <Link
                                                href={`/admin/internships/${i.id}/applicants`}
                                                className="p-1.5 rounded-lg text-white/35 hover:text-brand-400 hover:bg-brand-500/8 transition-colors"
                                                title="View Applicants"
                                            >
                                                <Users size={14} />
                                            </Link>
                                            <button
                                                onClick={() => handleToggle(i.id)}
                                                disabled={togglingId === i.id}
                                                className="p-1.5 rounded-lg text-white/35 hover:text-brand-400 hover:bg-brand-500/8 transition-colors disabled:opacity-50"
                                                title={i.isPublished ? "Unpublish" : "Publish"}
                                            >
                                                {i.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(i.id, i.title)}
                                                disabled={deletingId === i.id}
                                                className="p-1.5 rounded-lg text-white/35 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-50"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.hasPreviousPage}
                        className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white disabled:opacity-50"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`h-8 w-8 rounded-lg font-semibold transition-colors ${
                                currentPage === page
                                    ? "bg-brand-500 text-ink-950"
                                    : "border border-white/10 text-white/60 hover:text-white"
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white disabled:opacity-50"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

function Field({
    label,
    required,
    span,
    children,
}: {
    label: string;
    required?: boolean;
    span?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className={span ? "col-span-full" : ""}>
            <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputCls = "w-full bg-ink-900 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition";
const selectCls = inputCls + " cursor-pointer";
