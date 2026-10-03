"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { CONTACT } from "./data";
import styles from "./ecosystem.module.css";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.03)",
  padding: "14px 16px",
  fontSize: 15,
  color: "#f4f6f8",
  outline: "none",
};

const labelStyle: React.CSSProperties = { display: "block", marginBottom: 6, fontSize: 13, color: "#a3abb5" };

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

      <div style={{ position: "relative", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(32px,5vw,56px)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
          <motion.div
            {...reveal(0)}
            style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
            Get in touch
          </motion.div>
          <motion.h2
            {...reveal(80)}
            style={{ margin: 0, fontSize: "clamp(34px,4.8vw,58px)", lineHeight: 1.04, letterSpacing: "-0.04em", fontWeight: 600, background: "linear-gradient(180deg,#fff 40%,#8e98a4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          >
            Let&apos;s talk about your business
          </motion.h2>
        </div>

        <motion.div {...reveal(0)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 16 }}>
          {([
            ["Email", CONTACT.email, `mailto:${CONTACT.email}`],
            ["Phone", CONTACT.phone, `tel:${CONTACT.phone.replace(/\s/g, "")}`],
            ["WhatsApp", CONTACT.whatsapp, `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`],
          ] as const).map(([label, value, href]) => (
            <a
              key={label}
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "20px 22px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.02)",
                color: "#f4f6f8",
              }}
            >
              <span style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#8a939e" }}>{label}</span>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 16, fontWeight: 500 }}>
                {value}
                <span style={{ color: "#8fe9f2" }}>↗</span>
              </span>
            </a>
          ))}
        </motion.div>

        <motion.div {...reveal(0)} style={{ borderRadius: 24, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)", padding: "clamp(24px,4vw,40px)" }}>
          {!sent ? (
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: 18 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input required type="text" style={fieldStyle} placeholder="Your name" />
              </div>
              <div>
                <label style={labelStyle}>Company (optional)</label>
                <input type="text" style={fieldStyle} placeholder="Company name" />
              </div>
              <div>
                <label style={labelStyle}>Work email</label>
                <input required type="email" style={fieldStyle} placeholder="you@company.com" />
              </div>
              <div>
                <label style={labelStyle}>Phone (optional)</label>
                <input type="tel" style={fieldStyle} placeholder="+91 00000 00000" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>How can we help?</label>
                <textarea data-contact-message rows={4} style={{ ...fieldStyle, resize: "none" }} placeholder="Tell us about your business..." />
              </div>
              <button
                type="submit"
                style={{ gridColumn: "1 / -1", cursor: "pointer", height: 52, border: 0, borderRadius: 999, background: "#f4f6f8", color: "#07080b", fontSize: 15, fontWeight: 500 }}
              >
                Send message
              </button>
              <p style={{ gridColumn: "1 / -1", margin: "-4px 0 0", textAlign: "center", fontSize: 13, color: "#98a1ac" }}>
                We reply within 1 business day.
              </p>
            </form>
          ) : (
            <div className={styles.fadeIn} style={{ minHeight: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 14 }}>
              <div className={styles.glow} style={{ width: 56, height: 56, borderRadius: "50%", border: "1px solid rgba(111,227,239,.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8fe9f2", fontSize: 22 }}>
                ✓
              </div>
              <strong style={{ fontSize: 22, fontWeight: 600, color: "#f4f6f8" }}>Thanks, we&apos;ve got your message</strong>
              <span style={{ color: "#a3abb5" }}>Our team will be in touch shortly.</span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
