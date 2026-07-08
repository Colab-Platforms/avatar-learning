"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, FolderOpen, FileText, Trash2, Upload, Link as LinkIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
    fetchInvestorCategoriesAdmin,
    createInvestorCategory,
    deleteInvestorCategory,
    fetchInvestorDocumentsPaginated,
    createInvestorDocument,
    deleteInvestorDocument,
    uploadInvestorDocumentFile,
    type AdminInvestorCategory,
    type AdminInvestorDocument,
} from "@/lib/adminApi";
import type { PaginatedResponse } from "@/lib/coursesApi";

export default function AdminInvestorsPage() {
    const [categories, setCategories] = useState<AdminInvestorCategory[]>([]);
    const [documents, setDocuments] = useState<AdminInvestorDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [savingCategory, setSavingCategory] = useState(false);
    const [categoryForm, setCategoryForm] = useState({ name: "", slug: "" });

    const [showDocForm, setShowDocForm] = useState(false);
    const [savingDoc, setSavingDoc] = useState(false);
    const [docMode, setDocMode] = useState<"url" | "upload">("url");
    const [docForm, setDocForm] = useState({ categoryId: "", name: "", url: "" });
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
    const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<Omit<PaginatedResponse<AdminInvestorDocument>, "data"> | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [cats, docsRes] = await Promise.all([
                fetchInvestorCategoriesAdmin(),
                fetchInvestorDocumentsPaginated(
                    filterCategory === "ALL" ? undefined : filterCategory,
                    currentPage,
                    10
                ),
            ]);
            setCategories(cats);
            setDocuments(docsRes.data);
            setPagination({
                currentPage: docsRes.currentPage,
                pageSize: docsRes.pageSize,
                totalRecords: docsRes.totalRecords,
                totalPages: docsRes.totalPages,
                hasNextPage: docsRes.hasNextPage,
                hasPreviousPage: docsRes.hasPreviousPage,
            });
        } finally {
            setLoading(false);
        }
    }, [filterCategory, currentPage]);

    useEffect(() => { load(); }, [load]);

    const handleFilterChange = (categoryId: string) => {
        setFilterCategory(categoryId);
        setCurrentPage(1);
    };

    const slugify = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const handleCategoryNameChange = (name: string) =>
        setCategoryForm((f) => ({ ...f, name, slug: slugify(name) }));

    const submitCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingCategory(true);
        setError("");
        try {
            await createInvestorCategory(categoryForm);
            setCategoryForm({ name: "", slug: "" });
            setShowCategoryForm(false);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to create category");
        } finally {
            setSavingCategory(false);
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}" and all its documents?`)) return;
        setDeletingCategoryId(id);
        try { await deleteInvestorCategory(id); await load(); }
        catch { setError("Failed to delete category"); }
        finally { setDeletingCategoryId(null); }
    };

    const submitDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!docForm.categoryId) { setError("Select a category"); return; }
        if (docMode === "upload" && !uploadFile) { setError("Choose a PDF to upload"); return; }
        if (docMode === "url" && !docForm.url.trim()) { setError("Enter a document URL"); return; }

        setSavingDoc(true);
        try {
            let url = docForm.url.trim();
            if (docMode === "upload" && uploadFile) {
                setUploading(true);
                url = await uploadInvestorDocumentFile(uploadFile);
                setUploading(false);
            }
            await createInvestorDocument({ categoryId: docForm.categoryId, name: docForm.name, url });
            setDocForm({ categoryId: "", name: "", url: "" });
            setUploadFile(null);
            setShowDocForm(false);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to create document");
        } finally {
            setSavingDoc(false);
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"?`)) return;
        setDeletingDocId(id);
        try { await deleteInvestorDocument(id); await load(); }
        catch { setError("Failed to delete document"); }
        finally { setDeletingDocId(null); }
    };

    return (
        <div className="p-8 space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Investor Relations</h1>
                <p className="text-sm text-white/40 mt-0.5">
                    Manage the categories and documents shown on the public investors page.
                </p>
            </div>

            {error && (
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* ── Categories ─────────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white/80">Categories</h2>
                    <button
                        onClick={() => setShowCategoryForm((v) => !v)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors"
                    >
                        <Plus size={15} />
                        New Category
                    </button>
                </div>

                {showCategoryForm && (
                    <div className="bg-ink-800 border border-brand-500/20 rounded-2xl p-6">
                        <form onSubmit={submitCategory} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Name" required>
                                <input
                                    value={categoryForm.name}
                                    onChange={(e) => handleCategoryNameChange(e.target.value)}
                                    placeholder="e.g. Annual Report"
                                    className={inputCls}
                                    required
                                />
                            </Field>
                            <Field label="Slug" required>
                                <input
                                    value={categoryForm.slug}
                                    onChange={(e) => setCategoryForm((f) => ({ ...f, slug: e.target.value }))}
                                    placeholder="annual-report"
                                    className={inputCls}
                                    required
                                />
                            </Field>
                            <div className="sm:col-span-2 flex gap-3">
                                <button type="submit" disabled={savingCategory} className={`${primaryBtn} disabled:opacity-50`}>
                                    {savingCategory ? "Creating…" : "Create Category"}
                                </button>
                                <button type="button" onClick={() => setShowCategoryForm(false)} className={ghostBtn}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="h-12 rounded-lg bg-ink-700/40 animate-pulse" />
                            ))}
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="py-12 text-center">
                            <FolderOpen size={28} className="mx-auto text-white/15 mb-3" />
                            <p className="text-sm text-white/35">No categories yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/4">
                            {categories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-ink-700/30 transition-colors">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                                            <FolderOpen size={13} className="text-brand-400" />
                                        </div>
                                        <span className="text-sm font-medium text-white/85 truncate">{cat.name}</span>
                                        <span className="text-xs text-white/30 font-mono truncate">/{cat.slug}</span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/6 text-white/40 shrink-0">
                                            {cat._count.documents} docs
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                        disabled={deletingCategoryId === cat.id}
                                        className="p-1.5 rounded-lg text-white/35 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-50 shrink-0"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Documents ─────────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white/80">Documents</h2>
                    <button
                        onClick={() => setShowDocForm((v) => !v)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors"
                    >
                        <Plus size={15} />
                        New Document
                    </button>
                </div>

                {showDocForm && (
                    <div className="bg-ink-800 border border-brand-500/20 rounded-2xl p-6">
                        <form onSubmit={submitDocument} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Category" required>
                                <select
                                    value={docForm.categoryId}
                                    onChange={(e) => setDocForm((f) => ({ ...f, categoryId: e.target.value }))}
                                    className={selectCls}
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Document Name" required>
                                <input
                                    value={docForm.name}
                                    onChange={(e) => setDocForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. FY 2024-25"
                                    className={inputCls}
                                    required
                                />
                            </Field>

                            <div className="sm:col-span-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDocMode("url")}
                                    className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${docMode === "url" ? "border-brand-500/40 bg-brand-500/10 text-brand-400" : "border-white/8 text-white/45"}`}
                                >
                                    <LinkIcon size={13} /> Paste URL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDocMode("upload")}
                                    className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${docMode === "upload" ? "border-brand-500/40 bg-brand-500/10 text-brand-400" : "border-white/8 text-white/45"}`}
                                >
                                    <Upload size={13} /> Upload PDF
                                </button>
                            </div>

                            {docMode === "url" ? (
                                <Field label="Document URL" required className="sm:col-span-2">
                                    <input
                                        value={docForm.url}
                                        onChange={(e) => setDocForm((f) => ({ ...f, url: e.target.value }))}
                                        placeholder="https://…/document.pdf"
                                        className={inputCls}
                                        required
                                    />
                                </Field>
                            ) : (
                                <Field label="PDF File" required className="sm:col-span-2">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                                        className={inputCls}
                                    />
                                </Field>
                            )}

                            <div className="sm:col-span-2 flex gap-3">
                                <button type="submit" disabled={savingDoc} className={`${primaryBtn} disabled:opacity-50`}>
                                    {uploading ? "Uploading…" : savingDoc ? "Saving…" : "Add Document"}
                                </button>
                                <button type="button" onClick={() => setShowDocForm(false)} className={ghostBtn}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <select
                    value={filterCategory}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className={selectCls + " w-full sm:w-64"}
                >
                    <option value="ALL">All Categories</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <div className="border border-white/5 rounded-2xl overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-white/3 border-b border-white/5">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Link</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={4} className="px-4 py-6 text-center text-white/40">Loading...</td></tr>
                            ) : documents.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-6 text-center text-white/40">No documents found</td></tr>
                            ) : (
                                documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-white/2 transition-colors">
                                        <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                                            <FileText size={13} className="text-white/30 shrink-0" />
                                            {doc.name}
                                        </td>
                                        <td className="px-4 py-3 text-white/60">{doc.category.name}</td>
                                        <td className="px-4 py-3">
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-brand-400 hover:underline text-xs truncate max-w-60 inline-block align-middle"
                                            >
                                                {doc.url}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDeleteDocument(doc.id, doc.name)}
                                                disabled={deletingDocId === doc.id}
                                                className="p-1.5 rounded-lg text-white/35 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-50"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => p - 1)}
                            disabled={!pagination.hasPreviousPage}
                            className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white disabled:opacity-50"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
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
                            onClick={() => setCurrentPage((p) => p + 1)}
                            disabled={!pagination.hasNextPage}
                            className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white disabled:opacity-50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </section>
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
                {label}{required && <span className="text-brand-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputCls =
    "w-full bg-ink-900 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition";

const selectCls = inputCls + " cursor-pointer";

const primaryBtn =
    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors";

const ghostBtn =
    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/55 text-sm hover:text-white/80 hover:bg-white/4 transition-colors";
