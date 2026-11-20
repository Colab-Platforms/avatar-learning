"use client";

import { RefreshCw } from "lucide-react";
import type { ClarityDays, ClarityMeta } from "@/lib/businessAdminApi";
import { formatWhen } from "@/components/business-admin/ui";

export function RangeSelect({ days, onChange, onRefresh, refreshing }: { days: ClarityDays; onChange: (d: ClarityDays) => void; onRefresh?: () => void; refreshing?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div role="group" aria-label="Date range" className="inline-flex overflow-hidden rounded-xl border border-white/10 text-xs font-semibold">
        {([1, 2, 3] as const).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={days === d}
            onClick={() => onChange(d)}
            className={`px-3 py-2 ${days === d ? "bg-brand-500 text-white" : "text-white/55 hover:bg-white/5"}`}
          >
            {d === 1 ? "Last day" : `Last ${d} days`}
          </button>
        ))}
      </div>
      {onRefresh && (
        <button type="button" onClick={onRefresh} disabled={refreshing} title="Ask Clarity for fresh data (uses part of the daily request limit)" className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/5 disabled:opacity-50">
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      )}
    </div>
  );
}

/** Where the numbers came from and how old they are. Never hides that data is cached or stale. */
export function Freshness({ meta }: { meta: ClarityMeta | undefined }) {
  if (!meta) return null;
  return (
    <p className="text-xs text-white/40">
      {meta.source === "clarity" ? "Fetched from Clarity" : "Stored snapshot"} · {formatWhen(meta.fetchedAt)}
      {meta.stale && <span className="ml-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-300">Out of date: Clarity could not be reached, showing the last stored data</span>}
    </p>
  );
}

/** Line chart of stored snapshots. Plain SVG; each point is a real stored reading. */
export function TrendChart({ points, format }: { points: Array<{ at: string; value: number }>; format: (v: number) => string }) {
  if (points.length < 2) return null;
  const W = 640;
  const H = 180;
  const pad = { l: 8, r: 8, t: 14, b: 22 };
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => pad.l + (i / (points.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / span) * (H - pad.t - pad.b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const label = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Trend across ${points.length} stored snapshots, from ${format(points[0].value)} to ${format(points[points.length - 1].value)}`} className="h-44 w-full text-brand-400">
        <path d={`${path} L${x(points.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`} fill="currentColor" opacity="0.1" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={p.at} cx={x(i)} cy={y(p.value)} r="3" fill="currentColor">
            <title>{`${formatWhen(p.at)}: ${format(p.value)}`}</title>
          </circle>
        ))}
        <text x={pad.l} y={H - 6} fontSize="10" fill="currentColor" opacity="0.5">{label(points[0].at)}</text>
        <text x={W - pad.r} y={H - 6} fontSize="10" textAnchor="end" fill="currentColor" opacity="0.5">{label(points[points.length - 1].at)}</text>
      </svg>
      <figcaption className="mt-1 text-xs text-white/40">Each point is a reading this server stored from Clarity. Clarity itself only returns the last 1 to 3 days, so this history starts when the connection was made.</figcaption>
    </figure>
  );
}

export function BarList({ rows, valueFormat }: { rows: Array<{ key: string; label: string; value: number | null; secondary?: string; pct: number }>; valueFormat: (v: number | null) => string }) {
  return (
    <ul className="divide-y divide-white/5">
      {rows.map((r) => (
        <li key={r.key} className="px-5 py-2.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-white/80" title={r.label}>{r.label}</span>
            <span className="shrink-0 tabular-nums text-white">
              {valueFormat(r.value)}
              {r.secondary && <span className="ml-2 text-xs text-white/40">{r.secondary}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5" aria-hidden>
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${r.pct}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
