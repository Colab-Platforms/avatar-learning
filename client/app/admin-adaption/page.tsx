"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Inbox, MessageSquareText, RefreshCw, Send, Users } from "lucide-react";
import { describeApiError, fetchBusinessOverview } from "@/lib/businessAdminApi";
import { BASE } from "@/components/business-admin/nav";
import { ErrorNote, formatWhen, PageHeader, Panel, StatCard, StatusPill } from "@/components/business-admin/ui";

const MODULES: { href: string; label: string; state: "live" | "soon"; note: string }[] = [
  { href: `${BASE}/inbox`, label: "WhatsApp Inbox", state: "live", note: "Read, assign and reply to WhatsApp conversations." },
  { href: `${BASE}/integrations`, label: "Integrations", state: "live", note: "Configuration status (never secret values)." },
  { href: `${BASE}/analytics`, label: "Analytics", state: "live", note: "WhatsApp message counts only." },
  { href: `${BASE}/leads`, label: "CRM & Leads", state: "soon", note: "No lead backend is connected to this panel yet." },
  { href: `${BASE}/inbox?tab=contacts`, label: "Contacts", state: "live", note: "Create, import and manage WhatsApp contacts and consent (WhatsApp Inbox → Contacts)." },
  { href: `${BASE}/agents`, label: "AI Agents", state: "soon", note: "No agents are configured." },
  { href: `${BASE}/automations`, label: "Automations", state: "soon", note: "Outbound automation is switched off." },
];

export default function BusinessDashboardPage() {
  const q = useQuery({ queryKey: ["business-admin", "overview"], queryFn: fetchBusinessOverview, refetchInterval: 60_000 });
  const w = q.data?.whatsapp;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live status of the Avatar Adaption WhatsApp channel. Modules that are not built yet say so instead of showing sample data."
        actions={
          <button
            type="button"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw size={13} className={q.isFetching ? "animate-spin" : ""} /> Refresh
          </button>
        }
      />

      {q.isError && <div className="mb-5"><ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} /></div>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <StatCard icon={Inbox} label="Inbound messages" value={q.isLoading ? "…" : (w?.totalInbound ?? "—")} hint="All time" />
        <StatCard icon={MessageSquareText} label="Last 24 hours" value={q.isLoading ? "…" : (w?.inboundLast24h ?? "—")} hint="Inbound" tone="ok" />
        <StatCard icon={MessageSquareText} label="Last 7 days" value={q.isLoading ? "…" : (w?.inboundLast7d ?? "—")} hint="Inbound" />
        <StatCard icon={Send} label="Sent by your team" value={q.isLoading ? "…" : (w?.totalOutbound ?? "—")} hint="Outbound, all time" />
        <StatCard icon={Users} label="Contacts" value={q.isLoading ? "…" : (w?.contacts ?? "—")} hint="Distinct WhatsApp numbers" />
      </div>
      <p className="mt-3 text-xs text-white/30">Last inbound message: {q.isLoading ? "…" : formatWhen(w?.lastInboundAt)}</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <Panel title="WhatsApp channel">
          {q.data ? (
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="text-white/60">Webhook receiving</span>
                <StatusPill tone={q.data.integrations.whatsapp.webhookConfigured ? "ok" : "warn"}>
                  {q.data.integrations.whatsapp.webhookConfigured ? "Configured" : q.data.integrations.whatsapp.webhookEnabled ? "Incomplete" : "Disabled"}
                </StatusPill>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-white/60">Sending replies</span>
                <StatusPill tone={q.data.integrations.whatsapp.outboundSending === "ready" ? "ok" : "off"}>{q.data.integrations.whatsapp.outboundSending === "ready" ? "Ready" : "Switched off"}</StatusPill>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-white/60">Outbound messages recorded</span>
                <span className="text-white tabular-nums">{q.data.whatsapp.totalOutbound}</span>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-white/35">{q.isLoading ? "Loading…" : "Status unavailable."}</p>
          )}
          <Link href={`${BASE}/integrations`} className="mt-4 inline-block text-xs font-semibold text-brand-400 hover:text-brand-300">
            View integration details →
          </Link>
        </Panel>

        <Panel title="Modules">
          <ul className="divide-y divide-white/5">
            {MODULES.map((m) => (
              <li key={m.href}>
                <Link href={m.href} className="flex min-w-0 items-center justify-between gap-3 py-2.5 hover:text-white">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-white/80">{m.label}</span>
                    <span className="block text-xs text-white/35 truncate">{m.note}</span>
                  </span>
                  <StatusPill tone={m.state === "live" ? "ok" : "off"}>{m.state === "live" ? "Live" : "Not available yet"}</StatusPill>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
