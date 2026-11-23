"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { EmptyState, ErrorNote, Panel } from "@/components/business-admin/ui";
import { ActivityTimeline, DateRange, EventTypeFilter, FilterBar, Pager, Select, Skeleton, dayEndIso, dayStartIso, useNow } from "./parts";
import { describeApiError } from "@/lib/businessAdminApi";
import { fetchUserTimeline, fetchVisitorTimeline } from "@/lib/monitoringApi";

const SIZE = 30;

/** The complete activity timeline for one registered user or one guest browser, with date, category and event-type filters. */
export function TimelinePanel({ kind, id, title = "Activity timeline" }: { kind: "user" | "visitor"; id: string; title?: string }) {
  const now = useNow(15000);
  const [types, setTypes] = useState<string[]>([]);
  const [category, setCategory] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["monitoring", "timeline", kind, id, types, category, from, to, page],
    queryFn: () => (kind === "user" ? fetchUserTimeline : fetchVisitorTimeline)(id, { types, category: category === "all" ? undefined : category, from: dayStartIso(from), to: dayEndIso(to), page, pageSize: SIZE }),
    placeholderData: keepPreviousData,
    refetchInterval: 20_000,
  });
  const reset = () => setPage(1);
  const data = q.data;
  return (
    <Panel title={title}>
      <FilterBar>
        <EventTypeFilter value={types} onChange={(v) => { setTypes(v); reset(); }} />
        <Select label="Category" value={category} onChange={(v) => { setCategory(v); reset(); }} options={[{ value: "all", label: "All activity" }, { value: "AUTH", label: "Sign-in & account" }, { value: "ACTIVITY", label: "Website & business" }]} />
        <DateRange from={from} to={to} onChange={(a, b) => { setFrom(a); setTo(b); reset(); }} />
      </FilterBar>
      {q.isError ? <ErrorNote message={describeApiError(q.error)} onRetry={() => void q.refetch()} />
        : !data ? <Skeleton rows={6} />
        : data.items.length === 0 ? <EmptyState compact icon={History} title="No activity" description="Nothing matches these filters. Activity is recorded only for visitors who accepted analytics, plus sign-in events." />
        : <><ActivityTimeline events={data.items} now={now} /><Pager page={data.page} total={data.total} pageSize={data.pageSize} onPage={setPage} /></>}
    </Panel>
  );
}
