"use client";

import Link from "next/link";
import type { Product } from "./data";
import { PRODUCTS } from "./data";
import styles from "./ecosystem.module.css";

/**
 * The detailed product presentation (number, category, heading, description,
 * feature badges, "Ask about …" CTA and the dashboard preview), moved here
 * unchanged from the homepage Tools section so /tools can reuse it.
 */

export function Dot({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ flex: "none", width: 18, height: 18, borderRadius: "50%", background: "rgba(111,227,239,.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
    </span>
  );
}

type KanbanCols = [string, { t: string; s: string; hot?: boolean }[]][];

/** Three-column pipeline board (used by CRM and Recruitment CRM). */
function KanbanMock({ cols }: { cols: KanbanCols }) {
  return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }} className={styles.fadeIn}>
        {cols.map(([label, cards]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#8a939e" }}>{label}</span>
            {cards.map((c) => (
              <div
                key={c.t}
                className={c.hot ? styles.floaty : undefined}
                style={{
                  borderRadius: 10,
                  border: c.hot ? "1px solid rgba(111,227,239,.35)" : "1px solid rgba(255,255,255,.07)",
                  background: c.hot ? "rgba(111,227,239,.06)" : "transparent",
                  padding: 10,
                  fontSize: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <strong style={{ fontWeight: 500 }}>{c.t}</strong>
                <span style={{ color: c.hot ? "#8fe9f2" : "#98a1ac" }}>{c.s}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
  );
}

/** Small table + progress bar (used by OMS, HRMS and IMS). */
function TableMock({ head, rows, firstCol = 72, bar }: { head: [string, string, string]; rows: [string, string, string][]; firstCol?: number; bar: { label: string; pct: number } }) {
  const cols = `${firstCol}px 1fr 1fr`;
  return (
    <div className={styles.fadeIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: cols, fontSize: 11, letterSpacing: ".08em", color: "#8a939e", fontFamily: "var(--font-geist-mono),monospace" }}>
        {head.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {rows.map((r) => (
        <div key={r[0]} style={{ display: "grid", gridTemplateColumns: cols, fontSize: 13, color: "#dfe4ea", borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 10 }}>
          <span>{r[0]}</span>
          <span>{r[1]}</span>
          <span style={{ color: "#8fe9f2" }}>{r[2]}</span>
        </div>
      ))}
      <div style={{ marginTop: 4 }}>
        <span style={{ fontSize: 12, color: "#a3abb5" }}>{bar.label}</span>
        <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,.06)", overflow: "hidden", marginTop: 6 }}>
          <div className={styles.fill} style={{ width: `${bar.pct}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#6b7cff,#6fe3ef)", transformOrigin: "0 50%" }} />
        </div>
      </div>
    </div>
  );
}

/** Dashboard preview for a product (shown in the product detail panel). */
export function ProductMock({ slug }: { slug: string }) {
  if (slug === "crm") {
    return (
      <KanbanMock
        cols={[
          ["New · 12", [{ t: "Sharma Textiles", s: "Website enquiry" }, { t: "Kiran Foods", s: "Referral" }]],
          ["Contacted · 7", [{ t: "Mehta Logistics", s: "Follow up today", hot: true }, { t: "Rao & Sons", s: "Demo booked" }]],
          ["Won · 4", [{ t: "Nair Retail", s: "Closed this week" }]],
        ]}
      />
    );
  }

  if (slug === "orders") {
    return (
      <TableMock
        head={["ORDER", "CITY", "STATUS"]}
        rows={[
          ["#2041", "Pune", "Delivered"],
          ["#2042", "Jaipur", "Shipped"],
          ["#2043", "Kochi", "Packed"],
        ]}
        bar={{ label: "Stock level · Cotton kurta", pct: 68 }}
      />
    );
  }

  if (slug === "recruitment") {
    return (
      <KanbanMock
        cols={[
          ["Applied · 18", [{ t: "Priya Menon", s: "Sales executive" }, { t: "Arjun Patel", s: "Accountant" }]],
          ["Interview · 6", [{ t: "Neha Kulkarni", s: "Interview today", hot: true }, { t: "Rahul Verma", s: "Round 2" }]],
          ["Offer · 2", [{ t: "Sneha Iyer", s: "Offer accepted" }]],
        ]}
      />
    );
  }

  if (slug === "hrms") {
    return (
      <TableMock
        head={["EMPLOYEE", "IN", "STATUS"]}
        firstCol={110}
        rows={[
          ["Anita Desai", "9:02", "Present"],
          ["Vikram Singh", "9:15", "Present"],
          ["Farah Khan", "—", "On leave"],
        ]}
        bar={{ label: "Attendance today · 46 of 50", pct: 92 }}
      />
    );
  }

  if (slug === "inventory") {
    return (
      <TableMock
        head={["ITEM", "STOCK", "STATUS"]}
        firstCol={110}
        rows={[
          ["Cotton kurta", "240", "In stock"],
          ["Silk saree", "18", "Low stock"],
          ["Linen shirt", "96", "In stock"],
        ]}
        bar={{ label: "Warehouse capacity · Mumbai", pct: 74 }}
      />
    );
  }

  if (slug === "script") {
    const steps: [string, string, boolean][] = [
      ["Send WhatsApp welcome", "Done", true],
      ["Assign to a sales rep", "Done", true],
      ["Schedule follow-up call", "Running", false],
    ];
    return (
      <div className={styles.fadeIn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 12, color: "#8a939e" }}>When a new enquiry arrives</span>
        {steps.map(([t, v, done]) => (
          <div key={t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13, borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 10 }}>
            <span style={{ color: "#dfe4ea" }}>{t}</span>
            <span className={done ? undefined : styles.blink} style={{ color: done ? "#8fe9f2" : "#a3abb5", fontSize: 12 }}>{v}</span>
          </div>
        ))}
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 12, color: "#a3abb5" }}>Tasks automated this week &middot; 128</span>
          <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,.06)", overflow: "hidden", marginTop: 6 }}>
            <div className={styles.fill} style={{ width: "80%", height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#6b7cff,#6fe3ef)", transformOrigin: "0 50%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (slug === "learning") {
    const courses: [string, string, boolean][] = [
      ["AI basics for sales teams", "Completed", true],
      ["Writing with AI", "64%", false],
      ["Using your new CRM", "20%", false],
    ];
    return (
      <div className={styles.fadeIn} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {courses.map(([t, v, done]) => (
          <div key={t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#dfe4ea" }}>{t}</span>
            <span style={{ color: done ? "#8fe9f2" : "#a3abb5", fontSize: 12 }}>{v}</span>
          </div>
        ))}
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#6b7cff,#6fe3ef)" }} />
          <span style={{ fontSize: 12, color: "#8fe9f2" }}>1 certificate earned</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fadeIn} style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#dfe4ea" }}>
        <span style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "#0c0e13" }}>Your process</span>
        <span style={{ color: "#6fe3ef" }}>→</span>
        <span style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(111,227,239,.5)", background: "#0f2329", color: "#bff5fa" }} className={styles.glow}>
          Avatar builds around it
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {["Custom tool", "Integrations", "Ongoing support"].map((t) => (
          <span key={t} style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,.12)", fontSize: 12, color: "#dfe4ea" }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/** The original homepage product panel, as a static block (used in the /tools popup). */
export function ProductDetailPanel({ product, index, titleId }: { product: Product; index: number; titleId?: string }) {
  return (
    <div className="pdp-root">
      <style>{PDP_CSS}</style>
      <div
        className={styles.breathe}
        aria-hidden="true"
        style={{ position: "absolute", left: "62%", top: "50%", width: 640, height: 640, margin: "-320px 0 0 -320px", borderRadius: "50%", background: "radial-gradient(circle,rgba(107,124,255,.18),transparent 60%)", pointerEvents: "none", animationDuration: "7s" }}
      />
      <div className="pdp-col pdp-text" style={{ position: "relative", padding: "clamp(24px,4vw,48px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, color: "#6fe3ef" }}>
            {String(index + 1).padStart(2, "0")} / {String(PRODUCTS.length).padStart(2, "0")}
            <span style={{ padding: "3px 9px", borderRadius: 999, border: "1px solid rgba(111,227,239,.3)", color: "#bff5fa", letterSpacing: ".04em" }}>
              {product.tag || product.name}
            </span>
          </span>
          <h2 id={titleId} style={{ margin: 0, fontSize: "clamp(30px,3.6vw,44px)", fontWeight: 600, letterSpacing: "-0.035em", textWrap: "balance", color: "#f4f6f8" }}>{product.plain}</h2>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "#a3abb5", maxWidth: 480 }}>{product.desc}</p>
          <div className="pdp-bullets">
            {product.bullets.map((b) => (
              <span
                key={b}
                className="pdp-bullet"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", fontSize: 14, color: "#dfe4ea", whiteSpace: "nowrap", boxSizing: "border-box" }}
              >
                <Dot label={b} color="#6fe3ef" />
                {b}
              </span>
            ))}
          </div>
          {/* "Ask about …": opens the Book a Demo form with this product pre-selected. */}
          <Link
            href={`/book-demo?tools=${product.slug}`}
            className="pdp-cta"
            style={{ alignSelf: "flex-start", marginTop: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#f4f6f8", color: "#07080b", padding: "15px 22px", borderRadius: 999, fontSize: 15, fontWeight: 500, boxShadow: "0 0 30px rgba(111,227,239,.25)", textDecoration: "none" }}
          >
            {product.cta}
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#07080b", color: "#8fe9f2", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>→</span>
          </Link>
        </div>
      </div>
      <div className="pdp-col" style={{ position: "relative", padding: "clamp(16px,3vw,36px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", borderRadius: 16, border: "1px solid rgba(255,255,255,.1)", background: "rgba(10,12,16,.85)", boxShadow: "0 30px 80px -20px rgba(0,0,0,.8)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
            <span style={{ marginLeft: 10, fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, color: "#8a939e" }}>avatar / {product.slug}</span>
          </div>
          <div className="pdp-preview" style={{ padding: 18, boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <ProductMock slug={product.slug} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Same proportions as the former homepage panel; stacks (text above preview) below 1024px (the popup is ~86% of the screen, too narrow for two columns on tablets).
const PDP_CSS = `
.pdp-root { position: relative; overflow: hidden; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); border-radius: 24px;
  background: linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01)), #0b0d12 }
.pdp-col { min-height: 500px }
.pdp-preview { height: 300px }
.pdp-bullets { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8px }
.pdp-bullet { padding: 7px 12px 7px 8px }
.pdp-cta:focus-visible { outline: 2px solid #6fe3ef; outline-offset: 3px }
@media (max-width: 1023px) {
  .pdp-root { grid-template-columns: minmax(0,1fr) }
  .pdp-col { min-height: 0 }
  .pdp-text { padding-top: 56px !important }
  .pdp-preview { height: auto; min-height: 220px }
  .pdp-bullets { flex-direction: column; align-items: stretch; gap: 10px }
  .pdp-bullet { width: 100%; padding: 10px 14px 10px 8px }
}
`;
