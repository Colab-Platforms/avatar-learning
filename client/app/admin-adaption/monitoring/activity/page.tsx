"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { EmptyState, ErrorNote, PageHeader, Panel } from "@/components/business-admin/ui";
import { MonitoringTabs, SearchBox, Skeleton } from "@/components/business-admin/monitoring/parts";
import { TimelinePanel } from "@/components/business-admin/monitoring/TimelinePanel";
import { describeApiError } from "@/lib/businessAdminApi";
import { fetchPeople, fetchUserDetail } from "@/lib/monitoringApi";

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get("user");
  const [search, setSearch] = useState("");
  const results = useQuery({ queryKey: ["monitoring", "pick", search], queryFn: () => fetchPeople({ kind: "registered", search, pageSize: 8 }), enabled: search.trim().length >= 2 });
  const detail = useQuery({ queryKey: ["monitoring", "user", userId], queryFn: () => fetchUserDetail(userId as string), enabled: !!userId });

  return (
    <div>
      <PageHeader title="User Activity History" description="Pick a registered user to see everything they did: sign-ins, page views, courses, lessons, tests, payments." />
      <MonitoringTabs />
      <Panel>
        <SearchBox value={search} onChange={setSearch} placeholder="Find a user by name or email…" />
        {search.trim().length >= 2 && (
          <ul className="mt-3 divide-y divide-white/5 rounded-xl border border-white/6">
            {results.isLoading ? <li className="p-3 text-xs text-white/40">Searching…</li>
              : results.data?.items.length ? results.data.items.map((p) => p.kind === "registered" && (
                <li key={p.id}><button type="button" onClick={() => { router.push(`/admin-adaption/monitoring/activity?user=${p.userId}`); setSearch(""); }} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-white/5"><span className="text-sm text-white">{p.label}<span className="ml-2 text-xs text-white/35">{p.email}</span></span><span className="text-xs text-white/40">{p.online ? "Online" : "Offline"}</span></button></li>
              ))
              : <li className="p-3 text-xs text-white/40">No registered user matches.</li>}
          </ul>
        )}
      </Panel>
      <div className="mt-4">
        {!userId ? <EmptyState icon={History} title="Choose a user" description="Search above, or open a user from Visitors & Users, Active Sessions or Login & Security." />
          : detail.isError ? <ErrorNote message={describeApiError(detail.error)} />
          : !detail.data ? <Skeleton rows={4} />
          : (
            <>
              <p className="mb-3 text-sm text-white/60">Showing <b className="text-white">{detail.data.account.name ?? detail.data.account.email}</b> · <Link href={`/admin-adaption/monitoring/user/${userId}`} className="text-brand-300 hover:underline">Full profile →</Link></p>
              <TimelinePanel kind="user" id={userId} />
            </>
          )}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  return <Suspense fallback={<Skeleton rows={4} />}><Inner /></Suspense>;
}
