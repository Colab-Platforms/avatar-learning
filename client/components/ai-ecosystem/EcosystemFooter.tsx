import Link from "next/link";
import { COMPANY, CONTACT, FOOTER_COMPANY, FOOTER_PRODUCTS } from "./data";

// Shared text styles (unchanged from the original footer).
const headingStyle: React.CSSProperties = { fontSize: 13, letterSpacing: ".04em", color: "#f4f6f8" };
const linkStyle: React.CSSProperties = { fontSize: 14, lineHeight: 1.45, color: "#a3abb5" };
const labelStyle: React.CSSProperties = { fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", color: "#8a939e" };
const columnStyle: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12, minWidth: 0 };

/** One grid for the link columns and the corporate row, so both line up:
 * 1 column on phones, 2 on tablets, 4 on desktop at 25 / 30 / 18 / 27
 * proportions (fr units share the space left after the gaps, so no overflow). */
const GRID = "grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-[25fr_30fr_18fr_27fr]";

export function EcosystemFooter() {
  return (
    <footer data-screen-label="10 Footer" style={{ position: "relative", overflow: "hidden", borderTop: "1px solid rgba(255,255,255,.06)", padding: "64px 24px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
        {/* Row 1: brand + three link columns */}
        <div className={GRID}>
          <div style={{ ...columnStyle, gap: 0 }}>
            {/* Two-line text wordmark: AVATAR / INDUSTRIES LIMITED */}
            <p style={{ margin: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
              <span style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, letterSpacing: "0.06em", color: "#f4f6f8" }}>AVATAR</span>
              <span style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2, letterSpacing: "0.24em", color: "#a3abb5" }}>INDUSTRIES LIMITED</span>
            </p>
            {/* heading → former name 16px, former name → tagline 8px */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, marginTop: 16 }}>
              <span style={{ fontSize: 12, color: "#8a939e", lineHeight: 1.5 }}>{COMPANY.formerly}</span>
              <span style={{ fontSize: 14, color: "#a3abb5", lineHeight: 1.5 }}>AI adoption for growing businesses.</span>
            </div>
          </div>

          <nav aria-label="Our solutions" style={columnStyle}>
            <strong style={headingStyle}>Our Solutions</strong>
            {FOOTER_PRODUCTS.map((p) => (
              <a key={p} href="#products" style={linkStyle}>
                {p}
              </a>
            ))}
          </nav>

          <nav aria-label="Explore" style={columnStyle}>
            <strong style={headingStyle}>Explore</strong>
            {FOOTER_COMPANY.map((c) =>
              c.href.startsWith("#") ? (
                <a key={c.label} href={c.href} style={linkStyle}>
                  {c.label}
                </a>
              ) : (
                <Link key={c.label} href={c.href} style={linkStyle}>
                  {c.label}
                </Link>
              )
            )}
          </nav>

          <div style={columnStyle}>
            <strong style={headingStyle}>Get in Touch</strong>
            <a href={`mailto:${CONTACT.email}`} style={{ ...linkStyle, overflowWrap: "anywhere" }}>
              {CONTACT.email}
            </a>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} style={{ ...linkStyle, whiteSpace: "nowrap" }}>
              {CONTACT.phone}
            </a>
            <span style={linkStyle}>
              <span style={{ color: "#8a939e" }}>WhatsApp: </span>
              <a href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" style={{ color: "#a3abb5", whiteSpace: "nowrap" }}>
                {CONTACT.whatsapp}
              </a>
            </span>
          </div>
        </div>

        {/* Row 2: legal details (CIN under the brand column, office address beside it) */}
        <dl className={GRID} style={{ margin: 0, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,.06)", fontSize: 14, lineHeight: 1.55 }}>
          <div>
            <dt style={labelStyle}>CIN</dt>
            <dd style={{ margin: "2px 0 0", color: "#a3abb5", fontFamily: "var(--font-geist-mono),monospace", overflowWrap: "anywhere" }}>{COMPANY.cin}</dd>
          </div>
          <div className="lg:col-span-3">
            <dt style={labelStyle}>Registered Office</dt>
            <dd style={{ margin: "2px 0 0", color: "#a3abb5" }}>{COMPANY.registeredOffice}</dd>
          </div>
        </dl>

        <div
          aria-hidden="true"
          style={{
            fontSize: "clamp(80px,17vw,220px)",
            fontWeight: 600,
            letterSpacing: "-0.06em",
            lineHeight: 0.8,
            // The gradient fades to fully transparent at 85% of the 0.8em line
            // box, so the box below that point is invisible empty space. Trim
            // the box to 0.68em and keep the gradient sized to the original
            // 0.8em so the wordmark looks exactly the same.
            height: "0.68em",
            overflow: "hidden",
            textAlign: "center",
            background: "linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,0) 85%) 0 0 / 100% 0.8em no-repeat",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            userSelect: "none",
          }}
        >
          Avatar
        </div>

        {/* Row 3: copyright + legal links */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px 24px",
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,.06)",
            fontSize: 13,
            color: "#8a939e",
          }}
        >
          <span>
            &copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </span>
          <span>
            <a href="/privacy-policy" style={{ color: "#8a939e" }}>
              Privacy Policy
            </a>
            <span aria-hidden="true" style={{ margin: "0 10px", color: "rgba(255,255,255,.18)" }}>|</span>
            <a href="/terms-and-conditions" style={{ color: "#8a939e" }}>
              Terms &amp; Conditions
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
