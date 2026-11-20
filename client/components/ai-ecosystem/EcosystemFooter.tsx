import Link from "next/link";
import { ADOPTION_SOCIAL_LINKS, COMPANY, CONTACT, FOOTER_COMPANY, FOOTER_PRODUCTS } from "./data";

// Social icons (inline SVGs, 14–16px, drawn in currentColor).
const SOCIAL_ICONS: Record<(typeof ADOPTION_SOCIAL_LINKS)[number]["platform"], React.ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M23.5 6.2a3.01 3.01 0 0 0-2.12-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.57A3.01 3.01 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3.01 3.01 0 0 0 2.12 2.13C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.57a3.01 3.01 0 0 0 2.12-2.13C24 15.9 24 12 24 12s0-3.9-.5-5.8z M9.5 15.5V8.5L15.8 12L9.5 15.5Z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
};

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
    <footer data-screen-label="10 Footer" style={{ position: "relative", overflow: "hidden", borderTop: "1px solid rgba(255,255,255,.06)", padding: "64px var(--ad-gutter) 32px" }}>
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
            {/* Social icons (this page's footer only) */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
              {ADOPTION_SOCIAL_LINKS.map((link) => {
                return (
                  <a
                    key={link.platform}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${link.label} (opens in a new tab)`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[#a3abb5] transition-colors duration-200 hover:border-[#6fe3ef]/40 hover:bg-[#6fe3ef]/[0.08] hover:text-[#6fe3ef] focus-visible:border-[#6fe3ef]/60 focus-visible:text-[#6fe3ef] focus-visible:outline-none"
                  >
                    {SOCIAL_ICONS[link.platform]}
                  </a>
                );
              })}
            </div>
          </div>

          <nav aria-label="Our solutions" style={columnStyle}>
            <strong style={headingStyle}>Our Solutions</strong>
            {FOOTER_PRODUCTS.map((p) => (
              <a key={p} href="/tools" style={linkStyle}>
                {p}
              </a>
            ))}
          </nav>

          <nav aria-label="Explore" style={columnStyle}>
            <strong style={headingStyle}>Explore</strong>
            {FOOTER_COMPANY.map((c) =>
              c.href.startsWith("#") || c.href.startsWith("/#") ? ( // homepage sections: plain links (the homepage intercepts /#contact to open the demo form)
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
