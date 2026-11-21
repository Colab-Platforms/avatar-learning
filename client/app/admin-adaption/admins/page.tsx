"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Pencil, Plus, Search } from "lucide-react";
import { describeApiError, fetchAdminAudit, fetchAdminMeta, fetchAdmins, updateAdmin, type AdminAccount } from "@/lib/businessAdminApi";
import { debounce } from "@/lib/inboxLogic";
import { CreateAdminDialog, DeactivateDialog, EditAdminDialog, ResetPasswordDialog } from "@/components/business-admin/admins/AdminDialogs";
import { EmptyState, ErrorNote, PageHeader, StatusPill } from "@/components/business-admin/ui";
import { UserCog } from "lucide-react";

type Dialog = { kind: "create" } | { kind: "edit" | "reset" | "deactivate"; admin: AdminAccount } | null;

const MAX_CHIPS = 3;
const summary = (acts: string[] | undefined) => (!acts ? "" : acts.length >= 5 ? "full" : acts.length === 1 ? "view" : acts.filter((x) => x !== "view").join("/"));

function Modules({ a, labels }: { a: AdminAccount; labels: Record<string, string> }) {
  if (a.source === "none") return <span className="text-xs text-white/35">No Business Admin access</span>;
  if (a.source === "superadmin") return <span className="text-xs text-white/55">Everything, including Admin Management</span>;
  const shown = a.modules.slice(0, MAX_CHIPS);
  const rest = a.modules.length - shown.length;
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((m) => (
        <span key={m} className="rounded bg-white/6 px-1.5 py-px text-[11px] text-white/60">{labels[m] ?? m}<span className="ml-1 text-white/35">{summary(a.permissions[m])}</span></span>
      ))}
      {rest > 0 && <span title={a.modules.slice(MAX_CHIPS).map((m) => labels[m] ?? m).join(", ")} className="rounded bg-white/6 px-1.5 py-px text-[11px] text-white/45">+{rest} more</span>}
    </span>
  );
}

const roleText = (a: AdminAccount, roles: Record<string, string>) =>
  a.role === "SUPERADMIN" ? "Super admin" : a.source === "allowlist" ? "Legacy allowlist" : a.roleKey ? (roles[a.roleKey] ?? a.roleKey) : "Staff";

export default function AdminManagementPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [showAudit, setShowAudit] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);

  const push = useMemo(() => debounce((v: string) => { setQ(v.trim()); setPage(1); }, 300), []);
  useEffect(() => () => push.cancel(), [push]);

  const meta = useQuery({ queryKey: ["biz-admins", "meta"], queryFn: fetchAdminMeta, staleTime: 10 * 60_000 });
  const list = useQuery({ queryKey: ["biz-admins", "list", q, page, status, moduleFilter], queryFn: () => fetchAdmins(q, page, 25, { status, module: moduleFilter }), placeholderData: (prev) => prev });
  const audit = useQuery({ queryKey: ["biz-admins", "audit"], queryFn: () => fetchAdminAudit(1, 25), enabled: showAudit });
  const activate = useMutation({
    mutationFn: (a: AdminAccount) => updateAdmin(a.id, { isActive: true }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["biz-admins"] }),
  });

  const labels = useMemo(() => Object.fromEntries((meta.data?.modules ?? []).map((m) => [m.key, m.label])), [meta.data]);
  const roles = useMemo(() => Object.fromEntries((meta.data?.roles ?? []).map((r) => [r.key, r.label])), [meta.data]);
  const items = list.data?.items ?? [];
  const totalPages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1;

  const actions = (a: AdminAccount) =>
    a.role === "SUPERADMIN" ? (
      <span className="text-[11px] text-white/35">Protected</span>
    ) : (
      <span className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => setDialog({ kind: "edit", admin: a })} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/70 hover:bg-white/5"><Pencil size={12} /> Permissions</button>
        <button type="button" onClick={() => setDialog({ kind: "reset", admin: a })} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/70 hover:bg-white/5"><KeyRound size={12} /> Reset password</button>
        {a.isActive ? (
          <button type="button" onClick={() => setDialog({ kind: "deactivate", admin: a })} className="rounded-lg border border-red-400/30 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10">Deactivate</button>
        ) : (
          <button type="button" disabled={activate.isPending} onClick={() => activate.mutate(a)} className="rounded-lg border border-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300 hover:bg-white/5 disabled:opacity-50">Activate</button>
        )}
      </span>
    );

  return (
    <>
      <PageHeader
        title="Admin Management"
        description="Create admin accounts, choose what each one can use, reset passwords and switch accounts on or off. Only Super Admins can see this page."
        actions={
          <button type="button" onClick={() => setDialog({ kind: "create" })} disabled={!meta.data} className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
            <Plus size={15} /> Create admin
          </button>
        }
      />

      <label className="relative mb-4 block max-w-md">
        <span className="sr-only">Search admins by name or email</span>
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); push(e.target.value); }}
          placeholder="Search by name or email"
          className="w-full rounded-lg border border-white/8 bg-ink-900 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none"
        />
      </label>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-xs text-white/50">
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="text-xs text-white/50">
          <span className="sr-only">Filter by module</span>
          <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }} aria-label="Filter by module" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white">
            <option value="">Any module</option>
            {(meta.data?.modules ?? []).map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setShowAudit((v) => !v)} aria-pressed={showAudit} className="ml-auto rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/5">{showAudit ? "Hide" : "Show"} audit log</button>
      </div>

      {showAudit && (
        <section aria-label="Audit log" className="mb-5 rounded-2xl border border-white/6 bg-ink-900 p-4" data-testid="audit-log">
          <h2 className="mb-2 text-sm font-semibold text-white">Recent account and permission changes</h2>
          {audit.isLoading && <p className="text-sm text-white/45">Loading…</p>}
          {audit.isError && <ErrorNote message={describeApiError(audit.error)} />}
          {audit.data && audit.data.items.length === 0 && <p className="text-sm text-white/45">Nothing recorded yet.</p>}
          <ul className="divide-y divide-white/5 text-sm">
            {(audit.data?.items ?? []).map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <span className="text-white/80">{e.action.replace(/_/g, " ").toLowerCase()} <span className="text-white/45">· {e.targetEmail ?? "—"}</span></span>
                <span className="text-xs text-white/45">by {e.actorEmail ?? "system"} · {new Date(e.at).toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(list.isError || meta.isError) && <div className="mb-4"><ErrorNote message={describeApiError(list.error ?? meta.error)} onRetry={() => { void list.refetch(); void meta.refetch(); }} /></div>}
      {activate.isError && <div className="mb-4"><ErrorNote message={describeApiError(activate.error)} /></div>}
      {list.isLoading && <p className="text-sm text-white/35">Loading admins…</p>}

      {list.data && items.length === 0 && (
        q ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-white/45">No admins match &ldquo;{q}&rdquo;.</p>
        ) : (
          <EmptyState icon={UserCog} title="No admins yet" description="Create the first admin account to give someone access." />
        )
      )}

      {items.length > 0 && (
        <>
          {/* Wide screens: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-white/6 bg-ink-900 md:block">
            <table className="w-full text-left text-sm" data-testid="admins-table">
              <thead>
                <tr className="border-b border-white/6 text-[11px] uppercase tracking-widest text-white/35">
                  <th className="px-4 py-3 font-semibold">Admin</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Modules</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((a) => (
                  <tr key={a.id} data-testid="admin-row">
                    <td className="px-4 py-3 align-top"><p className="font-medium text-white">{a.name}</p><p className="text-xs text-white/40">{a.email}</p></td>
                    <td className="px-4 py-3 align-top text-white/70">{roleText(a, roles)}</td>
                    <td className="px-4 py-3 align-top"><Modules a={a} labels={labels} /></td>
                    <td className="px-4 py-3 align-top"><StatusPill tone={a.isActive ? "ok" : "off"}>{a.isActive ? "Active" : "Inactive"}</StatusPill></td>
                    <td className="px-4 py-3 align-top text-right">{actions(a)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phones: cards */}
          <ul className="space-y-3 md:hidden" aria-label="Admins">
            {items.map((a) => (
              <li key={a.id} data-testid="admin-card" className="rounded-2xl border border-white/6 bg-ink-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate font-medium text-white">{a.name}</p><p className="truncate text-xs text-white/40">{a.email}</p></div>
                  <StatusPill tone={a.isActive ? "ok" : "off"}>{a.isActive ? "Active" : "Inactive"}</StatusPill>
                </div>
                <p className="mt-2 text-xs text-white/50">{roleText(a, roles)}</p>
                <div className="mt-2"><Modules a={a} labels={labels} /></div>
                <div className="mt-3">{actions(a)}</div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between text-xs text-white/45">
            <span>{list.data?.total} admin{list.data?.total === 1 ? "" : "s"}</span>
            {totalPages > 1 && (
              <span className="flex items-center gap-3">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-30 hover:text-white">Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-30 hover:text-white">Next</button>
              </span>
            )}
          </div>
        </>
      )}

      {dialog?.kind === "create" && meta.data && <CreateAdminDialog meta={meta.data} onClose={() => setDialog(null)} />}
      {dialog?.kind === "edit" && meta.data && <EditAdminDialog admin={dialog.admin} meta={meta.data} onClose={() => setDialog(null)} />}
      {dialog?.kind === "reset" && <ResetPasswordDialog admin={dialog.admin} onClose={() => setDialog(null)} />}
      {dialog?.kind === "deactivate" && <DeactivateDialog admin={dialog.admin} onClose={() => setDialog(null)} />}
    </>
  );
}
