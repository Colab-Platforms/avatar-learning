"use client";

import { Briefcase, Building2, Calendar, IndianRupee, MapPin } from "lucide-react";
import { useAdminJobPlacementJourney } from "@/hooks/queries/useAdminJobPlacementJourney";
import type { JobPlacementEntry } from "@/lib/direct2hire/jobPlacementApi";
import { cn } from "@/lib/utils";

function formatMonthYear(value: string | null) {
  if (!value) return "Present";
  return new Date(value).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-ink-800 border border-white/6 rounded-2xl p-6">{children}</div>;
}

function EntryRow({ entry }: { entry: JobPlacementEntry }) {
  return (
    <div className="relative pl-8">
      <span
        className={cn(
          "absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-ink-800 shadow",
          entry.isCurrent ? "bg-emerald-400" : "bg-white/20",
        )}
      />
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-white/90">{entry.jobTitle}</h4>
              {entry.isCurrent && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  Current
                </span>
              )}
            </div>
            <p className="text-sm text-white/60 mt-0.5 flex items-center gap-1.5">
              <Building2 size={13} className="text-white/30" />
              {entry.companyName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} className="text-white/25" />
            {formatMonthYear(entry.joinedAt)} — {formatMonthYear(entry.leftAt)}
          </span>
          {entry.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-white/25" />
              {entry.location}
            </span>
          )}
          {entry.ctcLpa != null && (
            <span className="flex items-center gap-1.5">
              <IndianRupee size={12} className="text-white/25" />
              {entry.ctcLpa} LPA
            </span>
          )}
        </div>

        {entry.notes && (
          <p className="text-xs text-white/50 mt-2.5 whitespace-pre-wrap leading-relaxed">{entry.notes}</p>
        )}
      </div>
    </div>
  );
}

export function AdminJobPlacementSection({ userId }: { userId: string }) {
  const { data, isLoading, isError } = useAdminJobPlacementJourney(userId);

  if (isLoading) {
    return (
      <Card>
        <div className="h-6 w-40 rounded bg-white/5 animate-pulse mb-4" />
        <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <p className="text-sm text-red-400">Failed to load placement journey.</p>
      </Card>
    );
  }

  const { canManage, entries } = data;
  const sortedEntries = [...entries].reverse();

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Briefcase className="text-brand-400" size={18} />
        <h2 className="text-sm font-semibold text-white/80">Placement Journey</h2>
      </div>
      <p className="text-xs text-white/40 mb-5 leading-relaxed max-w-2xl">
        Job placements and role switches the student has logged after their mock interview.
      </p>

      {!canManage ? (
        <p className="text-sm text-white/35">
          Student hasn&apos;t completed their mock interview yet — Placement Journey is locked for them.
        </p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-white/35">No placement logged by the student yet.</p>
      ) : (
        <div className="space-y-4">
          {sortedEntries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </Card>
  );
}
