"use client";

import { primaryBtn, secondaryBtn } from "../../_components/ui";

// Small building blocks shared by the My Account sections.

export const card: React.CSSProperties = { borderRadius: 16, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)", padding: 18, display: "flex", flexDirection: "column", gap: 10 };
export const sectionTitle: React.CSSProperties = { margin: 0, fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", color: "#8a939e", fontWeight: 500 };
export const smallBtn: React.CSSProperties = { ...primaryBtn, height: 38, fontSize: 14, width: "auto", padding: "0 18px", alignSelf: "flex-start" };
export const smallSecondary: React.CSSProperties = { ...secondaryBtn, height: 38, fontSize: 14, width: "auto", padding: "0 16px", alignSelf: "flex-start" };
export const muted: React.CSSProperties = { margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "#a3abb5" };

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export const PRODUCT_NAMES: Record<string, string> = {
  CRM: "CRM",
  OMS: "OMS",
  SCRIPT_AUTOMATION: "Script Automation",
  LMS: "LMS",
  RECRUITMENT_CRM: "Recruitment CRM",
  HRMS: "HRMS",
  IMS: "IMS",
  CUSTOM: "Custom Tools",
};

export type Tone = "cyan" | "amber" | "red" | "grey" | "dim";
const TONES: Record<Tone, { color: string; bg: string; border: string }> = {
  cyan: { color: "#8fe9f2", bg: "rgba(111,227,239,.08)", border: "rgba(111,227,239,.3)" },
  amber: { color: "#e6d58f", bg: "rgba(230,213,143,.07)", border: "rgba(230,213,143,.28)" },
  red: { color: "#ff8a8a", bg: "rgba(255,138,138,.07)", border: "rgba(255,138,138,.28)" },
  grey: { color: "#a3abb5", bg: "rgba(255,255,255,.04)", border: "rgba(255,255,255,.14)" },
  dim: { color: "#8a939e", bg: "transparent", border: "rgba(255,255,255,.1)" },
};

export function Badge({ label, tone }: { label: string; tone: Tone }) {
  const s = TONES[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500, color: s.color, background: s.bg, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
      {label}
    </span>
  );
}

export function SkeletonList({ count = 2, height = 96 }: { count?: number; height?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse" style={{ ...card, height }} />
      ))}
    </div>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return <p role="status" style={{ margin: 0, fontSize: 14, color: "#8fe9f2" }}>{children}</p>;
}
