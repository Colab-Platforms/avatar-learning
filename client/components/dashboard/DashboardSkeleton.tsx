const shimmer =
  "relative overflow-hidden bg-slate-200/60 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

function Block({ className = "" }: { className?: string }) {
  return <div className={`rounded-md ${shimmer} ${className}`} />;
}

function JourneyCardSkeleton() {
  return (
    <div className="flex flex-col p-4 rounded-2xl border border-slate-100 bg-slate-50/50 min-h-[140px]">
      <div className="flex items-center justify-between mb-3.5">
        <Block className="h-4 w-14 rounded-md" />
        <Block className="h-5 w-5 rounded-full" />
      </div>
      <div className="space-y-2">
        <Block className="h-2.5 w-10" />
        <Block className="h-3.5 w-24" />
        <Block className="h-2.5 w-full" />
        <Block className="h-2.5 w-3/4" />
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-6 sm:p-8 shadow-xl shadow-blue-900/10">
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full space-y-4">
            <Block className="h-5 w-40 bg-white/10 before:via-white/20" />
            <Block className="h-8 w-64 bg-white/15 before:via-white/25" />
            <div className="space-y-2 max-w-xl">
              <Block className="h-3 w-full bg-white/10 before:via-white/20" />
              <Block className="h-3 w-5/6 bg-white/10 before:via-white/20" />
            </div>
            <div className="flex gap-3 pt-2">
              <Block className="h-11 w-40 rounded-xl bg-white/15 before:via-white/25" />
              <Block className="h-11 w-48 rounded-xl bg-white/10 before:via-white/20" />
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-5 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 w-full md:w-auto">
            <Block className="w-20 h-20 rounded-full shrink-0 bg-white/10 before:via-white/20" />
            <div className="space-y-2 flex-1">
              <Block className="h-2.5 w-24 bg-white/10 before:via-white/20" />
              <Block className="h-5 w-28 bg-white/15 before:via-white/25" />
              <Block className="h-2.5 w-32 bg-white/10 before:via-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Your Journey — 5 milestone cards */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 space-y-1.5">
          <Block className="h-4 w-28" />
          <Block className="h-3 w-56" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <JourneyCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Continue Learning + Refer & Earn */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <Block className="h-4 w-32" />
            <Block className="h-3 w-20" />
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-5 min-h-[280px]">
            <div className="flex flex-col sm:flex-row gap-5">
              <Block className="w-full sm:w-56 h-36 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-3">
                <Block className="h-5 w-28 rounded-full" />
                <Block className="h-4 w-3/4" />
                <Block className="h-3 w-1/2" />
                <Block className="h-1.5 w-full rounded-full" />
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <Block className="h-2.5 w-24" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                  <Block key={i} className="h-9 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <Block className="h-4 w-24" />
            <Block className="h-3.5 w-3.5 rounded-sm" />
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 min-h-[300px]">
            <Block className="h-4 w-24 rounded-full" />
            <Block className="h-4 w-40" />
            <div className="space-y-2">
              <Block className="h-3 w-full" />
              <Block className="h-3 w-full" />
              <Block className="h-3 w-2/3" />
            </div>
            <Block className="h-10 w-full rounded-xl mt-auto" />
          </div>
        </div>
      </div>

      {/* Internship Progress + Pre-Placement Preparation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <Block className="h-4 w-40" />
              <Block className="h-3 w-16" />
            </div>
            <Block className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[...Array(4)].map((_, j) => (
                <Block key={j} className="h-14 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
