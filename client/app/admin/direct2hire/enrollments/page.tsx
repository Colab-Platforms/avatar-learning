"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Users, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  fetchD2HEnrollmentsPaginated,
  type AdminD2HUserRow,
} from "@/lib/adminApi";
import type { PaginatedResponse } from "@/lib/coursesApi";

export default function AdminDirect2HirePage() {
  const [rows, setRows] = useState<AdminD2HUserRow[]>([]);
  const [pagination, setPagination] = useState<Omit<
    PaginatedResponse<AdminD2HUserRow>,
    "data"
  > | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search box value updates every keystroke; debouncedSearch only catches up
  // 400ms after typing stops, so `load` (and the API call it makes) doesn't
  // fire on every keystroke — see explanation below.
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Jump back to page 1 whenever the effective search term changes, so a
  // stale currentPage (e.g. page 4) doesn't request an out-of-range page
  // against the new, smaller filtered result set.
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchD2HEnrollmentsPaginated(
        currentPage,
        20,
        debouncedSearch || undefined,
      );
      setRows(res.data);
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
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Enrollments</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Direct2Hire · {pagination?.totalRecords ?? 0} students
        </p>
      </div>

      {error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="relative max-w-sm">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
        />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="w-full rounded-xl border border-white/10 bg-ink-800 pl-10 pr-4 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40"
        />
      </div>

      <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 px-6 py-2.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest border-b border-white/4">
          <span className="col-span-4">Student</span>
          <span className="col-span-4">Courses</span>
          <span className="col-span-2">Total Paid</span>
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
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} className="mx-auto text-white/15 mb-3" />
            <p className="text-sm text-white/35">
              {debouncedSearch
                ? `No students match "${debouncedSearch}".`
                : "No enrollments yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/4">
            {rows.map((row) => (
              <div
                key={row.user.id}
                className="grid grid-cols-12 items-center px-6 py-4 hover:bg-ink-700/25 transition-colors gap-y-2"
              >
                <div className="col-span-12 sm:col-span-4 min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate">
                    {`${row.user.firstName ?? ""} ${row.user.lastName ?? ""}`.trim() ||
                      "Unnamed"}
                  </p>
                  <p className="text-[11px] text-white/35 truncate">
                    {row.user.email}
                  </p>
                </div>
                <div className="col-span-12 sm:col-span-4 flex flex-wrap gap-1.5">
                  {row.courses.map((c) => (
                    <span
                      key={c.enrollmentId}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${
                        c.status === "PAID"
                          ? "bg-brand-500/10 text-brand-400"
                          : c.status === "REFUNDED"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-white/5 text-white/30"
                      }`}
                      title={c.status}
                    >
                      {c.courseTitle}
                    </span>
                  ))}
                </div>
                <span className="col-span-8 sm:col-span-2 text-xs text-white/60 font-semibold">
                  ₹{(row.totalPaid / 100).toLocaleString("en-IN")}
                  <span className="block text-[10px] text-white/30 font-normal">
                    {row.courseCount} course{row.courseCount === 1 ? "" : "s"}
                  </span>
                </span>
                <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/direct2hire/enrollments/${row.user.id}`}
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
