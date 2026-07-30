"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  Calendar,
  IndianRupee,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useJobPlacementJourney } from "@/hooks/queries/useJobPlacementJourney";
import { useCreateJobPlacementEntry } from "@/hooks/mutations/useCreateJobPlacementEntry";
import { useUpdateJobPlacementEntry } from "@/hooks/mutations/useUpdateJobPlacementEntry";
import { useDeleteJobPlacementEntry } from "@/hooks/mutations/useDeleteJobPlacementEntry";
import type { JobPlacementEntry } from "@/lib/direct2hire/jobPlacementApi";
import { cn } from "@/lib/utils";

function formatMonthYear(value: string | null) {
  if (!value) return "Present";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30";
const labelCls =
  "text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 block";

type EntryFormValue = {
  companyName: string;
  jobTitle: string;
  location: string;
  ctcLpa: string;
  joinedAt: string;
  leftAt: string;
  notes: string;
};

const emptyForm: EntryFormValue = {
  companyName: "",
  jobTitle: "",
  location: "",
  ctcLpa: "",
  joinedAt: "",
  leftAt: "",
  notes: "",
};

function EntryForm({
  initial,
  submitLabel,
  showLeftAt,
  onCancel,
  onSubmit,
  isPending,
}: {
  initial: EntryFormValue;
  submitLabel: string;
  showLeftAt: boolean;
  onCancel: () => void;
  onSubmit: (value: EntryFormValue) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<EntryFormValue>(initial);

  const canSubmit =
    form.companyName.trim().length > 0 &&
    form.jobTitle.trim().length > 0 &&
    form.joinedAt.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Company Name</label>
          <input
            value={form.companyName}
            onChange={(e) =>
              setForm((f) => ({ ...f, companyName: e.target.value }))
            }
            placeholder="e.g. Acme Corp"
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Job Title</label>
          <input
            value={form.jobTitle}
            onChange={(e) =>
              setForm((f) => ({ ...f, jobTitle: e.target.value }))
            }
            placeholder="e.g. Frontend Developer"
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Location (optional)</label>
          <input
            value={form.location}
            onChange={(e) =>
              setForm((f) => ({ ...f, location: e.target.value }))
            }
            placeholder="e.g. Bengaluru"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>CTC in LPA (optional)</label>
          <input
            type="number"
            min={0}
            step="0.1"
            value={form.ctcLpa}
            onChange={(e) => setForm((f) => ({ ...f, ctcLpa: e.target.value }))}
            placeholder="e.g. 6.5"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Joining Date</label>
          <input
            type="date"
            value={form.joinedAt}
            onChange={(e) =>
              setForm((f) => ({ ...f, joinedAt: e.target.value }))
            }
            required
            className={cn(inputCls, "[color-scheme:light]")}
          />
        </div>
        {showLeftAt && (
          <div>
            <label className={labelCls}>
              Last Working Date (leave blank if current)
            </label>
            <input
              type="date"
              value={form.leftAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, leftAt: e.target.value }))
              }
              className={cn(inputCls, "[color-scheme:light]")}
            />
          </div>
        )}
      </div>
      <div>
        <label className={labelCls}>Notes (optional)</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
          placeholder="Role details, referral, anything worth noting…"
          className={cn(inputCls, "resize-none")}
        />
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={13} /> Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit || isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#1D4ED8] text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending && <Loader2 size={13} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function EntryCard({ entry }: { entry: JobPlacementEntry }) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateMutation = useUpdateJobPlacementEntry();
  const deleteMutation = useDeleteJobPlacementEntry();

  if (isEditing) {
    return (
      <EntryForm
        initial={{
          companyName: entry.companyName,
          jobTitle: entry.jobTitle,
          location: entry.location ?? "",
          ctcLpa: entry.ctcLpa != null ? String(entry.ctcLpa) : "",
          joinedAt: toDateInputValue(entry.joinedAt),
          leftAt: toDateInputValue(entry.leftAt),
          notes: entry.notes ?? "",
        }}
        submitLabel="Save Changes"
        showLeftAt
        isPending={updateMutation.isPending}
        onCancel={() => setIsEditing(false)}
        onSubmit={(value) =>
          updateMutation.mutate(
            {
              entryId: entry.id,
              payload: {
                companyName: value.companyName.trim(),
                jobTitle: value.jobTitle.trim(),
                location: value.location.trim() || null,
                ctcLpa: value.ctcLpa ? Number(value.ctcLpa) : null,
                joinedAt: new Date(value.joinedAt).toISOString(),
                leftAt: value.leftAt
                  ? new Date(value.leftAt).toISOString()
                  : null,
                notes: value.notes.trim() || null,
              },
            },
            { onSuccess: () => setIsEditing(false) },
          )
        }
      />
    );
  }

  return (
    <div className="relative pl-8">
      <span
        className={cn(
          "absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow",
          entry.isCurrent ? "bg-emerald-500" : "bg-slate-300",
        )}
      />
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-800">
                {entry.jobTitle}
              </h4>
              {entry.isCurrent && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Current
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-0.5 flex items-center gap-1.5">
              <Building2 size={13} className="text-slate-400" />
              {entry.companyName}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              aria-label="Edit entry"
            >
              <Pencil size={13} />
            </button>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Delete entry"
              >
                <Trash2 size={13} />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    deleteMutation.mutate(entry.id, {
                      onSuccess: () => setConfirmDelete(false),
                    })
                  }
                  disabled={deleteMutation.isPending}
                  className="text-[10px] font-bold px-2 py-1 rounded-md bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-[10px] font-bold px-2 py-1 rounded-md text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} className="text-slate-400" />
            {formatMonthYear(entry.joinedAt)} — {formatMonthYear(entry.leftAt)}
          </span>
          {entry.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-slate-400" />
              {entry.location}
            </span>
          )}
          {entry.ctcLpa != null && (
            <span className="flex items-center gap-1.5">
              <IndianRupee size={12} className="text-slate-400" />
              {entry.ctcLpa} LPA
            </span>
          )}
        </div>

        {entry.notes && (
          <p className="text-xs text-slate-500 mt-2.5 whitespace-pre-wrap leading-relaxed">
            {entry.notes}
          </p>
        )}
      </div>
    </div>
  );
}

export function PlacementJourneySection() {
  const { data, isLoading, isError } = useJobPlacementJourney();
  const createMutation = useCreateJobPlacementEntry();
  const [showAddForm, setShowAddForm] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-48 rounded bg-slate-100 animate-pulse mb-4" />
        <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-red-600">
          Failed to load your placement journey.
        </p>
      </div>
    );
  }

  const { canManage, entries } = data;
  // Most recent role first.
  const sortedEntries = [...entries].reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Briefcase size={18} className="text-blue-600" />
            Placement Journey
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-lg">
            Add details about your placements, and keep it updated whenever you
            switch roles.
          </p>
        </div>
        {canManage && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#1D4ED8] text-white hover:bg-blue-700 transition-colors shrink-0"
          >
            <Plus size={14} />
            {entries.length === 0 ? "Add Placement" : "Add New Role"}
          </button>
        )}
      </div>

      {!canManage ? (
        <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-6 text-center">
          <Lock size={20} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-600 font-medium">
            Complete your mock interview to unlock the Placement Journey
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Once your interview is marked done, you can log where you&apos;ve
            been placed and track every job switch here.
          </p>
        </div>
      ) : (
        <>
          {showAddForm && (
            <EntryForm
              initial={emptyForm}
              submitLabel={
                entries.length === 0 ? "Add Placement" : "Add New Role"
              }
              showLeftAt={false}
              isPending={createMutation.isPending}
              onCancel={() => setShowAddForm(false)}
              onSubmit={(value) =>
                createMutation.mutate(
                  {
                    companyName: value.companyName.trim(),
                    jobTitle: value.jobTitle.trim(),
                    location: value.location.trim() || null,
                    ctcLpa: value.ctcLpa ? Number(value.ctcLpa) : null,
                    joinedAt: new Date(value.joinedAt).toISOString(),
                    notes: value.notes.trim() || null,
                  },
                  { onSuccess: () => setShowAddForm(false) },
                )
              }
            />
          )}

          {entries.length === 0 && !showAddForm ? (
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-8 text-center">
              <Briefcase size={20} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">
                No placement logged yet. Add your first role once you&apos;re
                placed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
