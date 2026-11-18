"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, ShieldMinus, Search, Link as LinkIcon, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  setUserRole,
  generateD2HPaymentLink,
  type AdminUser,
  type D2HPaymentLink,
} from "@/lib/adminApi";
import { useAdminUsers } from "@/hooks/queries/useAdminUsers";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useDebounce } from "@/hooks/useDebounce";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

const highestRole = (u: AdminUser): string => {
  const names = u.userRoleMappings.map((m) => m.role.name);
  if (names.includes("SUPERADMIN")) return "SUPERADMIN";
  if (names.includes("ADMIN")) return "ADMIN";
  return "USER";
};

const ROLE_COLOR: Record<string, string> = {
  SUPERADMIN: "text-elec-400 bg-elec-400/10",
  ADMIN: "text-brand-400 bg-brand-400/10",
  USER: "text-white/50 bg-white/8",
};

const PAGE_SIZE = 10;

function AdminUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const urlSearch = searchParams.get("search")?.trim() ?? "";

  const [callerRole, setCallerRole] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState("");
  const [linkActingId, setLinkActingId] = useState<string | null>(null);
  const [paymentLinks, setPaymentLinks] = useState<Record<string, D2HPaymentLink>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search box value updates every keystroke; the debounced value only catches
  // up 400ms after typing stops, so the URL (and the query key it drives)
  // doesn't change on every keystroke.
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput.trim(), 400);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth");
      if (!raw) return;
      const { accessToken } = JSON.parse(raw);
      const payload = accessToken ? decodeJwtPayload(accessToken) : null;
      setCallerRole((payload?.role as string) ?? null);
    } catch {
      setCallerRole(null);
    }
  }, []);

  const { data, isPending, isError } = useAdminUsers(
    currentPage,
    PAGE_SIZE,
    urlSearch || undefined,
  );

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const loading = isPending;
  const error = mutationError || (isError ? "Failed to load users." : "");

  const activeQueryKey = queryKeys.adminUsersPage(
    currentPage,
    PAGE_SIZE,
    urlSearch || undefined,
  );

  const goTo = useCallback(
    (page: number, nextSearch?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(page));
      }
      const s = nextSearch !== undefined ? nextSearch : urlSearch;
      if (s) {
        params.set("search", s);
      } else {
        params.delete("search");
      }
      const qs = params.toString();
      router.push(qs ? `/admin/users?${qs}` : "/admin/users");
    },
    [router, searchParams, urlSearch],
  );

  // Sync the debounced search term into the URL, resetting to page 1 so a stale
  // currentPage doesn't request an out-of-range page against the new, smaller
  // filtered result set.
  useEffect(() => {
    if (debouncedSearch !== urlSearch) {
      goTo(1, debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // If the current page falls past the end of the result set (e.g. after a
  // refresh on ?page=9 with fewer pages now), snap back to page 1.
  useEffect(() => {
    if (
      data &&
      data.totalPages > 0 &&
      currentPage > data.totalPages &&
      currentPage !== 1
    ) {
      goTo(1);
    }
  }, [data, currentPage, goTo]);

  const handleToggleAdmin = async (user: AdminUser) => {
    const current = highestRole(user);
    const nextRole = current === "ADMIN" ? "USER" : "ADMIN";
    setActingId(user.id);
    setMutationError("");
    try {
      const updated = await setUserRole(user.id, nextRole);
      queryClient.setQueryData(
        activeQueryKey,
        (old: typeof data | undefined) =>
          old
            ? {
                ...old,
                data: old.data.map((u) => (u.id === user.id ? updated : u)),
              }
            : old,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
    } catch (err: any) {
      setMutationError(err?.response?.data?.message ?? "Failed to update role.");
    } finally {
      setActingId(null);
    }
  };

  const handleGenerateLink = async (user: AdminUser) => {
    setLinkActingId(user.id);
    setMutationError("");
    try {
      const link = await generateD2HPaymentLink(user.id);
      setPaymentLinks((prev) => ({ ...prev, [user.id]: link }));
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Failed to generate payment link",
      );
    } finally {
      setLinkActingId(null);
    }
  };

  const handleCopyLink = async (userId: string, shortUrl: string) => {
    await navigator.clipboard.writeText(shortUrl);
    setCopiedId(userId);
    toast.success("Link copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const canManageRoles = callerRole === "SUPERADMIN";

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-sm text-white/40 mt-0.5">
          {canManageRoles
            ? "Grant or revoke admin access for platform users."
            : "Only a SUPERADMIN can change user roles."}
        </p>
      </div>

      <div className="relative max-w-xs">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
        />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or email"
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-white/10 bg-ink-900 text-sm text-white/85 placeholder-white/25 focus:outline-none focus:border-brand-500/50"
        />
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">D2H Payment Link</th>
              {canManageRoles && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={canManageRoles ? 6 : 5} className="px-4 py-6 text-center text-white/40">Loading…</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={canManageRoles ? 6 : 5} className="px-4 py-6 text-center text-white/40">No users found</td>
              </tr>
            ) : (
              users.map((u) => {
                const role = highestRole(u);
                return (
                  <tr key={u.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      {`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—"}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${ROLE_COLOR[role]}`}>
                        {role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {paymentLinks[u.id] ? (
                        <div className="flex items-center gap-2 max-w-xs">
                          <a
                            href={paymentLinks[u.id].shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-400 hover:text-brand-300 underline underline-offset-2 truncate"
                          >
                            {paymentLinks[u.id].shortUrl}
                          </a>
                          <button
                            onClick={() => handleCopyLink(u.id, paymentLinks[u.id].shortUrl)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 text-[10px] font-medium text-white/70 hover:bg-white/5 shrink-0"
                          >
                            {copiedId === u.id ? (
                              <Check size={11} className="text-emerald-400" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateLink(u)}
                          disabled={linkActingId === u.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-brand-500/30 bg-brand-500/8 text-xs font-medium text-brand-300 hover:bg-brand-500/15 disabled:opacity-50 transition-colors"
                        >
                          {linkActingId === u.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <LinkIcon size={12} />
                          )}
                          Generate Link
                        </button>
                      )}
                    </td>
                    {canManageRoles && (
                      <td className="px-4 py-3">
                        {role === "SUPERADMIN" ? (
                          <span className="text-xs text-white/25">—</span>
                        ) : role === "ADMIN" ? (
                          <button
                            onClick={() => handleToggleAdmin(u)}
                            disabled={actingId === u.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-500/8 text-xs font-medium text-red-300 hover:bg-red-500/15 disabled:opacity-50 transition-colors"
                          >
                            {actingId === u.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <ShieldMinus size={12} />
                            )}
                            Remove admin
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleAdmin(u)}
                            disabled={actingId === u.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/8 text-xs font-medium text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-50 transition-colors"
                          >
                            {actingId === u.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <ShieldCheck size={12} />
                            )}
                            Make admin
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:bg-white/5 disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-white/40">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:bg-white/5 disabled:opacity-30 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-6">
          <div className="h-8 w-40 bg-ink-800 rounded-lg animate-pulse" />
          <div className="h-64 bg-ink-800 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}
