"use client";

import Link from "next/link";
import { UserCog } from "lucide-react";
import { useBusinessAdmin } from "@/components/business-admin/BusinessAdminShell";
import { PageHeader, Panel, StatusPill } from "@/components/business-admin/ui";

const ACCESS_LABEL: Record<string, string> = { superadmin: "Access: super admin", permissions: "Access: granted permissions", allowlist: "Access: legacy allowlist" };

export default function TeamPage() {
  const { me, name } = useBusinessAdmin();
  return (
    <>
      <PageHeader title="Team Management" description="Your own access to Business Admin. This is separate from Learning Admin access." />
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <Panel title="You">
          <p className="text-sm text-white">{name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusPill tone="info">{me.isSuperAdmin ? "Super admin" : "Business admin"}</StatusPill>
            <StatusPill tone="ok">{ACCESS_LABEL[me.access] ?? "Access granted"}</StatusPill>
          </div>
          <p className="mt-3 text-xs text-white/50">Modules you can use: {me.modules.length ? me.modules.join(", ") : "none"}</p>
        </Panel>
        <Panel title="Accounts and permissions">
          {me.isSuperAdmin ? (
            <>
              <p className="text-sm text-white/60">Create staff accounts, choose what each person can do in each module, reset passwords and deactivate accounts.</p>
              <Link href="/admin-adaption/admins" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600">
                <UserCog size={15} /> Open Admin Management
              </Link>
            </>
          ) : (
            <p className="text-sm text-white/60">Only a Super Admin can create accounts or change permissions. Every request is checked by the server, whatever this page shows.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
