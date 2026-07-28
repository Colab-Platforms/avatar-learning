"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag, Users, Mail, Phone } from "lucide-react";
import {
    fetchCoupon,
    fetchCouponRedemptions,
    type Coupon,
    type CouponRedemption,
} from "@/lib/adminApi";

export default function AdminCouponDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [coupon, setCoupon] = useState<Coupon | null>(null);
    const [redemptions, setRedemptions] = useState<CouponRedemption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [c, r] = await Promise.all([
                fetchCoupon(id),
                fetchCouponRedemptions(id),
            ]);
            setCoupon(c);
            setRedemptions(r);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to load coupon");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div className="h-8 w-40 rounded-lg bg-ink-700/40 animate-pulse" />
                <div className="h-24 rounded-2xl bg-ink-700/40 animate-pulse" />
                <div className="h-64 rounded-2xl bg-ink-700/40 animate-pulse" />
            </div>
        );
    }

    if (error || !coupon) {
        return (
            <div className="p-8 space-y-4">
                <button
                    onClick={() => router.push("/admin/coupons")}
                    className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80"
                >
                    <ArrowLeft size={14} />
                    Back to Coupons
                </button>
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                    {error || "Coupon not found"}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <Link
                href="/admin/coupons"
                className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80"
            >
                <ArrowLeft size={14} />
                Back to Coupons
            </Link>

            <div className="bg-ink-800 border border-white/6 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-ink-700 flex items-center justify-center shrink-0">
                        <Tag size={20} className="text-white/40" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-white">{coupon.code}</h1>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                coupon.isActive ? "bg-brand-500/10 text-brand-400" : "bg-white/5 text-white/30"
                            }`}>
                                {coupon.isActive ? "ACTIVE" : "OFF"}
                            </span>
                        </div>
                        <p className="text-sm text-white/40 mt-0.5">
                            {coupon.discountPercent}% off ·{" "}
                            {coupon.expiresAt
                                ? `expires ${new Date(coupon.expiresAt).toLocaleDateString("en-IN")}`
                                : "never expires"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink-900/60 border border-white/6">
                    <Users size={16} className="text-brand-400" />
                    <span className="text-lg font-bold text-white">{coupon.usedCount}</span>
                    <span className="text-xs text-white/40">enrolled with this code</span>
                </div>
            </div>

            <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/4">
                    <h2 className="text-sm font-semibold text-white">Users who used this coupon</h2>
                </div>

                <div className="hidden sm:grid grid-cols-12 px-6 py-2.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest border-b border-white/4">
                    <span className="col-span-3">Name</span>
                    <span className="col-span-3">Contact</span>
                    <span className="col-span-2">Product</span>
                    <span className="col-span-2">Amount Paid</span>
                    <span className="col-span-2">Date</span>
                </div>

                {redemptions.length === 0 ? (
                    <div className="py-16 text-center">
                        <Users size={32} className="mx-auto text-white/15 mb-3" />
                        <p className="text-sm text-white/35">No one has enrolled with this coupon yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/4">
                        {redemptions.map((r) => (
                            <div key={r.orderId} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-ink-700/25 transition-colors gap-y-1.5">
                                <span className="col-span-12 sm:col-span-3 text-sm font-medium text-white/85 truncate">
                                    {r.userName || "—"}
                                </span>
                                <div className="col-span-12 sm:col-span-3 flex flex-col gap-0.5 min-w-0">
                                    {r.email && (
                                        <span className="flex items-center gap-1.5 text-xs text-white/45 truncate">
                                            <Mail size={11} className="shrink-0" />
                                            {r.email}
                                        </span>
                                    )}
                                    {r.phoneNo && (
                                        <span className="flex items-center gap-1.5 text-xs text-white/45 truncate">
                                            <Phone size={11} className="shrink-0" />
                                            {r.phoneNo}
                                        </span>
                                    )}
                                </div>
                                <span className="col-span-6 sm:col-span-2 text-xs text-white/50">
                                    {r.productType === "DIRECT2HIRE" ? "Direct2Hire" : "Course"}
                                </span>
                                <span className="col-span-6 sm:col-span-2 text-xs text-white/70">
                                    ₹{(r.amountPaid / 100).toLocaleString("en-IN")}
                                    {r.discountAmount > 0 && (
                                        <span className="text-brand-400"> (-₹{(r.discountAmount / 100).toLocaleString("en-IN")})</span>
                                    )}
                                </span>
                                <span className="col-span-12 sm:col-span-2 text-xs text-white/35">
                                    {new Date(r.paidAt).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
