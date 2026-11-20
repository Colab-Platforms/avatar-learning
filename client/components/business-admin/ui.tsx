import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-white/45">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className = "", flush = false }: { title?: string; action?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-white/6 bg-ink-900 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          {title && <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{title}</h2>}
          {action}
        </div>
      )}
      <div className={flush ? "pt-2" : "p-5 pt-3"}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "brand" }: { label: string; value: string | number; hint?: string; icon?: LucideIcon; tone?: "brand" | "ok" | "warn" }) {
  const ring = tone === "ok" ? "bg-emerald-500/10 text-emerald-300" : tone === "warn" ? "bg-amber-500/10 text-amber-300" : "bg-brand-500/10 text-brand-400";
  return (
    <div className="min-w-0 rounded-2xl border border-white/6 bg-ink-900 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{label}</p>
        {Icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ring}`}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-white sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </div>
  );
}

type Tone = "ok" | "warn" | "off" | "info";
const TONES: Record<Tone, string> = {
  ok: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  off: "bg-white/5 text-white/45 border-white/10",
  info: "bg-brand-500/10 text-brand-300 border-brand-500/20",
};

export function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TONES[tone]}`}>{children}</span>;
}

/** Honest placeholder for modules whose backend does not exist yet. Never shows sample data. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  points,
  note,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  points?: string[];
  note?: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-dashed border-white/10 bg-ink-900/60 px-5 text-center ${compact ? "py-8" : "py-10 sm:py-14"}`}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10">
        <Icon size={22} className="text-brand-400" />
      </div>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-white/45">{description}</p>
      {points && points.length > 0 && (
        <ul className="mx-auto mt-5 max-w-md space-y-1.5 text-left text-sm text-white/55">
          {points.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
              {p}
            </li>
          ))}
        </ul>
      )}
      {note && <p className="mx-auto mt-6 max-w-md text-xs text-white/30">{note}</p>}
      <div className="mt-5 flex justify-center">
        <StatusPill tone="off">Not available yet</StatusPill>
      </div>
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="shrink-0 rounded-lg border border-red-400/30 px-3 py-1 text-xs font-semibold hover:bg-red-500/10">
          Retry
        </button>
      )}
    </div>
  );
}

export const formatWhen = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
};
