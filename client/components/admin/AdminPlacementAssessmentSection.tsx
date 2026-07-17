"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  XCircle,
} from "lucide-react";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { PlacementAttemptCard } from "@/components/placement/PlacementAttemptCard";
import { useAdminStudentPlacementAttempts } from "@/hooks/queries/useAdminStudentPlacementAttempts";
import { useAdminStudentPlacementOverrides } from "@/hooks/queries/useAdminStudentPlacementOverrides";
import { useAdminStudentPlacementSummary } from "@/hooks/queries/useAdminStudentPlacementSummary";
import { useGrantPlacementAttempts } from "@/hooks/mutations/useGrantPlacementAttempts";
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-ink-800 border border-white/6 rounded-2xl p-6", className)}>{children}</div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    PASSED: {
      label: "Passed",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
      icon: <CheckCircle2 size={12} />,
    },
    FAILED: {
      label: "Failed",
      className: "bg-red-500/10 text-red-400 border-red-500/25",
      icon: <XCircle size={12} />,
    },
    EXHAUSTED: {
      label: "Attempts Exhausted",
      className: "bg-orange-500/10 text-orange-400 border-orange-500/25",
      icon: <AlertCircle size={12} />,
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/25",
      icon: <Loader2 size={12} className="animate-spin" />,
    },
    NOT_STARTED: {
      label: "Not Started",
      className: "bg-white/6 text-white/50 border-white/10",
      icon: null,
    },
  };
  const item = config[status] ?? config.NOT_STARTED;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide", item.className)}>
      {item.icon}
      {item.label}
    </span>
  );
}

function GrantAttemptsDialog({
  open,
  onClose,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
}) {
  const [attemptsGranted, setAttemptsGranted] = useState(1);
  const [reason, setReason] = useState("");
  const grantMutation = useGrantPlacementAttempts(userId);

  const handleSubmit = async () => {
    try {
      await grantMutation.mutateAsync({ attemptsGranted, reason: reason.trim() });
      setAttemptsGranted(1);
      setReason("");
      onClose();
    } catch {
      // error shown below
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-800 p-6 shadow-2xl"
      >
        <h3 className="text-base font-bold text-white mb-1">Grant Extra Attempts</h3>
        <p className="text-xs text-white/40 mb-5">
          Provide a reason for the audit trail. This will increase the student&apos;s available attempts.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
              Extra Attempts
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={attemptsGranted}
              onChange={(e) => setAttemptsGranted(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="e.g. Internet disconnected during attempt #2..."
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50 resize-none"
            />
          </div>
          {grantMutation.isError && (
            <p className="text-xs text-red-400">
              {(grantMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                "Failed to grant attempts."}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={grantMutation.isPending || reason.trim().length < 10}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 disabled:opacity-50"
          >
            {grantMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            Confirm Grant
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function AdminPlacementAssessmentSection({ userId }: { userId: string }) {
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const { data: placementData, isLoading: summaryLoading } = useAdminStudentPlacementSummary(userId);
  const { data: attempts, isLoading: attemptsLoading } = useAdminStudentPlacementAttempts(userId);
  const { data: overrides, isLoading: overridesLoading } = useAdminStudentPlacementOverrides(userId);

  if (summaryLoading) {
    return (
      <Card>
        <div className="h-6 w-48 rounded bg-white/5 animate-pulse mb-4" />
        <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
      </Card>
    );
  }

  if (!placementData?.course) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="text-brand-400" size={18} />
          <h2 className="text-sm font-semibold text-white/80">Placement Assessment</h2>
        </div>
        <p className="text-sm text-white/35">Student has not selected a Direct2Hire course yet.</p>
      </Card>
    );
  }

  if (!placementData.assessment || !placementData.summary) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="text-brand-400" size={18} />
          <h2 className="text-sm font-semibold text-white/80">Placement Assessment</h2>
        </div>
        <p className="text-sm text-white/35">
          No placement assessment configured for {placementData.course.title}.
        </p>
      </Card>
    );
  }

  const { summary } = placementData;

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="text-brand-400" size={18} />
              <h2 className="text-sm font-semibold text-white/80">Placement Assessment</h2>
            </div>
            <p className="text-xs text-white/40">{placementData.course.title}</p>
          </div>
          <StatusBadge status={summary.currentStatus} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-5">
          {[
            { label: "Highest Score", value: summary.highestScore != null ? `${summary.highestScore.toFixed(0)}%` : "—" },
            { label: "Latest Score", value: summary.latestScore != null ? `${summary.latestScore.toFixed(0)}%` : "—" },
            { label: "Attempts Used", value: `${summary.attemptsUsed} / ${summary.effectiveMaxAttempts}` },
            { label: "Remaining", value: String(summary.remainingAttempts) },
            {
              label: "Completed",
              value: summary.assessmentCompletionDate
                ? formatDateTime(summary.assessmentCompletionDate)
                : "—",
            },
            { label: "Default Limit", value: String(summary.defaultMaxAttempts) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/6 bg-ink-900/40 px-3 py-2.5">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">{stat.label}</p>
              <p className="text-sm font-bold text-white mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <CollapsibleSection
            title="Attempt History"
            subtitle={`${attempts?.length ?? 0} attempt${attempts?.length === 1 ? "" : "s"}`}
            className="border-white/8 bg-ink-900/30"
            headerClassName="text-white/80"
          >
            {attemptsLoading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : !attempts?.length ? (
              <p className="text-sm text-white/35">No attempts recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <PlacementAttemptCard key={attempt.id} attempt={attempt} variant="dark" />
                ))}
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Assessment Controls"
            subtitle="Manage attempt limits and overrides"
            className="border-white/8 bg-ink-900/30"
            headerClassName="text-white/80"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {[
                { label: "Attempts Used", value: summary.attemptsUsed },
                { label: "Remaining", value: summary.remainingAttempts },
                { label: "Default Limit", value: summary.defaultMaxAttempts },
                { label: "Extra Granted", value: summary.extraAttemptsGranted },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/6 bg-ink-800/60 px-3 py-2.5">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-lg font-bold text-white mt-0.5">{stat.value}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setGrantDialogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-500 transition-colors"
            >
              <Plus size={14} />
              Grant Extra Attempts
            </button>

            <div className="mt-5">
              <CollapsibleSection
                title="Override History"
                subtitle={`${overrides?.length ?? 0} override${overrides?.length === 1 ? "" : "s"}`}
                className="border-white/6 bg-ink-800/40"
                headerClassName="text-white/70"
              >
                {overridesLoading ? (
                  <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
                ) : !overrides?.length ? (
                  <p className="text-sm text-white/35">No overrides recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {overrides.map((override) => (
                      <div
                        key={override.id}
                        className="rounded-xl border border-white/6 bg-ink-900/50 px-4 py-3 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">
                            +{override.attemptsGranted} attempt{override.attemptsGranted > 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-white/35">{formatDateTime(override.createdAt)}</p>
                        </div>
                        <p className="text-xs text-white/50">
                          By{" "}
                          {[override.grantedBy.firstName, override.grantedBy.lastName]
                            .filter(Boolean)
                            .join(" ") || override.grantedBy.email}
                        </p>
                        <p className="text-sm text-white/70 leading-relaxed">{override.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>
            </div>
          </CollapsibleSection>
        </div>
      </Card>

      <AnimatePresence>
        {grantDialogOpen && (
          <GrantAttemptsDialog open={grantDialogOpen} onClose={() => setGrantDialogOpen(false)} userId={userId} />
        )}
      </AnimatePresence>
    </>
  );
}
