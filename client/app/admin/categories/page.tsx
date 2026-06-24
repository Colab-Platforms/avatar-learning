"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, FolderOpen, Tag } from "lucide-react";
import { fetchCategories, createCategory } from "@/lib/adminApi";

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ name: "", slug: "", description: "" });

    const load = useCallback(async () => {
        setLoading(true);
        try { setCategories(await fetchCategories()); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const slugify = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const handleNameChange = (name: string) =>
        setForm((f) => ({ ...f, name, slug: slugify(name) }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await createCategory(form);
            setForm({ name: "", slug: "", description: "" });
            setShowForm(false);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to create category");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Categories</h1>
                    <p className="text-sm text-white/40 mt-0.5">Organise courses into groups.</p>
                </div>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors"
                >
                    <Plus size={15} />
                    New Category
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="bg-ink-800 border border-brand-500/20 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-5">New Category</h2>
                    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Name" required>
                            <input
                                value={form.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="e.g. Web Development"
                                className={inputCls}
                                required
                            />
                        </Field>
                        <Field label="Slug" required>
                            <input
                                value={form.slug}
                                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                                placeholder="web-development"
                                className={inputCls}
                                required
                            />
                        </Field>
                        <Field label="Description" className="sm:col-span-2">
                            <input
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                placeholder="Short description (optional)"
                                className={inputCls}
                            />
                        </Field>
                        {error && <p className="sm:col-span-2 text-red-400 text-xs">{error}</p>}
                        <div className="sm:col-span-2 flex gap-3">
                            <button type="submit" disabled={saving} className={`${primaryBtn} disabled:opacity-50`}>
                                {saving ? <Spinner /> : null}
                                {saving ? "Creating…" : "Create Category"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className={ghostBtn}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                    <Tag size={14} className="text-white/35" />
                    <span className="text-sm font-semibold text-white">
                        All Categories
                        <span className="ml-2 text-white/30 font-normal text-xs">({categories.length})</span>
                    </span>
                </div>

                {loading ? (
                    <div className="p-6 space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-12 rounded-lg bg-ink-700/40 animate-pulse" />
                        ))}
                    </div>
                ) : categories.length === 0 ? (
                    <div className="py-16 text-center">
                        <FolderOpen size={32} className="mx-auto text-white/15 mb-3" />
                        <p className="text-sm text-white/35">No categories yet.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-12 px-6 py-2.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest border-b border-white/4">
                            <span className="col-span-4">Name</span>
                            <span className="col-span-4">Slug</span>
                            <span className="col-span-3">Description</span>
                            <span className="col-span-1 text-right">Status</span>
                        </div>
                        <div className="divide-y divide-white/4">
                            {categories.map((cat) => (
                                <div key={cat.id} className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-ink-700/30 transition-colors">
                                    <div className="col-span-4 flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                                            <FolderOpen size={13} className="text-brand-400" />
                                        </div>
                                        <span className="text-sm font-medium text-white/85 truncate">{cat.name}</span>
                                    </div>
                                    <span className="col-span-4 text-xs text-white/40 font-mono truncate">/{cat.slug}</span>
                                    <span className="col-span-3 text-xs text-white/35 truncate pr-4">
                                        {cat.description || "—"}
                                    </span>
                                    <div className="col-span-1 flex justify-end">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                            cat.isActive
                                                ? "bg-brand-500/10 text-brand-400"
                                                : "bg-white/6 text-white/30"
                                        }`}>
                                            {cat.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ── Shared micro-components ─────────────────── */

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

function Spinner() {
    return <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />;
}

const inputCls =
    "w-full bg-ink-900 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition";

const primaryBtn =
    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors";

const ghostBtn =
    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/55 text-sm hover:text-white/80 hover:bg-white/4 transition-colors";
