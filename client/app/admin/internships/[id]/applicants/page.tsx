"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ChevronLeft,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  fetchAdminInternship,
  fetchInternshipApplications,
  updateApplicationStatus,
  AdminApplicant,
} from "@/lib/adminApi";
import type { PaginatedResponse } from "@/lib/internshipsApi";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-amber-400 bg-amber-400/10",
  ACCEPTED: "text-emerald-400 bg-emerald-400/10",
  REJECTED: "text-red-400 bg-red-400/10",
};

const applicantName = (u: AdminApplicant["user"]): string => {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email;
};

interface InternshipSummary {
  title: string;
  _count: { applications: number };
}

export default function AdminInternshipApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const [internship, setInternship] = useState<InternshipSummary | null>(null);

  const [applicants, setApplicants] = useState<AdminApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Omit<
    PaginatedResponse<AdminApplicant>,
    "data"
  > | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminInternship(id)
      .then((data) => setInternship(data))
      .catch(() => setError("Failed to load internship."));
  }, [id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchInternshipApplications(id, page, 20);
      setApplicants(res.data);
      setPagination({
        currentPage: res.currentPage,
        pageSize: res.pageSize,
        totalRecords: res.totalRecords,
        totalPages: res.totalPages,
        hasNextPage: res.hasNextPage,
        hasPreviousPage: res.hasPreviousPage,
      });
    } catch {
      setError("Failed to load applicants.");
    } finally {
      setLoading(false);
    }
  }, [id, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (
    applicationId: string,
    status: "PENDING" | "ACCEPTED" | "REJECTED",
  ) => {
    setUpdatingStatusId(applicationId);
    try {
      await updateApplicationStatus(applicationId, status);
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a)),
      );
    } catch {
      setError("Failed to update application status.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2 text-xs text-white/35">
        <Link href="/admin" className="hover:text-white/60 transition-colors">
          Admin
        </Link>
        <ChevronRight size={12} />
        <Link
          href="/admin/internships"
          className="hover:text-white/60 transition-colors"
        >
          Internships
        </Link>
        <ChevronRight size={12} />
        <Link
          href={`/admin/internships/${id}`}
          className="hover:text-white/60 transition-colors truncate max-w-48"
        >
          {internship?.title ?? "…"}
        </Link>
        <ChevronRight size={12} />
        <span className="text-white/55">Applicants</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Applicants</h1>
        <p className="text-sm text-white/40 mt-0.5">
          {pagination?.totalRecords ?? internship?._count.applications ?? 0} total applications
          {internship?.title ? ` for ${internship.title}` : ""}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="border border-white/5 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/3 border-b border-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Applicant</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Applied</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Resume</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-white/40">
                  Loading…
                </td>
              </tr>
            ) : applicants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-white/40">
                  No applicants yet
                </td>
              </tr>
            ) : (
              applicants.map((a) => (
                <tr key={a.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">
                    {applicantName(a.user)}
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">
                    <div>{a.user.email}</div>
                    {a.user.phoneNo && (
                      <div className="text-white/35">{a.user.phoneNo}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/60 text-xs">
                    {new Date(a.appliedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {a.resumeUrl ?? a.user.resumeUrl ? (
                      <a
                        href={a.resumeUrl ?? a.user.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-brand-500/30 bg-brand-500/8 text-xs font-medium text-brand-300 hover:bg-brand-500/15 transition-colors"
                      >
                        <FileText size={12} /> View
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-xs text-white/25">No resume</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLOR[a.status]}`}
                      >
                        {a.status}
                      </span>
                      <select
                        value={a.status}
                        disabled={updatingStatusId === a.id}
                        onChange={(e) =>
                          handleStatusChange(
                            a.id,
                            e.target.value as "PENDING" | "ACCEPTED" | "REJECTED",
                          )
                        }
                        className="bg-ink-900 border border-white/8 rounded-lg px-2 py-1 text-xs text-white/70 focus:outline-none focus:border-brand-500/50 disabled:opacity-50"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
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
            onClick={() => setPage((p) => p - 1)}
            disabled={!pagination.hasPreviousPage}
            className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-white/40">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
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
