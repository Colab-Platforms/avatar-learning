"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Users, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import {
  fetchD2HEnrollmentsPaginated,
  markD2HPaid,
  markD2HRefunded,
  type AdminD2HEnrollment,
} from "@/lib/adminApi";
import type { PaginatedResponse } from "@/lib/coursesApi";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

export default function AdminDirect2HirePage() {
  const [enrollments, setEnrollments] = useState<AdminD2HEnrollment[]>([]);
  const [pagination, setPagination] = useState<Omit<
    PaginatedResponse<AdminD2HEnrollment>,
    "data"
  > | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [refundConfirmId, setRefundConfirmId] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchD2HEnrollmentsPaginated(currentPage, 20);
      setEnrollments(res.data);
      setPagination({
        currentPage: res.currentPage,
        pageSize: res.pageSize,
        totalRecords: res.totalRecords,
        totalPages: res.totalPages,
        hasNextPage: res.hasNextPage,
        hasPreviousPage: res.hasPreviousPage,
      });
    } catch {
      setError("Failed to load Direct2Hire enrollments.");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkPaid = async (id: string) => {
    setMarkingId(id);
    try {
      await markD2HPaid(id);
      await load();
    } catch {
      setError("Failed to mark enrollment as paid.");
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkRefunded = async (id: string) => {
    setMarkingId(id);
    try {
      await markD2HRefunded(id);
      await load();
      setRefundConfirmId(null);
      setRefundSuccess(true);
    } catch {
      setError("Failed to mark enrollment as refunded.");
      setRefundConfirmId(null);
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Enrollments</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Direct2Hire · {pagination?.totalRecords ?? 0} enrollments
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
          <span className="col-span-2">Status</span>
          <span className="col-span-4 text-right">Actions</span>
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
        ) : enrollments.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} className="mx-auto text-white/15 mb-3" />
            <p className="text-sm text-white/35">No enrollments yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/4">
            {enrollments.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-12 items-center px-6 py-4 hover:bg-ink-700/25 transition-colors gap-y-1"
              >
                <div className="col-span-12 sm:col-span-4 min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate">
                    {`${e.user.firstName ?? ""} ${e.user.lastName ?? ""}`.trim() ||
                      "Unnamed"}
                  </p>
                  <p className="text-[11px] text-white/35 truncate">
                    {e.user.email}
                  </p>
                </div>
                <span className="hidden sm:block col-span-2 text-xs text-white/45">
                  {e.user.phoneNo ?? "—"}
                </span>
                <span
                  className={`col-span-4 sm:col-span-2 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                    e.status === "PAID"
                      ? "bg-brand-500/10 text-brand-400"
                      : e.status === "REFUNDED"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-white/5 text-white/30"
                  }`}
                >
                  {e.status}
                </span>
                <div className="col-span-8 sm:col-span-4 flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/direct2hire/${e.user.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                               border border-white/10 text-white/70 hover:border-brand-500/40 hover:text-brand-300
                               transition-colors"
                  >
                    View Profile
                  </Link>
                  {/* <button
                    onClick={() => handleMarkPaid(e.id)}
                    disabled={e.status !== "PENDING" || markingId === e.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                               bg-brand-500 text-ink-950 hover:bg-brand-400 transition-colors
                               disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {markingId === e.id ? (
                      <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    ) : e.status === "PENDING" ? (
                      "Mark Paid"
                    ) : (
                      e.status.charAt(0) + e.status.slice(1).toLowerCase()
                    )}
                  </button> */}
                  {e.status === "PAID" && (
                    <button
                      onClick={() => setRefundConfirmId(e.id)}
                      disabled={markingId === e.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                 border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors
                                 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {markingId === e.id ? (
                        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Mark Refunded"
                      )}
                    </button>
                  )}
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

      <ConfirmationDialog
        isOpen={!!refundConfirmId}
        onClose={() => setRefundConfirmId(null)}
        onConfirm={async () => {
          if (refundConfirmId) await handleMarkRefunded(refundConfirmId);
        }}
        title="Mark as Refunded"
        message="This will mark the enrollment as refunded. This action cannot be undone."
        confirmText="Mark Refunded"
        variant="danger"
        isLoading={markingId === refundConfirmId}
      />

      {refundSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setRefundSuccess(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.15)] z-10 flex flex-col items-center text-center">
            <div className="mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 border border-brand-200 text-brand-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-[17px] font-semibold text-text tracking-tight mb-2 px-1">
              Enrollment Refunded
            </h3>
            <p className="text-[13px] text-text-muted leading-relaxed mb-6 px-2">
              Enrollment has been marked as refunded successfully.
            </p>
            <button
              type="button"
              onClick={() => setRefundSuccess(false)}
              className="w-full inline-flex items-center justify-center rounded-xl bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 text-[13px] font-semibold transition-all duration-150 active:scale-[0.98] select-none cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
