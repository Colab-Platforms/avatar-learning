"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { CONTACT } from "./data";
import styles from "./ecosystem.module.css";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "0px 0px 120px 0px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

const fieldStyle: React.CSSProperties = {
  height: 48,
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.03)",
  color: "#f4f6f8",
  padding: "0 14px",
  fontSize: 15,
  outline: "none",
  transition: "border-color .2s, box-shadow .2s",
};

const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "#a3abb5" };

const CONTACT_LINKS = [
  { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { label: "Phone", value: CONTACT.phone, href: `tel:+${CONTACT.phone.replace(/\D/g, "")}` },
  { label: "WhatsApp", value: CONTACT.whatsapp, href: `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}` },
];

function onFocusGlow(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "#6fe3ef";
  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(111,227,239,.12)";
}
function onBlurGlow(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "rgba(255,255,255,.1)";
  e.currentTarget.style.boxShadow = "none";
}

export function BookDemoSection() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="contact" data-screen-label="09 Get in touch" style={{ scrollMarginTop: 68, position: "relative", overflowX: "clip", overflowY: "visible", padding: "clamp(56px,7vw,96px) 24px" }}>
      <div
        className={styles.breathe}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -200,
          top: "10%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(107,124,255,.14),transparent 60%)",
          pointerEvents: "none",
          animationDuration: "8s",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))",
          gap: "clamp(40px,6vw,72px)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <motion.div
            {...reveal(0)}
            style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
            Get in touch
          </motion.div>
          <motion.h2
            {...reveal(80)}
            style={{ margin: 0, fontSize: "clamp(34px,4.8vw,58px)", lineHeight: 1.04, letterSpacing: "-0.04em", fontWeight: 600, textWrap: "balance", background: "linear-gradient(180deg,#fff 40%,#8e98a4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          >
            Let&apos;s talk about your business
          </motion.h2>
          <motion.p {...reveal(160)} style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "#a3abb5" }}>
            Tell us what you&apos;d like to improve. We&apos;ll get back to you shortly.
          </motion.p>
          <motion.div {...reveal(240)} style={{ display: "flex", flexDirection: "column", marginTop: 8, borderTop: "1px solid rgba(255,255,255,.08)" }}>
            {CONTACT_LINKS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.label === "WhatsApp" ? "_blank" : undefined}
                rel={c.label === "WhatsApp" ? "noopener" : undefined}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 4px", borderBottom: "1px solid rgba(255,255,255,.08)", color: "#f4f6f8" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#f4f6f8")}
              >
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 12, color: "#98a1ac" }}>{c.label}</span>
                  {c.value}
                </span>
                <span style={{ color: "#6fe3ef" }}>↗</span>
              </a>
            ))}
          </motion.div>
        </div>

        <motion.div
          {...reveal(0)}
          style={{ borderRadius: 24, padding: 1, background: "linear-gradient(180deg,rgba(143,233,242,.4),rgba(255,255,255,.06) 50%)" }}
        >
          <div style={{ borderRadius: 23, background: "#0b0d12", padding: "clamp(24px,3.5vw,40px)", height: "100%", boxSizing: "border-box" }}>
            {!sent ? (
              <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 16 }}>
                <label style={labelStyle}>
                  Name
                  <input required type="text" placeholder="Your name" style={fieldStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
                </label>
                <label style={labelStyle}>
                  <span>
                    Company <span style={{ color: "#8a939e" }}>(optional)</span>
                  </span>
                  <input type="text" placeholder="Company name" style={fieldStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
                </label>
                <label style={labelStyle}>
                  Work email
                  <input required type="email" placeholder="you@company.com" style={fieldStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
                </label>
                <label style={labelStyle}>
                  <span>
                    Phone <span style={{ color: "#8a939e" }}>(optional)</span>
                  </span>
                  <input type="tel" placeholder="+91" style={fieldStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
                </label>
                <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
                  How can we help?
                  <textarea
                    data-contact-message
                    rows={4}
                    placeholder="Tell us a little about your business"
                    style={{ ...fieldStyle, height: "auto", padding: "12px 14px", resize: "vertical" }}
                    onFocus={onFocusGlow}
                    onBlur={onBlurGlow}
                  />
                </label>
                <button
                  type="submit"
                  style={{ gridColumn: "1 / -1", cursor: "pointer", height: 52, border: 0, borderRadius: 999, background: "#f4f6f8", color: "#07080b", fontSize: 15, fontWeight: 500, transition: "box-shadow .3s" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.boxShadow = "0 0 32px rgba(111,227,239,.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f4f6f8";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Send message
                </button>
                <p style={{ gridColumn: "1 / -1", margin: "-4px 0 0", textAlign: "center", fontSize: 13, color: "#98a1ac" }}>
                  We reply within 1 business day.
                </p>
              </form>
            ) : (
              <div className={styles.fadeIn} style={{ minHeight: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 14 }}>
                <div className={styles.glow} style={{ width: 56, height: 56, borderRadius: "50%", border: "1px solid rgba(111,227,239,.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8fe9f2", fontSize: 22 }}>
                  ✓
                </div>
                <strong style={{ fontSize: 22, fontWeight: 600, color: "#f4f6f8" }}>Thanks, we&apos;ve got your message</strong>
                <span style={{ color: "#a3abb5" }}>Our team will be in touch shortly.</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
