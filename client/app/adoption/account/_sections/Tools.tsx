"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adoptionTools, type AdoptionTool, type ToolStatus } from "@/lib/adoptionSession";
import { ErrorBox, errorMessage, focusRing, primaryHover, secondaryHover } from "../../_components/ui";
import { Badge, SkeletonList, Notice, card, fmtDate, muted, sectionTitle, smallBtn, smallSecondary, type Tone } from "./shared";

const STATUS: Record<ToolStatus, { label: string; tone: Tone; note?: string }> = {
  ACTIVE: { label: "Active", tone: "cyan" },
  PENDING_SETUP: { label: "Pending setup", tone: "amber", note: "Our team is setting this up for you." },
  SUSPENDED: { label: "Suspended", tone: "red", note: "Access is paused. Please contact support." },
  EXPIRED: { label: "Expired", tone: "grey", note: "Your access has ended. Contact us to renew." },
  NO_ACCESS: { label: "Not activated", tone: "dim" },
};

/** All eight tools with their real status from the backend; opening a tool is authorised server-side each time. */
export function ToolsSection() {
  const [tools, setTools] = useState<AdoptionTool[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toolError, setToolError] = useState<{ product: string; message: string } | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    setTools(null);
    try {
      setTools(await adoptionTools.list());
    } catch (e) {
      setLoadError(errorMessage(e)); // an API failure is an error, never "no tools"
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const open = async (t: AdoptionTool) => {
    setBusy(t.product);
    setToolError(null);
    try {
      window.open(await adoptionTools.open(t.product), "_blank", "noopener,noreferrer");
    } catch (e) {
      setToolError({ product: t.product, message: errorMessage(e) });
      void load(); // status may have changed (revoked / expired)
    } finally {
      setBusy(null);
    }
  };
  const request = async (t: AdoptionTool) => {
    setBusy(t.product);
    setToolError(null);
    setNotice("");
    try {
      setTools(await adoptionTools.requestAccess(t.product));
      setNotice(`Access request for ${t.name} sent. Our team will contact you.`);
    } catch (e) {
      setToolError({ product: t.product, message: errorMessage(e) });
    } finally {
      setBusy(null);
    }
  };

  const inlineError = (product: string) =>
    toolError?.product === product ? <p role="alert" style={{ margin: 0, fontSize: 13, color: "#ff8a8a" }}>{toolError.message}</p> : null;

  if (loadError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <ErrorBox>We couldn&apos;t load your tools. {loadError}</ErrorBox>
        <button type="button" onClick={load} className={`${focusRing} ${secondaryHover}`} style={smallSecondary}>Try again</button>
      </div>
    );
  }
  if (!tools) return <SkeletonList count={3} />;

  const assigned = tools.filter((t) => t.status !== "NO_ACCESS");
  const available = tools.filter((t) => t.status === "NO_ACCESS");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {notice && <Notice>{notice}</Notice>}
      <section aria-labelledby="mytools" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="mytools" style={sectionTitle}>Your tools</h2>
        {assigned.length === 0 ? (
          <div style={{ ...card, ...muted }}>
            No tools are active on your account yet. Our team sets up access for your business — request a tool or book a demo below.
            <Link href="/book-demo" className={`${focusRing} ${primaryHover}`} style={smallBtn}>Book a Demo</Link>
          </div>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
            {assigned.map((t) => (
              <li key={t.product} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 16, fontWeight: 600, color: "#f4f6f8" }}>{t.name}</strong>
                  <Badge label={STATUS[t.status].label} tone={STATUS[t.status].tone} />
                </div>
                <p style={muted}>{t.description}</p>
                {t.expiresAt && <p style={{ margin: 0, fontSize: 12.5, color: "#8a939e" }}>{t.status === "EXPIRED" ? "Expired" : "Access until"} {fmtDate(t.expiresAt)}</p>}
                {t.status === "ACTIVE" ? (
                  t.configured ? (
                    <button type="button" onClick={() => open(t)} disabled={busy === t.product} aria-busy={busy === t.product} className={`${focusRing} ${primaryHover}`} style={smallBtn}>
                      {busy === t.product ? "Opening…" : "Open Tool"}
                    </button>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12.5, color: "#e6d58f" }}>Your access is active. Our team will share the login link for this tool.</p>
                  )
                ) : (
                  <p style={{ margin: 0, fontSize: 12.5, color: "#8a939e" }}>{STATUS[t.status].note}</p>
                )}
                {inlineError(t.product)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {available.length > 0 && (
        <section aria-labelledby="moretools" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 id="moretools" style={sectionTitle}>Not activated</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {available.map((t) => (
              <li key={t.product} style={{ ...card, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", padding: "12px 14px" }}>
                <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14.5, color: "#f4f6f8", fontWeight: 500 }}>{t.name}</span>
                    <Badge label="Not activated" tone="dim" />
                  </div>
                  <div style={{ fontSize: 13, color: "#8a939e", lineHeight: 1.45, marginTop: 2 }}>{t.description}</div>
                  {inlineError(t.product)}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <Link href={`/book-demo?tools=${t.product}`} className={`${focusRing} ${secondaryHover}`} style={smallSecondary}>Request demo</Link>
                  {t.requestedAt ? (
                    <span style={{ fontSize: 13, color: "#e6d58f", whiteSpace: "nowrap" }}>Access requested {fmtDate(t.requestedAt)}</span>
                  ) : (
                    <button type="button" onClick={() => request(t)} disabled={busy === t.product} aria-busy={busy === t.product} className={`${focusRing} ${secondaryHover}`} style={smallSecondary}>
                      {busy === t.product ? "Sending…" : "Request access"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
