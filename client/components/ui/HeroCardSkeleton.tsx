export function HeroCardSkeleton() {
  return (
    <div className="hero-card-border p-[1.5px] rounded-2xl">
      <div className="rounded-[14px] bg-ink-900/95 p-6 animate-pulse">
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded bg-white/10" />
          <div className="h-6 w-20 rounded bg-white/10" />
        </div>

        <div className="mt-5 h-6 w-4/5 rounded bg-white/10" />

        <div className="mt-3 h-4 w-2/3 rounded bg-white/10" />

        <div className="mt-8 h-10 w-40 rounded bg-white/10" />
      </div>
    </div>
  );
}
