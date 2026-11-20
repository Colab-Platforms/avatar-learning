"use client";

import Link from "next/link";
import { useBusinessAdmin } from "@/components/business-admin/BusinessAdminShell";
import { BASE } from "@/components/business-admin/nav";
import { PageHeader, Panel } from "@/components/business-admin/ui";

export default function SettingsPage() {
  const { me, name } = useBusinessAdmin();
  return (
    <>
      <PageHeader title="Settings" description="Business Admin preferences. Server configuration is managed in deployment, not here." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Account">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-white/45">Name</dt><dd className="text-white">{name}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-white/45">Role</dt><dd className="text-white">{me.role === "SUPERADMIN" ? "Super admin" : "Admin"}</dd></div>
          </dl>
        </Panel>
        <Panel title="Configuration">
          <p className="text-sm text-white/55">
            Connection settings (WhatsApp, email) are environment variables on the server. Their status is shown under{" "}
            <Link href={`${BASE}/integrations`} className="text-brand-400 hover:text-brand-300">Integrations</Link>.
          </p>
          <p className="mt-3 text-xs text-white/30">Editable business settings (business profile, hours, templates) are not available yet.</p>
        </Panel>
      </div>
    </>
  );
}
