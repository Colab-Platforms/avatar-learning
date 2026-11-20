"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, BarChart3, ExternalLink, EyeOff, Globe2, Laptop, MapPin, Megaphone, Monitor, Route, ShieldCheck, Waypoints } from "lucide-react";
import { describeClarityError, fetchClarityHistory, fetchClarityOverview, fetchClarityStatus, type ClarityDays, type ClarityStatus } from "@/lib/businessAdminApi";
import { METRICS, compareToPrevious, formatMetric, type MetricDef } from "@/lib/analyticsMetrics";
import { EmptyState, ErrorNote, PageHeader, Panel, StatusPill } from "@/components/business-admin/ui";
import { Freshness, RangeSelect } from "@/components/business-admin/analytics/parts";

const BREAKDOWN_LINKS = [
  { dimension: "Source", label: "Traffic sources", icon: Megaphone },
  { dimension: "Campaign", label: "Campaigns", icon: Waypoints },
  { dimension: "Device", label: "Devices", icon: Laptop },
  { dimension: "Browser", label: "Browsers", icon: Monitor },
  { dimension: "Country/Region", label: "Geography", icon: MapPin },
  { dimension: "URL", label: "Popular pages", icon: Globe2 },
];

function ConnectScreen({ status }: { status: ClarityStatus }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Panel title="Connect Microsoft Clarity">
        <p className="text-sm text-white/60">
          Website analytics come from your Microsoft Clarity project through its Data Export API. Nothing is shown until a token is configured, and no sample data is ever displayed.
        </p>
        <ol className="mt-4 space-y-3 text-sm text-white/70">
          <li><b className="text-white">1.</b> In Clarity, open your project, then <i>Settings → Data Export</i>, and generate an API token.</li>
          <li><b className="text-white">2.</b> On the server, set <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">CLARITY_API_TOKEN</code> to that token and <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">CLARITY_PROJECT_ID</code> to the project ID (used only to build links to Clarity).</li>
          <li><b className="text-white">3.</b> Restart is not needed: the values are read on each request.</li>
        </ol>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <StatusPill tone={status.tokenConfigured ? "ok" : "warn"}>Token {status.tokenConfigured ? "set" : "missing"}</StatusPill>
          <StatusPill tone={status.projectIdConfigured ? "ok" : "off"}>Project ID {status.projectIdConfigured ? "set" : "not set"}</StatusPill>
        </div>
      </Panel>
      <Panel title="Limits to know about">
        <ul className="space-y-2 text-sm text-white/60">
          <li>Clarity returns only the last 1 to 3 days per request.</li>
          <li>About 10 requests per project per day, so results are stored and reused for {status.cacheMinutes / 60} hours.</li>
          <li>Live visitors, recordings, heatmaps and journeys have no API; they stay in the Clarity dashboard.</li>
        </ul>
      </Panel>
    </div>
  );
}

function MetricCard({ def, value, delta }: { def: MetricDef; value: number | null; delta: ReturnType<typeof compareToPrevious> }) {
  const good = delta ? (delta.delta === 0 ? null : (delta.delta > 0) === def.higherIsBetter) : null;
  return (
    <Link href={`/admin-adaption/analytics/${def.key}`} className="group block min-w-0 rounded-2xl border border-white/6 bg-ink-900 p-4 transition hover:border-brand-500/40 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{def.label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-white sm:text-3xl">{formatMetric(value, def.format)}</p>
      <p className="mt-1 flex min-h-4 items-center gap-1 text-xs text-white/40">
        {delta ? (
          <span className={`inline-flex items-center gap-0.5 font-semibold ${good === null ? "text-white/50" : good ? "text-emerald-400" : "text-red-400"}`}>
            {delta.delta > 0 ? <ArrowUp size={12} /> : delta.delta < 0 ? <ArrowDown size={12} /> : null}
            {delta.delta === 0 ? "No change" : delta.percent === null ? formatMetric(Math.abs(delta.delta), def.format) : `${Math.abs(delta.percent).toFixed(1)}%`}
            <span className="font-normal text-white/35"> vs earlier snapshot</span>
          </span>
        ) : (
          <span className="opacity-0 transition group-hover:opacity-100">View details →</span>
        )}
      </p>
    </Link>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState<ClarityDays>(3);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["clarity", "status"], queryFn: fetchClarityStatus });
  const connected = status.data?.tokenConfigured === true;
  const overview = useQuery({ queryKey: ["clarity", "overview", days], queryFn: () => fetchClarityOverview(days), enabled: connected, retry: false, staleTime: 5 * 60_000 });
  const history = useQuery({ queryKey: ["clarity", "history"], queryFn: fetchClarityHistory, enabled: connected, retry: false });

  const refresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const data = await fetchClarityOverview(days, true);
      qc.setQueryData(["clarity", "overview", days], data);
      void qc.invalidateQueries({ queryKey: ["clarity", "history"] });
      void qc.invalidateQueries({ queryKey: ["clarity", "status"] });
    } catch (e) {
      setRefreshError(describeClarityError(e));
    } finally {
      setRefreshing(false);
    }
  };

  const links = status.data?.dashboardLinks;
  const t = overview.data?.totals;

  return (
    <>
      <PageHeader
        title="Website analytics"
        description="Visitor behaviour on the public Avatar website, from Microsoft Clarity. Real data only: anything Clarity cannot provide is marked unavailable."
        actions={connected ? <RangeSelect days={days} onChange={setDays} onRefresh={() => void refresh()} refreshing={refreshing} /> : undefined}
      />

      {status.isError && <div className="mb-5"><ErrorNote message={describeClarityError(status.error)} onRetry={() => void status.refetch()} /></div>}
      {status.isLoading && <p className="text-sm text-white/40">Loading…</p>}
      {status.data && !connected && <ConnectScreen status={status.data} />}

      {status.data && connected && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Freshness meta={overview.data?.meta} />
            <p className="text-xs text-white/40">Clarity requests today: {status.data.requestsUsedToday} of {status.data.requestsAllowedPerDay} allowed by this server</p>
          </div>

          {refreshError && <div className="mb-5"><ErrorNote message={refreshError} /></div>}
          {overview.isError && <div className="mb-5"><ErrorNote message={describeClarityError(overview.error)} onRetry={() => void overview.refetch()} /></div>}

          {overview.isLoading ? (
            <p className="text-sm text-white/40">Loading metrics from Clarity…</p>
          ) : t ? (
            t.sessions === null && t.distinctUsers === null ? (
              <EmptyState icon={BarChart3} compact title="Clarity returned no traffic for this period" description="Either nobody who accepted analytics visited yet, or the tracking tag is not receiving data. Check the project in Clarity." />
            ) : (
              <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {METRICS.map((m) => (
                  <MetricCard key={m.key} def={m} value={t[m.field]} delta={overview.data ? compareToPrevious(history.data?.items ?? [], overview.data.meta, m.field, t[m.field]) : null} />
                ))}
              </div>
            )
          ) : null}

          <Panel title="Break traffic down" className="mb-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {BREAKDOWN_LINKS.map(({ dimension, label, icon: Icon }) => (
                <Link key={dimension} href={`/admin-adaption/analytics/sessions?dimension=${encodeURIComponent(dimension)}`} className="flex items-center gap-2.5 rounded-xl border border-white/8 px-3 py-3 text-sm font-medium text-white/75 transition hover:border-brand-500/40 hover:text-white">
                  <Icon size={16} className="text-brand-400" />
                  {label}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-xs text-white/40">Each breakdown asks Clarity once and is then reused for {status.data.cacheMinutes / 60} hours.</p>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="In the Clarity dashboard">
              {links ? (
                <ul className="space-y-2 text-sm">
                  {[
                    ["Session recordings", links.recordings],
                    ["Heatmaps and scroll maps", links.heatmaps],
                    ["Full dashboard (live users, journeys, new vs returning)", links.dashboard],
                    ["Privacy, masking and IP blocking settings", links.settings],
                  ].map(([label, href]) => (
                    <li key={href}>
                      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-300 hover:underline">
                        {label}
                        <ExternalLink size={13} />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/50">Set <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">CLARITY_PROJECT_ID</code> on the server to get direct links to recordings and heatmaps.</p>
              )}
              <div className="mt-4 flex gap-2 rounded-xl bg-white/[0.03] p-3 text-xs text-white/50">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                <span>The website loads Clarity only on public pages and only after a visitor accepts analytics. It never runs on login, payment, dashboard or admin pages.</span>
              </div>
            </Panel>

            <Panel title="Not available from Clarity's API">
              <ul className="space-y-3">
                {status.data.unavailable.map((u) => (
                  <li key={u.key} className="flex gap-2.5 text-sm">
                    {u.key === "journeys" ? <Route size={15} className="mt-0.5 shrink-0 text-white/30" /> : <EyeOff size={15} className="mt-0.5 shrink-0 text-white/30" />}
                    <span>
                      <span className="font-medium text-white/80">{u.label}</span>
                      <span className="block text-xs text-white/40">{u.reason}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
