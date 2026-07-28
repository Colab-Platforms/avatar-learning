"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Tag, Eye, EyeOff, Trash2, Pencil, Users, Calendar } from "lucide-react";
import {
    fetchCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    type Coupon,
} from "@/lib/adminApi";

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ code: "", discountPercent: 50, expiresAt: "" });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ discountPercent: 0, expiresAt: "" });
    const [editSaving, setEditSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setCoupons(await fetchCoupons());
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
            await createCoupon({
                code: form.code,
                discountPercent: form.discountPercent,
                expiresAt: form.expiresAt || null,
            });
            setForm({ code: "", discountPercent: 50, expiresAt: "" });
            setShowForm(false);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to create coupon");
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (coupon: Coupon) => {
        setTogglingId(coupon.id);
        try {
            await updateCoupon(coupon.id, { isActive: !coupon.isActive });
            await load();
        } catch {
            setError("Failed to toggle coupon");
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`Delete coupon "${code}"?`)) return;
        setDeletingId(id);
        try {
            await deleteCoupon(id);
            await load();
        } catch {
            setError("Failed to delete coupon");
        } finally {
            setDeletingId(null);
        }
    };

    const startEdit = (coupon: Coupon) => {
        setEditingId(coupon.id);
        setEditForm({
            discountPercent: coupon.discountPercent,
            expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
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
            await updateCoupon(id, {
                discountPercent: editForm.discountPercent,
                expiresAt: editForm.expiresAt || null,
            });
            setEditingId(null);
            await load();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to update coupon");
        } finally {
            setEditSaving(false);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Coupons</h1>
                    <p className="text-sm text-white/40 mt-0.5">{coupons.length} total</p>
                </div>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors"
                >
                    <Plus size={15} />
                    New Coupon
                </button>
            </div>

            {error && (
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            {showForm && (
                <div className="bg-ink-800 border border-brand-500/20 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-5">New Coupon</h2>
                    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Code" required>
                            <input
                                value={form.code}
                                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                                placeholder="D2H50"
                                className={inputCls}
                                required
                            />
                        </Field>
                        <Field label="Discount %" required>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={form.discountPercent}
                                onChange={(e) => setForm((f) => ({ ...f, discountPercent: Number(e.target.value) }))}
                                className={inputCls}
                                required
                            />
                        </Field>
                        <Field label="Expires (optional)">
                            <DateField
                                value={form.expiresAt}
                                onChange={(v) => setForm((f) => ({ ...f, expiresAt: v }))}
                            />
                        </Field>
                        {error && <p className="sm:col-span-3 text-red-400 text-xs">{error}</p>}
                        <div className="sm:col-span-3 flex gap-3">
                            <button type="submit" disabled={saving} className={`${primaryBtn} disabled:opacity-50`}>
                                {saving && <Spinner />}
                                {saving ? "Creating…" : "Create Coupon"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className={ghostBtn}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
                <div className="hidden sm:grid grid-cols-12 px-6 py-2.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest border-b border-white/4">
                    <span className="col-span-3">Code</span>
                    <span className="col-span-2">Discount</span>
                    <span className="col-span-1 text-center">Used</span>
                    <span className="col-span-2">Expires</span>
                    <span className="col-span-1">Status</span>
                    <span className="col-span-3 text-right">Actions</span>
                </div>

                {loading ? (
                    <div className="p-6 space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-14 rounded-lg bg-ink-700/40 animate-pulse" />
                        ))}
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="py-16 text-center">
                        <Tag size={32} className="mx-auto text-white/15 mb-3" />
                        <p className="text-sm text-white/35">No coupons yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/4">
                        {coupons.map((coupon) => (
                            <div key={coupon.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-ink-700/25 transition-colors gap-y-1">
                                <Link
                                    href={`/admin/coupons/${coupon.id}`}
                                    className="col-span-12 sm:col-span-3 flex items-center gap-3 min-w-0"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-ink-700 flex items-center justify-center shrink-0">
                                        <Tag size={14} className="text-white/35" />
                                    </div>
                                    <p className="text-sm font-semibold text-white/90 truncate hover:text-brand-400 transition-colors">
                                        {coupon.code}
                                    </p>
                                </Link>

                                {editingId === coupon.id ? (
                                    <>
                                        <div className="col-span-6 sm:col-span-2">
                                            <input
                                                type="number"
                                                min={1}
                                                max={100}
                                                value={editForm.discountPercent}
                                                onChange={(e) => setEditForm((f) => ({ ...f, discountPercent: Number(e.target.value) }))}
                                                className={`${inputCls} py-1.5 text-xs`}
                                            />
                                        </div>
                                        <span className="hidden sm:block col-span-1 text-center text-xs text-white/50">
                                            {coupon.usedCount}
                                        </span>
                                        <div className="col-span-6 sm:col-span-2">
                                            <DateField
                                                value={editForm.expiresAt}
                                                onChange={(v) => setEditForm((f) => ({ ...f, expiresAt: v }))}
                                                className={`${inputCls} py-1.5 text-xs`}
                                            />
                                        </div>
                                        <span className="hidden sm:block col-span-1" />
                                        <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2 mt-2 sm:mt-0">
                                            <button
                                                onClick={() => saveEdit(coupon.id)}
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
                                        <span className="col-span-4 sm:col-span-2 text-xs text-white/50">
                                            {coupon.discountPercent}% off
                                        </span>

                                        <span className="hidden sm:block col-span-1 text-center text-xs text-white/50">
                                            {coupon.usedCount}
                                        </span>

                                        <span className="hidden sm:block col-span-2 text-xs text-white/45">
                                            {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("en-IN") : "Never"}
                                        </span>

                                        <span className={`hidden sm:inline-flex col-span-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit ${
                                            coupon.isActive ? "bg-brand-500/10 text-brand-400" : "bg-white/5 text-white/30"
                                        }`}>
                                            {coupon.isActive ? "ACTIVE" : "OFF"}
                                        </span>

                                        <div className="col-span-8 sm:col-span-3 flex items-center justify-end gap-1.5">
                                            <Link
                                                href={`/admin/coupons/${coupon.id}`}
                                                className="p-1.5 rounded-lg text-white/35 hover:text-brand-400 hover:bg-brand-500/8 transition-colors"
                                                title="View users who used this coupon"
                                            >
                                                <Users size={14} />
                                            </Link>
                                            <button
                                                onClick={() => startEdit(coupon)}
                                                className="p-1.5 rounded-lg text-white/35 hover:text-brand-400 hover:bg-brand-500/8 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleToggle(coupon)}
                                                disabled={togglingId === coupon.id}
                                                className="p-1.5 rounded-lg text-white/35 hover:text-brand-400 hover:bg-brand-500/8 transition-colors disabled:opacity-40"
                                                title={coupon.isActive ? "Disable" : "Enable"}
                                            >
                                                {togglingId === coupon.id
                                                    ? <Spinner small />
                                                    : coupon.isActive ? <EyeOff size={14} /> : <Eye size={14} />
                                                }
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon.id, coupon.code)}
                                                disabled={deletingId === coupon.id}
                                                className="p-1.5 rounded-lg text-white/35 hover:text-red-400 hover:bg-red-500/8 transition-colors disabled:opacity-40"
                                                title="Delete"
                                            >
                                                {deletingId === coupon.id ? <Spinner small /> : <Trash2 size={14} />}
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

function DateField({
    value,
    onChange,
    className,
}: {
    value: string;
    onChange: (v: string) => void;
    className?: string;
}) {
    const ref = useRef<HTMLInputElement>(null);

    const openPicker = () => {
        const el = ref.current;
        if (!el) return;
        if (typeof el.showPicker === "function") el.showPicker();
        else el.focus();
    };

    return (
        <div className="relative">
            <input
                ref={ref}
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${className ?? inputCls} pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0`}
            />
            <button
                type="button"
                onClick={openPicker}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-brand-400 transition-colors"
                title="Pick a date"
            >
                <Calendar size={15} />
            </button>
        </div>
    );
}

function Spinner({ small }: { small?: boolean }) {
    const s = small ? "w-3 h-3 border" : "w-3.5 h-3.5 border-2";
    return <span className={`${s} border-current border-t-transparent rounded-full animate-spin`} />;
}

const inputCls = "w-full bg-ink-900 border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition";
const primaryBtn = "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors";
const ghostBtn = "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/55 text-sm hover:text-white/80 hover:bg-white/4 transition-colors";
