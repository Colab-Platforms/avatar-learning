"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X, Loader2, Eye } from "lucide-react";
import {
  fetchPartnerApplications,
  fetchPartnerDetail,
  approvePartner,
  rejectPartner,
  fetchPartnerClaims,
  markClaimPaid,
  type AdminPartner,
  type AdminPartnerClaim,
  type AdminPartnerDetail,
} from "@/lib/adminApi";

const DETAIL_FIELDS: { key: keyof AdminPartnerDetail; label: string }[] = [
  { key: "organizationName", label: "Institute / Company Name" },
  { key: "contactPerson", label: "Contact Person" },
  { key: "designation", label: "Designation" },
  { key: "instituteType", label: "Institute Type" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "location", label: "Location" },
  { key: "profession", label: "Profession" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "website", label: "Website" },
  { key: "purpose", label: "Purpose of Partnership" },
  { key: "aadharNumber", label: "Aadhar Number" },
  { key: "panNumber", label: "PAN Number" },
  { key: "bankAccountNumber", label: "Bank Account Number" },
  { key: "bankIfsc", label: "IFSC Code" },
];

const KYC_DOCS: { key: "aadharFileUrl" | "panFileUrl" | "bankProofFileUrl"; label: string }[] = [
  { key: "aadharFileUrl", label: "Aadhar Card" },
  { key: "panFileUrl", label: "PAN Card" },
  { key: "bankProofFileUrl", label: "Passbook / Cancelled Cheque" },
];

function PartnerDetailModal({
  id,
  onClose,
  onApprove,
  onReject,
}: {
  id: string;
  onClose: () => void;
  onApprove: (id: string, note: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
}) {
  const [detail, setDetail] = useState<AdminPartnerDetail | null>(null);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);
  const [actionErr, setActionErr] = useState("");

  useEffect(() => {
    fetchPartnerDetail(id).then(setDetail).catch(() => setDetail(null));
  }, [id]);

  const runAction = async (kind: "approve" | "reject") => {
    setActionErr("");
    setActing(kind);
    try {
      if (kind === "approve") await onApprove(id, note);
      else await onReject(id, note);
      onClose();
    } catch (err: any) {
      setActionErr(err?.response?.data?.message ?? `Failed to ${kind} partner.`);
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-ink-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Application Details</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {!detail ? (
          <div className="py-10 flex justify-center">
            <Loader2 size={20} className="animate-spin text-white/40" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/8 text-white/70">
                {detail.type}
              </span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLOR[detail.status]}`}>
                {detail.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {DETAIL_FIELDS.map(({ key, label }) => {
                const value = detail[key];
                if (!value) return null;
                return (
                  <div key={key}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">{label}</p>
                    <p className="text-sm text-white/85 wrap-break-word">{String(value)}</p>
                  </div>
                );
              })}
            </div>

            {KYC_DOCS.some((d) => detail[d.key]) && (
              <>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-2">
                    KYC Documents
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {KYC_DOCS.filter((d) => detail[d.key]).map((d) => (
                      <a
                        key={d.key}
                        href={detail[d.key] as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-500/30 bg-brand-500/8 text-xs font-medium text-brand-300 hover:bg-brand-500/15 transition-colors"
                      >
                        {d.label}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="h-px bg-white/10" />

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Account Email</p>
                <p className="text-sm text-white/85">{detail.user.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Applied On</p>
                <p className="text-sm text-white/85">{new Date(detail.createdAt).toLocaleString()}</p>
              </div>
              {detail.referralCode && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Referral Code</p>
                  <p className="text-sm text-white/85 font-mono">{detail.referralCode}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Wallet Balance</p>
                <p className="text-sm text-white/85">₹{detail.walletBalance}</p>
              </div>
            </div>

            {detail.referrals.length > 0 && (
              <>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-2">
                    Referrals ({detail.referrals.length})
                  </p>
                  <div className="space-y-1.5">
                    {detail.referrals.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-xs">
                        <span className="text-white/50">{new Date(r.createdAt).toLocaleDateString()}</span>
                        <span className={r.creditedAt ? "text-emerald-400" : "text-white/35"}>
                          {r.creditedAt ? `₹${r.commissionEarned}` : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {detail.status !== "PENDING" && detail.reviewNote && (
              <>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-1">
                    Admin Feedback
                  </p>
                  <p className="text-sm text-white/85 wrap-break-word">{detail.reviewNote}</p>
                </div>
              </>
            )}

            {detail.status === "PENDING" && (
              <>
                <div className="h-px bg-white/10" />
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-1.5">
                      Feedback (shown to applicant, required for rejection)
                    </p>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="e.g. Aadhar document is blurry, please re-upload"
                      className="w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white/85 placeholder-white/25 focus:outline-none focus:border-brand-500/50 resize-none"
                    />
                  </div>

                  {actionErr && (
                    <p className="text-xs text-red-400">{actionErr}</p>
                  )}

                  <div className="flex items-center gap-2">
                    {detail.type !== "CORPORATE" && (
                      <button
                        onClick={() => runAction("approve")}
                        disabled={acting !== null}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/8 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-50 transition-colors"
                      >
                        {acting === "approve" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (!note.trim()) {
                          setActionErr("Please add feedback explaining the rejection.");
                          return;
                        }
                        runAction("reject");
                      }}
                      disabled={acting !== null}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/8 text-xs font-semibold text-red-300 hover:bg-red-500/15 disabled:opacity-50 transition-colors"
                    >
                      {acting === "reject" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                      Reject
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-amber-400 bg-amber-400/10",
  APPROVED: "text-emerald-400 bg-emerald-400/10",
  REJECTED: "text-red-400 bg-red-400/10",
  PAID: "text-emerald-400 bg-emerald-400/10",
};

const partnerName = (p: AdminPartner): string =>
  p.organizationName ?? p.contactPerson ?? p.user.email;

export default function AdminPartnersPage() {
  const [tab, setTab] = useState<"applications" | "claims">("applications");

  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [claims, setClaims] = useState<AdminPartnerClaim[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPartnerApplications(1, 50, statusFilter || undefined);
      setPartners(res.data);
    } catch {
      setError("Failed to load partner applications.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPartnerClaims(1, 50, statusFilter || undefined);
      setClaims(res.data);
    } catch {
      setError("Failed to load payout claims.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setError("");
    if (tab === "applications") loadApplications();
    else loadClaims();
  }, [tab, loadApplications, loadClaims]);

  const handleApprove = async (id: string, note: string) => {
    const updated = await approvePartner(id, note);
    setPartners((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleReject = async (id: string, note: string) => {
    const updated = await rejectPartner(id, note);
    setPartners((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleMarkPaid = async (claimId: string) => {
    setActingId(claimId);
    try {
      const updated = await markClaimPaid(claimId);
      setClaims((prev) => prev.map((c) => (c.id === claimId ? updated : c)));
    } catch {
      setError("Failed to mark claim as paid.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Partners</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Review partner applications and process payout claims.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 p-1">
          {(["applications", "claims"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setStatusFilter("");
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                tab === t ? "bg-brand-500/15 text-brand-300" : "text-white/50 hover:text-white/80"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-ink-900 border border-white/8 rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none focus:border-brand-500/50"
        >
          <option value="">All statuses</option>
          {tab === "applications" ? (
            <>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </>
          ) : (
            <>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </>
          )}
        </select>
      </div>

      {error && (
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {tab === "applications" ? (
        <div className="border border-white/5 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/3 border-b border-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Applicant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Referral Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Wallet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-white/40">Loading…</td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-white/40">No applications yet</td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-white/70 text-xs">{p.type}</td>
                    <td className="px-4 py-3 text-white font-medium">{partnerName(p)}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">
                      <div>{p.email}</div>
                      <div className="text-white/35">{p.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs font-mono">
                      {p.referralCode ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs">₹{p.walletBalance}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLOR[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setViewId(p.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-white/60 hover:bg-white/10 transition-colors"
                      >
                        <Eye size={12} /> {p.status === "PENDING" ? "Review" : "View"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-white/5 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/3 border-b border-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Partner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Requested</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-white/40">Loading…</td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-white/40">No claims yet</td>
                </tr>
              ) : (
                claims.map((c) => (
                  <tr key={c.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      {c.partner.organizationName ?? c.partner.contactPerson ?? c.partner.email}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">
                      <div>{c.partner.email}</div>
                      <div className="text-white/35">{c.partner.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-white/70 text-xs font-semibold">₹{c.amount}</td>
                    <td className="px-4 py-3 text-white/60 text-xs">
                      {new Date(c.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLOR[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.status === "PENDING" ? (
                        <button
                          onClick={() => handleMarkPaid(c.id)}
                          disabled={actingId === c.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/8 text-xs font-medium text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-50 transition-colors"
                        >
                          {actingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-xs text-white/25">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewId && (
        <PartnerDetailModal
          id={viewId}
          onClose={() => setViewId(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
