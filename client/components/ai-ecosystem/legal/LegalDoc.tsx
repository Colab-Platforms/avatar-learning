// Adoption-owned layout for the AI Adoption legal pages (/adoption/privacy-policy,
// /adoption/terms-and-conditions). Dark site theme, site navbar + footer.
// Deliberately independent of the Avatar Learning legal pages in app/(legal):
// nothing here imports from them, and nothing there depends on this.
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { EcosystemHeader } from "@/components/ai-ecosystem/EcosystemHeader";
import { EcosystemFooter } from "@/components/ai-ecosystem/EcosystemFooter";

const C = {
  bg: "#07080b",
  card: "#0c0e13",
  inset: "rgba(255,255,255,.025)",
  line: "rgba(255,255,255,.08)",
  ink: "#f4f6f8",
  body: "#a3abb5",
  dim: "#8a939e",
  cyan: "#6fe3ef",
};

/* ---------- Text primitives used by the policy content files ---------- */

export function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0 }}>{children}</p>;
}

export function B({ children }: { children: React.ReactNode }) {
  return <strong style={{ fontWeight: 600, color: "#e6eaee" }}>{children}</strong>;
}

export function UL({ items }: { items: React.ReactNode[] }) {
  return (
    // listStyle set explicitly: the global CSS reset removes list markers.
    <ul className="marker:text-[#6fe3ef]" style={{ margin: 0, paddingLeft: 20, listStyle: "disc", display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((it, i) => (
        <li key={i} style={{ paddingLeft: 4 }}>
          {it}
        </li>
      ))}
    </ul>
  );
}

export function TermGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[640px]:grid-cols-2" style={{ margin: "4px 0" }}>
      {items.map(([k, v]) => (
        <div key={k} style={{ borderRadius: 14, border: `1px solid ${C.line}`, background: C.inset, padding: 16 }}>
          {/* Capitalised like the published policy ("Identity Data"). */}
          <h3 style={{ margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: C.ink, textTransform: "capitalize" }}>
            <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: C.cyan, flex: "none" }} />
            {k}
          </h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: C.body }}>{v}</p>
        </div>
      ))}
    </div>
  );
}

export interface ContactRow {
  label: string;
  value: string;
  href?: string;
}

export function ContactCard({ title, rows }: { title: string; rows: ContactRow[] }) {
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${C.line}`, background: C.inset, padding: 18 }}>
      <p style={{ margin: "0 0 12px", fontFamily: "var(--font-geist-mono),ui-monospace,monospace", fontSize: 11.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: C.cyan }}>
        {title}
      </p>
      <dl style={{ margin: 0, display: "grid", gap: 8, fontSize: 14 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px" }}>
            <dt style={{ color: C.dim, minWidth: 110 }}>{r.label}</dt>
            <dd style={{ margin: 0, color: C.ink, fontWeight: 500, minWidth: 0, overflowWrap: "anywhere" }}>
              {r.href ? (
                <a href={r.href} style={{ color: C.cyan, textDecoration: "none" }}>
                  {r.value}
                </a>
              ) : (
                r.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ---------- Page frame ---------- */

export interface LegalSection {
  title: string;
  body: React.ReactNode;
}

export interface LegalDocProps {
  /** Breadcrumb + H1 text. */
  title: string;
  subtitle: string;
  /** Policy metadata, copied unchanged from the governing document. */
  meta: ContactRow[];
  sections: LegalSection[];
  /** Closing note card. */
  note: { title: string; body: React.ReactNode };
}

/** Full AI Adoption legal page: site navbar, breadcrumb, heading, metadata card, numbered sections, site footer. */
export function LegalDoc({ title, subtitle, meta, sections, note }: LegalDocProps) {
  return (
    <div
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{
        position: "relative",
        zIndex: 0,
        minHeight: "100vh",
        background: C.bg,
        color: C.ink,
        overflowX: "clip",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <EcosystemHeader />
      <main style={{ position: "relative", padding: "var(--ad-page-top) var(--ad-gutter) var(--ad-section-y)" }}>
        {/* Same faint grid + soft cyan light as the About page. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px)",
            backgroundSize: "64px 64px",
            WebkitMaskImage: "radial-gradient(ellipse 80% 40% at 50% 0%,#000 30%,transparent 80%)",
            maskImage: "radial-gradient(ellipse 80% 40% at 50% 0%,#000 30%,transparent 80%)",
          }}
        />
        <div aria-hidden="true" style={{ position: "absolute", right: "-10%", top: -80, width: "55%", height: 520, pointerEvents: "none", background: "radial-gradient(closest-side,rgba(64,150,165,.12),transparent)" }} />

        <div style={{ position: "relative", maxWidth: 880, margin: "0 auto" }}>
          <nav aria-label="Breadcrumb" style={{ fontSize: 14 }}>
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", gap: 10, alignItems: "center", color: C.dim }}>
              <li>
                <Link href="/" className="transition-colors hover:text-white" style={{ color: C.body, textDecoration: "none" }}>
                  Home
                </Link>
              </li>
              <li aria-hidden="true" style={{ color: "#5c646e" }}>
                /
              </li>
              <li aria-current="page" style={{ color: C.ink }}>
                {title}
              </li>
            </ol>
          </nav>

          <h1 style={{ margin: "clamp(20px,3vw,28px) 0 0", fontSize: "clamp(34px,5vw,56px)", lineHeight: 1.06, letterSpacing: "-0.035em", fontWeight: 600, color: C.ink }}>
            {title}
          </h1>
          <p style={{ margin: "14px 0 0", maxWidth: 620, fontSize: "clamp(15.5px,1.3vw,17.5px)", lineHeight: 1.65, color: C.body }}>{subtitle}</p>

          {/* Metadata card */}
          <dl
            className="grid grid-cols-1 gap-x-6 gap-y-5 min-[420px]:grid-cols-2 min-[640px]:grid-cols-3"
            style={{ margin: "clamp(28px,4vw,40px) 0 0", padding: "clamp(18px,2.6vw,24px)", borderRadius: 20, border: `1px solid ${C.line}`, background: C.card }}
          >
            {meta.map((m) => (
              <div key={m.label} style={{ minWidth: 0 }}>
                <dt style={{ fontFamily: "var(--font-geist-mono),ui-monospace,monospace", fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: C.dim }}>{m.label}</dt>
                <dd style={{ margin: "6px 0 0", fontSize: 14.5, fontWeight: 600, color: C.ink, overflowWrap: "break-word" }}>
                  {m.href ? (
                    <a href={m.href} style={{ color: C.cyan, textDecoration: "none" }}>
                      {m.value}
                    </a>
                  ) : (
                    m.value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {/* Sections */}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {sections.map((s, i) => (
              <section
                key={s.title}
                aria-labelledby={`legal-s${i + 1}`}
                style={{ borderRadius: 20, border: `1px solid ${C.line}`, background: C.card, padding: "clamp(20px,3vw,32px)" }}
              >
                <h2 id={`legal-s${i + 1}`} style={{ margin: "0 0 16px", display: "flex", gap: 12, alignItems: "baseline", fontSize: "clamp(18px,1.7vw,21px)", lineHeight: 1.3, fontWeight: 600, letterSpacing: "-0.01em", color: C.ink }}>
                  <span style={{ fontFamily: "var(--font-geist-mono),ui-monospace,monospace", fontSize: "0.72em", fontWeight: 500, color: C.cyan, flex: "none" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>{s.title}</span>
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 15, lineHeight: 1.75, color: C.body }}>{s.body}</div>
              </section>
            ))}

            <div style={{ borderRadius: 20, border: "1px solid rgba(111,227,239,.25)", background: "linear-gradient(180deg,rgba(111,227,239,.06),rgba(111,227,239,.02))", padding: "clamp(20px,3vw,28px)" }}>
              <p style={{ margin: "0 0 10px", fontFamily: "var(--font-geist-mono),ui-monospace,monospace", fontSize: 11.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: C.cyan }}>{note.title}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14.5, lineHeight: 1.7, color: C.body }}>{note.body}</div>
            </div>
          </div>
        </div>
      </main>
      <EcosystemFooter />
    </div>
  );
}
