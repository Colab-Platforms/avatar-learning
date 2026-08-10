"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import {
  fetchD2HAssessmentCounsellingPaginated,
  type AdminD2HAssessmentCounsellingPurchase,
} from "@/lib/adminApi";
import type { PaginatedResponse } from "@/lib/coursesApi";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminAssessmentCounsellingPage() {
  const [purchases, setPurchases] = useState<
    AdminD2HAssessmentCounsellingPurchase[]
  >([]);
  const [pagination, setPagination] = useState<Omit<
    PaginatedResponse<AdminD2HAssessmentCounsellingPurchase>,
    "data"
  > | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchD2HAssessmentCounsellingPaginated(currentPage, 20);
      setPurchases(res.data);
      setPagination({
        currentPage: res.currentPage,
        pageSize: res.pageSize,
        totalRecords: res.totalRecords,
        totalPages: res.totalPages,
        hasNextPage: res.hasNextPage,
        hasPreviousPage: res.hasPreviousPage,
      });
    } catch {
      setError("Failed to load Assessment + Counselling purchases.");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Assessment + Counselling
        </h1>
        <p className="text-sm text-white/40 mt-0.5">
          Direct2Hire · ₹99 tier · {pagination?.totalRecords ?? 0} purchases
        </p>
      </div>

      {error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 px-6 py-2.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest border-b border-white/4">
          <span className="col-span-4">Student</span>
          <span className="col-span-2">Phone</span>
          <span className="col-span-2">Purchased</span>
          <span className="col-span-2">Programme Status</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-ink-700/40 animate-pulse"
              />
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} className="mx-auto text-white/15 mb-3" />
            <p className="text-sm text-white/35">No purchases yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/4">
            {purchases.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-12 items-center px-6 py-4 hover:bg-ink-700/25 transition-colors gap-y-1"
              >
                <div className="col-span-12 sm:col-span-4 min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate">
                    {`${p.user.firstName ?? ""} ${p.user.lastName ?? ""}`.trim() ||
                      "Unnamed"}
                  </p>
                  <p className="text-[11px] text-white/35 truncate">
                    {p.user.email}
                  </p>
                </div>
                <span className="hidden sm:block col-span-2 text-xs text-white/45">
                  {p.user.phoneNo ?? "—"}
                </span>
                <span className="hidden sm:block col-span-2 text-xs text-white/45">
                  {formatDate(p.assessmentCounsellingPaidAt)}
                </span>
                <span
                  className={`col-span-6 sm:col-span-2 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                    p.status === "PAID"
                      ? "bg-brand-500/10 text-brand-400"
                      : "bg-white/5 text-white/30"
                  }`}
                >
                  {p.status === "PAID" ? "Upgraded to Full" : "₹99 Tier Only"}
                </span>
                <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/direct2hire/${p.user.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                               border border-white/10 text-white/70 hover:border-brand-500/40 hover:text-brand-300
                               transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => p - 1)}
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
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
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
