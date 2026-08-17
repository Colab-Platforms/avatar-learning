"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Video, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useAdminWebinarRegistrations } from "@/hooks/queries/useAdminWebinarRegistrations";
import type { WebinarRegistrationStatus } from "@/lib/adminApi";
import { useDebounce } from "@/hooks/useDebounce";

const STATUS_FILTERS: { label: string; value: WebinarRegistrationStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
];

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminWebinarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const urlSearch = searchParams.get("search")?.trim() ?? "";
  const urlStatus = (searchParams.get("status") as WebinarRegistrationStatus | null) ?? "ALL";

  const [search, setSearch] = useState(urlSearch);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError } = useAdminWebinarRegistrations(
    currentPage,
    20,
    urlSearch || undefined,
    urlStatus === "ALL" ? undefined : urlStatus,
  );

  const registrations = data?.data ?? [];
  const pagination = data
    ? {
        totalRecords: data.totalRecords,
        totalPages: data.totalPages,
        hasNextPage: data.hasNextPage,
        hasPreviousPage: data.hasPreviousPage,
      }
    : null;

  const updateParams = useCallback(
    (next: { page?: number; search?: string; status?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      const page = next.page ?? currentPage;
      if (page <= 1) params.delete("page");
      else params.set("page", String(page));

      const s = next.search !== undefined ? next.search : urlSearch;
      if (s) params.set("search", s);
      else params.delete("search");

      const st = next.status !== undefined ? next.status : urlStatus;
      if (st && st !== "ALL") params.set("status", st);
      else params.delete("status");

      const qs = params.toString();
      router.push(qs ? `/admin/webinar?${qs}` : "/admin/webinar");
    },
    [router, searchParams, currentPage, urlSearch, urlStatus],
  );

  // Sync debounced search into the URL, resetting to page 1
  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      updateParams({ page: 1, search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Webinar Registrations</h1>
        <p className="text-sm text-white/40 mt-0.5">
          AI Webinar &middot; {pagination?.totalRecords ?? 0} registrations
        </p>
      </div>

      {isError && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          Failed to load webinar registrations.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="w-full rounded-xl border border-white/10 bg-ink-800 pl-10 pr-4 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateParams({ page: 1, status: f.value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                urlStatus === f.value
                  ? "bg-brand-500/15 text-brand-300 border border-brand-500/30"
                  : "border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-ink-800 border border-white/6 rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 px-6 py-2.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest border-b border-white/4">
          <span className="col-span-4">Name</span>
          <span className="col-span-2">Phone</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2 text-right">Registered On</span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-ink-700/40 animate-pulse" />
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <div className="py-16 text-center">
            <Video size={32} className="mx-auto text-white/15 mb-3" />
            <p className="text-sm text-white/35">
              {urlSearch
                ? `No registrations match "${urlSearch}".`
                : "No webinar registrations yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/4">
            {registrations.map((r) => (
              <Link
                key={r.id}
                href={`/admin/webinar/${r.id}`}
                className="grid grid-cols-12 items-center px-6 py-4 hover:bg-ink-700/25 transition-colors gap-y-1"
              >
                <div className="col-span-12 sm:col-span-4 min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate">
                    {r.name}
                  </p>
                  <p className="text-[11px] text-white/35 truncate">{r.email}</p>
                </div>
                <span className="hidden sm:block col-span-2 text-xs text-white/45">
                  {r.phoneNumber}
                </span>
                <span className="hidden sm:block col-span-2 text-xs text-white/45">
                  {r.currency === "INR" ? "₹" : `${r.currency} `}
                  {(r.amount / 100).toLocaleString("en-IN")}
                </span>
                <span
                  className={`col-span-6 sm:col-span-2 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                    r.status === "PAID"
                      ? "bg-brand-500/10 text-brand-400"
                      : r.status === "FAILED" || r.status === "REFUNDED"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-white/5 text-white/30"
                  }`}
                >
                  {r.status}
                </span>
                <span className="hidden sm:block col-span-2 text-xs text-white/45 text-right">
                  {formatDateTime(r.createdAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {!isLoading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => updateParams({ page: currentPage - 1 })}
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
            onClick={() => updateParams({ page: currentPage + 1 })}
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
