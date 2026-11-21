"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { checkEmailConnection, describeApiError, fetchEmailStats, fetchEmailStatus } from "@/lib/businessAdminApi";
import { ErrorNote, Panel, StatCard, StatusPill } from "@/components/business-admin/ui";
import { AutomationsTab } from "./AutomationsTab";
import { ActivityTab, ScheduledTab } from "./ScheduledAndActivityTabs";
import { TemplatesTab } from "./TemplatesTab";
import { btnGhost } from "./shared";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "templates", label: "Email Templates" },
  { id: "automations", label: "Automations" },
  { id: "scheduled", label: "Scheduled Emails" },
  { id: "activity", label: "Email Activity" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/** Email Automation (Resend) section of the Integrations page. */
export function EmailAutomation() {
  const [tab, setTab] = useState<TabId>("overview");
  const status = useQuery({ queryKey: ["email", "status"], queryFn: fetchEmailStatus });
  const stats = useQuery({ queryKey: ["email", "stats"], queryFn: fetchEmailStats, refetchInterval: 30_000 });
  const [conn, setConn] = useState<{ ok: boolean; message: string } | null>(null);
  const check = useMutation({
    mutationFn: checkEmailConnection,
    onSuccess: (r) => { setConn(r); (r.ok ? toast.success : toast.error)(r.message); },
    onError: (e) => toast.error(describeApiError(e)),
  });
  const s = status.data;
  const connection = conn ? (conn.ok ? "ok" : "error") : s?.configured ? "ok" : "off";

  return (
    <section aria-labelledby="email-automation-heading" className="mt-6">
      <h2 id="email-automation-heading" className="mb-3 text-lg font-bold tracking-tight text-white">Email Automation</h2>
      <div role="tablist" aria-label="Email automation" className="mb-4 flex gap-1 overflow-x-auto border-b border-white/6">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`email-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`email-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px shrink-0 border-b-2 px-3.5 py-2 text-sm font-medium ${tab === t.id ? "border-brand-500 text-white" : "border-transparent text-white/50 hover:text-white/80"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`email-panel-${tab}`} aria-labelledby={`email-tab-${tab}`}>
        {tab === "overview" && (
          <div className="grid gap-4">
            <Panel title="Email provider" action={<button className={btnGhost} onClick={() => check.mutate()} disabled={check.isPending}>{check.isPending ? "Testing…" : "Test connection"}</button>}>
              {status.isError && <ErrorNote message={describeApiError(status.error)} onRetry={() => void status.refetch()} />}
              {s && (
                <ul className="divide-y divide-white/5 text-sm">
                  <li className="flex items-center justify-between gap-3 py-2.5"><span className="text-white/60">Email provider</span><span className="text-white/85">{s.provider}</span></li>
                  <li className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-white/60">Connection status</span>
                    <StatusPill tone={connection === "ok" ? "ok" : connection === "error" ? "warn" : "off"}>{connection === "ok" ? "Configured" : connection === "error" ? "Error" : "Not configured"}</StatusPill>
                  </li>
                  {conn && <li className="py-2 text-xs text-white/45">{conn.message}</li>}
                  <li className="flex items-center justify-between gap-3 py-2.5"><span className="text-white/60">Automation engine</span><StatusPill tone={s.engineEnabled ? "ok" : "off"}>{s.engineEnabled ? "Active" : "Inactive"}</StatusPill></li>
                  <li className="flex items-center justify-between gap-3 py-2.5"><span className="text-white/60">Delivery updates (webhook)</span><StatusPill tone={s.webhookConfigured ? "ok" : "off"}>{s.webhookConfigured ? "Configured" : "Not configured"}</StatusPill></li>
                </ul>
              )}
              <p className="mt-3 text-xs text-white/30">
                Shares the Resend account that sends sign-in codes and receipts; those emails are not affected. The engine switch (EMAIL_AUTOMATION_ENABLED) controls automatic and scheduled sending. Keys are never shown here.
              </p>
            </Panel>
            {stats.isError && <ErrorNote message={describeApiError(stats.error)} onRetry={() => void stats.refetch()} />}
            {stats.data && stats.data.needsReview > 0 && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                <span>{stats.data.needsReview} email{stats.data.needsReview === 1 ? "" : "s"} could not be confirmed as sent or not sent. They are never retried automatically, so nobody is emailed twice by mistake. Check Resend, then record what you found.</span>
                <button className={btnGhost} onClick={() => setTab("activity")}>Review them</button>
              </div>
            )}
            {stats.data && (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <StatCard label="Total sent" value={stats.data.totalSent} />
                <StatCard label="Delivered" value={stats.data.delivered} tone="ok" hint={s?.webhookConfigured ? undefined : "Needs the webhook"} />
                <StatCard label="Failed" value={stats.data.failed} tone={stats.data.failed ? "warn" : "brand"} />
                <StatCard label="Pending scheduled" value={stats.data.pendingScheduled} />
                <StatCard label="Active automations" value={stats.data.activeAutomations} />
              </div>
            )}
          </div>
        )}
        {tab === "templates" && <TemplatesTab />}
        {tab === "automations" && <AutomationsTab engineEnabled={s?.engineEnabled ?? false} />}
        {tab === "scheduled" && <ScheduledTab />}
        {tab === "activity" && <ActivityTab />}
      </div>
    </section>
  );
}
