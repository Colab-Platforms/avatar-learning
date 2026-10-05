import Image from "next/image";
import { CONTACT, FOOTER_COMPANY, FOOTER_PRODUCTS } from "./data";

export function EcosystemFooter() {
  return (
    <footer data-screen-label="10 Footer" style={{ position: "relative", overflow: "hidden", borderTop: "1px solid rgba(255,255,255,.06)", padding: "64px 24px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 48 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))", gap: 36 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
            <Image
              src="/landingpage-images/Avatar_logo_Light.svg"
              alt="Avatar"
              width={110}
              height={26}
              style={{ display: "block", height: 26, width: "auto", margin: 0 }}
            />
            <span style={{ fontSize: 14, color: "#a3abb5", maxWidth: 220, lineHeight: 1.5 }}>AI adoption for growing businesses.</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <strong style={{ fontSize: 13, letterSpacing: ".04em", color: "#f4f6f8" }}>Products</strong>
            {FOOTER_PRODUCTS.map((p) => (
              <a key={p} href="#products" style={{ fontSize: 14, color: "#a3abb5" }}>
                {p}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <strong style={{ fontSize: 13, letterSpacing: ".04em", color: "#f4f6f8" }}>Company</strong>
            {FOOTER_COMPANY.map((c) => (
              <a key={c.label} href={c.href} style={{ fontSize: 14, color: "#a3abb5" }}>
                {c.label}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <strong style={{ fontSize: 13, letterSpacing: ".04em", color: "#f4f6f8" }}>Contact</strong>
            <a href={`mailto:${CONTACT.email}`} style={{ fontSize: 14, color: "#a3abb5" }}>
              {CONTACT.email}
            </a>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} style={{ fontSize: 14, color: "#a3abb5" }}>
              {CONTACT.phone}
            </a>
            <a href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`} style={{ fontSize: 14, color: "#a3abb5" }}>
              WhatsApp {CONTACT.whatsapp}
            </a>
            <span style={{ fontSize: 14, color: "#a3abb5" }}>Office address</span>
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            fontSize: "clamp(80px,17vw,220px)",
            fontWeight: 600,
            letterSpacing: "-0.06em",
            lineHeight: 0.8,
            textAlign: "left",
            background: "linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,0) 85%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            userSelect: "none",
          }}
        >
          Avatar
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 12,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,.06)",
            fontSize: 13,
            color: "#8a939e",
          }}
        >
          <span>&copy; {new Date().getFullYear()} Avatar India. All rights reserved.</span>
          <span>
            <a href="/privacy-policy" style={{ color: "#8a939e" }}>
              Privacy
            </a>{" "}
            &middot;{" "}
            <a href="/terms-and-conditions" style={{ color: "#8a939e" }}>
              Terms
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
