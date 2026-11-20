"use client";

import { Users } from "lucide-react";
import { useBusinessAdmin } from "@/components/business-admin/BusinessAdminShell";
import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/business-admin/ui";

export default function TeamPage() {
  const { me, name } = useBusinessAdmin();
  return (
    <>
      <PageHeader title="Team Management" description="Who can open Business Admin. This is separate from Learning Admin access." />
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <Panel title="You">
          <p className="text-sm text-white">{name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusPill tone="info">{me.role === "SUPERADMIN" ? "Super admin" : "Admin"}</StatusPill>
            <StatusPill tone="ok">{me.access === "superadmin" ? "Access: super admin" : "Access: allowlisted"}</StatusPill>
          </div>
        </Panel>
        <Panel title="Access rules">
          <ul className="space-y-2 text-sm text-white/60">
            <li>Super admins always have Business Admin access.</li>
            <li>Learning admins only have it when their email is on the server&apos;s Business Admin allowlist.</li>
            <li>Learners never have it. Every request is checked by the server.</li>
          </ul>
        </Panel>
      </div>
      <EmptyState
        icon={Users}
        title="Team list and invitations are not available yet"
        description="The allowlist is managed by whoever deploys the server. In-app roles, invitations and per-module permissions need a dedicated role model that does not exist yet."
      />
    </>
  );
}
