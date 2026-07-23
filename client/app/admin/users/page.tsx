"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, ShieldMinus, Search } from "lucide-react";
import {
  fetchUsersPaginated,
  setUserRole,
  type AdminUser,
} from "@/lib/adminApi";

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

export default function AdminUsersPage() {
  const [callerRole, setCallerRole] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState("");

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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchUsersPaginated(page, 10, search || undefined);
      setUsers(res.data);
      setTotalPages(res.totalPages ?? 1);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleAdmin = async (user: AdminUser) => {
    const current = highestRole(user);
    const nextRole = current === "ADMIN" ? "USER" : "ADMIN";
    setActingId(user.id);
    setError("");
    try {
      const updated = await setUserRole(user.id, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to update role.");
    } finally {
      setActingId(null);
    }
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
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
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
              {canManageRoles && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-white/40">Loading…</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-white/40">No users found</td>
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:bg-white/5 disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-white/40">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:bg-white/5 disabled:opacity-30 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
