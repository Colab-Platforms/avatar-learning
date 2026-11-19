"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adoptionAccount, type DemoStatus, type MyDemoRequest } from "@/lib/adoptionSession";
import { ErrorBox, errorMessage, focusRing, primaryHover, secondaryHover } from "../../_components/ui";
import { Badge, PRODUCT_NAMES, SkeletonList, card, fmtDate, fmtDateTime, muted, sectionTitle, smallBtn, smallSecondary, type Tone } from "./shared";

const STATUS: Record<DemoStatus, { label: string; tone: Tone }> = {
  SUBMITTED: { label: "Submitted", tone: "grey" },
  UNDER_REVIEW: { label: "Under review", tone: "amber" },
  SCHEDULED: { label: "Scheduled", tone: "cyan" },
  COMPLETED: { label: "Completed", tone: "dim" },
  CANCELLED: { label: "Cancelled", tone: "red" },
};

/** Demo requests this account submitted while signed in, with the status the team has set. */
export function DemoRequestsSection() {
  const [items, setItems] = useState<MyDemoRequest[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setItems(null);
    try {
      setItems(await adoptionAccount.demoRequests());
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section aria-labelledby="demos" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 id="demos" style={sectionTitle}>My demo requests</h2>
        <Link href="/adoption/book-demo" className={`${focusRing} ${primaryHover}`} style={smallBtn}>Book a New Demo</Link>
      </div>
      {error ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ErrorBox>We couldn&apos;t load your demo requests. {error}</ErrorBox>
          <button type="button" onClick={load} className={`${focusRing} ${secondaryHover}`} style={smallSecondary}>Try again</button>
        </div>
      ) : !items ? (
        <SkeletonList count={2} height={84} />
      ) : items.length === 0 ? (
        <div style={{ ...card, ...muted }}>You haven&apos;t requested a demo yet. Book one and it will show up here with its status.</div>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((r) => (
            <li key={r.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <strong style={{ fontSize: 15, fontWeight: 600, color: "#f4f6f8" }}>{r.tools.map((t) => PRODUCT_NAMES[t] ?? t).join(", ")}</strong>
                <Badge label={STATUS[r.status].label} tone={STATUS[r.status].tone} />
              </div>
              {r.customRequirement && <p style={muted}>Custom tool: {r.customRequirement}</p>}
              <p style={{ margin: 0, fontSize: 13, color: "#8a939e" }}>
                Submitted {fmtDate(r.createdAt)}
                {r.status === "SCHEDULED" && r.scheduledAt && <span style={{ color: "#8fe9f2" }}> · Demo on {fmtDateTime(r.scheduledAt)}</span>}
                {r.status === "COMPLETED" && r.scheduledAt && <> · Held on {fmtDate(r.scheduledAt)}</>}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p style={{ margin: 0, fontSize: 12.5, color: "#8a939e" }}>Only requests sent while signed in to this account are listed here.</p>
    </section>
  );
}
