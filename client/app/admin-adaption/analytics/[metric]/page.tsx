"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { describeClarityError, fetchClarityBreakdown, fetchClarityHistory, fetchClarityOverview, fetchClarityStatus, type ClarityDays } from "@/lib/businessAdminApi";
import { DIMENSION_LABELS, compareToPrevious, formatMetric, metricByKey, share, trendPoints } from "@/lib/analyticsMetrics";
import { EmptyState, ErrorNote, PageHeader, Panel } from "@/components/business-admin/ui";
import { BarList, Freshness, RangeSelect, TrendChart } from "@/components/business-admin/analytics/parts";
import { BarChart3 } from "lucide-react";

function Detail() {
  const { metric: key } = useParams<{ metric: string }>();
  const def = metricByKey(key);
  const search = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const [days, setDays] = useState<ClarityDays>(3);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const requested = search.get("dimension") ?? "Source";
  const status = useQuery({ queryKey: ["clarity", "status"], queryFn: fetchClarityStatus });
  const connected = status.data?.tokenConfigured === true;
  const dimension = status.data?.dimensions.includes(requested) ? requested : "Source";

  const overview = useQuery({ queryKey: ["clarity", "overview", days], queryFn: () => fetchClarityOverview(days), enabled: connected, retry: false, staleTime: 5 * 60_000 });
  const history = useQuery({ queryKey: ["clarity", "history"], queryFn: fetchClarityHistory, enabled: connected, retry: false });
  const breakdown = useQuery({
    queryKey: ["clarity", "breakdown", dimension, days],
    queryFn: () => fetchClarityBreakdown(dimension, days),
    enabled: connected && !!def?.breakdown,
    retry: false,
    staleTime: 5 * 60_000,
  });

  if (!def) {
    return (
      <>
        <Back />
        <EmptyState icon={BarChart3} compact title="Unknown metric" description="That metric does not exist. Go back to the analytics overview and pick one of the cards." />
      </>
    );
  }

  const value = overview.data?.totals[def.field] ?? null;
  const delta = overview.data ? compareToPrevious(history.data?.items ?? [], overview.data.meta, def.field, value) : null;
  const points = trendPoints(history.data?.items ?? [], days, def.field);
  const fmt = (v: number) => formatMetric(v, def.format);
  const links = status.data?.dashboardLinks;

  const refresh = async () => {
    setRefreshError(null);
    try {
      qc.setQueryData(["clarity", "overview", days], await fetchClarityOverview(days, true));
      if (def.breakdown) qc.setQueryData(["clarity", "breakdown", dimension, days], await fetchClarityBreakdown(dimension, days, true));
      void qc.invalidateQueries({ queryKey: ["clarity", "history"] });
      void qc.invalidateQueries({ queryKey: ["clarity", "status"] });
    } catch (e) {
      setRefreshError(describeClarityError(e));
    }
  };

  const rows = breakdown.data?.rows ?? [];
  const total = breakdown.data?.total ?? 0;
  const pages = breakdown.data?.pages ?? [];

  return (
    <>
      <Back />
      <PageHeader title={def.label} description={def.description} actions={connected ? <RangeSelect days={days} onChange={setDays} onRefresh={() => void refresh()} /> : undefined} />

      {status.isError && <div className="mb-5"><ErrorNote message={describeClarityError(status.error)} onRetry={() => void status.refetch()} /></div>}
      {status.data && !connected && <EmptyState icon={BarChart3} compact title="Clarity is not connected" description="Connect Clarity on the analytics overview page to see this metric." />}
      {refreshError && <div className="mb-5"><ErrorNote message={refreshError} /></div>}

      {connected && (
        <>
          {overview.isError && <div className="mb-5"><ErrorNote message={describeClarityError(overview.error)} onRetry={() => void overview.refetch()} /></div>}
          <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Panel title={days === 1 ? "Last day" : `Last ${days} days`}>
              <p className="text-4xl font-bold tabular-nums text-white">{overview.isLoading ? "…" : formatMetric(value, def.format)}</p>
              <p className="mt-2 text-sm text-white/50">
                {delta
                  ? `${delta.delta >= 0 ? "+" : "−"}${formatMetric(Math.abs(delta.delta), def.format)}${delta.percent === null ? "" : ` (${Math.abs(delta.percent).toFixed(1)}%)`} compared with the snapshot stored ${new Date(delta.previousAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                  : "No earlier snapshot to compare with yet. Clarity cannot return past periods, so comparisons appear as this server stores more readings."}
              </p>
              <div className="mt-3"><Freshness meta={overview.data?.meta} /></div>
            </Panel>
            <Panel title="Trend">
              {points.length >= 2 ? <TrendChart points={points} format={fmt} /> : <p className="text-sm text-white/50">A trend needs at least two stored readings for this date range ({points.length} so far). Readings are stored each time fresh data is fetched from Clarity.</p>}
            </Panel>
          </div>

          {def.breakdown ? (
            <Panel title="Breakdown" flush>
              <div className="flex flex-wrap gap-1.5 px-5 pb-3" role="tablist" aria-label="Break down by">
                {(status.data?.dimensions ?? []).map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="tab"
                    aria-selected={d === dimension}
                    onClick={() => router.replace(`/admin-adaption/analytics/${def.key}?dimension=${encodeURIComponent(d)}`)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${d === dimension ? "border-brand-500 bg-brand-500/15 text-brand-300" : "border-white/10 text-white/55 hover:bg-white/5"}`}
                  >
                    {DIMENSION_LABELS[d] ?? d}
                  </button>
                ))}
              </div>
              {breakdown.isLoading && <p className="px-5 pb-5 text-sm text-white/40">Loading from Clarity…</p>}
              {breakdown.isError && <div className="px-5 pb-5"><ErrorNote message={describeClarityError(breakdown.error)} onRetry={() => void breakdown.refetch()} /></div>}
              {breakdown.data && rows.length === 0 && pages.length === 0 && <p className="px-5 pb-5 text-sm text-white/50">Clarity returned no rows for this breakdown and period.</p>}
              {rows.length > 0 && (
                <>
                  <BarList
                    rows={rows.map((r) => {
                      const v = def.key === "users" ? r.users : r.sessions;
                      return { key: r.label, label: r.label, value: v, secondary: def.key === "users" ? undefined : r.users !== null ? `${r.users.toLocaleString("en-IN")} visitors` : undefined, pct: share(v, def.key === "users" ? rows.reduce((a, x) => a + (x.users ?? 0), 0) : total) };
                    })}
                    valueFormat={(v) => formatMetric(v, "number")}
                  />
                  <div className="px-5 py-3"><Freshness meta={breakdown.data?.meta} /></div>
                </>
              )}
              {dimension === "URL" && pages.length > 0 && (
                <div className="border-t border-white/5">
                  <h3 className="px-5 pt-4 text-[11px] font-semibold uppercase tracking-widest text-white/40">Page views by URL</h3>
                  <BarList rows={pages.map((p) => ({ key: p.url, label: p.url, value: p.visits, pct: share(p.visits, pages.reduce((a, x) => a + (x.visits ?? 0), 0)) }))} valueFormat={(v) => formatMetric(v, "number")} />
                </div>
              )}
              {dimension === "URL" && <p className="px-5 pb-4 text-xs text-white/40">Entry and exit pages are not provided by Clarity&apos;s API; they are in the Clarity dashboard.</p>}
            </Panel>
          ) : (
            <Panel title="Where to dig deeper">
              <p className="text-sm text-white/60">Clarity&apos;s API only reports this metric as one overall number, so it cannot be split by source, device or page here. To see exactly where it happens, filter sessions in Clarity.</p>
              {links && (
                <a href={links.recordings} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-brand-300 hover:underline">
                  Open session recordings in Clarity <ExternalLink size={13} />
                </a>
              )}
            </Panel>
          )}
        </>
      )}
    </>
  );
}

function Back() {
  return (
    <Link href="/admin-adaption/analytics" className="mb-3 inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white">
      <ArrowLeft size={15} /> Website analytics
    </Link>
  );
}

export default function MetricDetailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/40">Loading…</p>}>
      <Detail />
    </Suspense>
  );
}
