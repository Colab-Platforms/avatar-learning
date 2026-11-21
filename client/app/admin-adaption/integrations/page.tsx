"use client";

import { useQuery } from "@tanstack/react-query";
import { describeApiError, fetchBusinessOverview } from "@/lib/businessAdminApi";
import { ErrorNote, PageHeader, Panel, StatusPill } from "@/components/business-admin/ui";
import { EmailAutomation } from "@/components/business-admin/email/EmailAutomation";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-white/60">{label}</span>
      {children}
    </li>
  );
}

export default function IntegrationsPage() {
  const q = useQuery({ queryKey: ["business-admin", "overview"], queryFn: fetchBusinessOverview });
  const wa = q.data?.integrations.whatsapp;
  const email = q.data?.integrations.email;

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Whether each connection is configured on the server. Only yes/no status is shown — keys, tokens and IDs are never displayed."
      />
      {q.isError && <div className="mb-5"><ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} /></div>}
      {q.isLoading && <p className="text-sm text-white/35">Loading…</p>}

      {q.data && wa && email && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="WhatsApp Cloud API (Meta)">
            <ul className="divide-y divide-white/5">
              <Row label="Webhook">
                <StatusPill tone={wa.webhookConfigured ? "ok" : wa.webhookEnabled ? "warn" : "off"}>
                  {wa.webhookConfigured ? "Configured" : wa.webhookEnabled ? "Enabled, incomplete" : "Disabled"}
                </StatusPill>
              </Row>
              <Row label="Phone number ID"><StatusPill tone={wa.phoneNumberIdSet ? "ok" : "off"}>{wa.phoneNumberIdSet ? "Set" : "Not set"}</StatusPill></Row>
              <Row label="Access token"><StatusPill tone={wa.accessTokenSet ? "ok" : "off"}>{wa.accessTokenSet ? "Set" : "Not set"}</StatusPill></Row>
              <Row label="Sending replies from the Inbox"><StatusPill tone={wa.outboundSending === "ready" ? "ok" : "off"}>{wa.outboundSending === "ready" ? "Ready" : wa.outboundEnabled ? "Switched on, not configured" : "Switched off"}</StatusPill></Row>
            </ul>
            {wa.missingVariables.length > 0 && (
              <p className="mt-3 text-xs text-amber-300/90">Missing variables: {wa.missingVariables.join(", ")}</p>
            )}
            <p className="mt-3 text-xs text-white/30">
              Receiving works through the webhook. Sending replies also needs WHATSAPP_OUTBOUND_ENABLED=true on the server, so an access token alone never sends anything. Replies are always typed and sent by a team member; nothing is automated.
            </p>
          </Panel>

          <Panel title="Email (Resend)">
            <ul className="divide-y divide-white/5">
              <Row label="Transactional email">
                <StatusPill tone={email.configured ? "ok" : "off"}>{email.configured ? "Configured" : "Not configured"}</StatusPill>
              </Row>
            </ul>
            <p className="mt-3 text-xs text-white/30">Used by the existing learning platform for OTPs and receipts, and by Email Automation below.</p>
          </Panel>

          <Panel title="Not connected yet" className="lg:col-span-2">
            <ul className="grid gap-2 sm:grid-cols-2 text-sm text-white/55">
              {["CRM sync", "AI model providers", "Calendar / scheduling", "Payments for adoption products"].map((n) => (
                <li key={n} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 px-3 py-2">
                  {n}
                  <StatusPill tone="off">Not connected</StatusPill>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}

      <EmailAutomation />
    </>
  );
}
