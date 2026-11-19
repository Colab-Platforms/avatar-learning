"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { CONTACT } from "./data";
import { DemoRequestForm, toolSlugs } from "./DemoRequestForm";
import styles from "./ecosystem.module.css";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "0px 0px 120px 0px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

const CONTACT_LINKS = [
  { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { label: "Phone", value: CONTACT.phone, href: `tel:+${CONTACT.phone.replace(/\D/g, "")}` },
  { label: "WhatsApp", value: CONTACT.whatsapp, href: `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}` },
];


/** Scroll the demo form card into view and put the cursor in its first field. */
export function openDemoForm(tools?: string[]) {
  const card = document.getElementById("demo-form");
  if (!card) return false;
  if (tools?.length) window.dispatchEvent(new CustomEvent("avatar:demo-tools", { detail: toolSlugs(tools) }));
  const header = document.querySelector("nav");
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The card fades in sliding up (a translateY), so aim at where it ends up.
  const target = () => {
    const shift = new DOMMatrixReadOnly(getComputedStyle(card).transform).m42;
    return Math.max(card.getBoundingClientRect().top - shift + window.scrollY - ((header?.getBoundingClientRect().height ?? 0) + 8), 0);
  };
  window.scrollTo({ top: target(), behavior: smooth ? "smooth" : "auto" });
  window.setTimeout(() => {
    const t = target();
    if (Math.abs(t - window.scrollY) > 4) window.scrollTo({ top: t, behavior: smooth ? "smooth" : "auto" });
    window.setTimeout(() => card.querySelector<HTMLInputElement>("form input")?.focus({ preventScroll: true }), smooth ? 350 : 0);
  }, smooth ? 800 : 0);
  return true;
}

export function BookDemoSection() {
  // Every "#contact" call-to-action on the page (hero, sections, floating "Book a call",
  // footer) opens the actual form. Buttons with data-demo-tools also tick those tools.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.<HTMLElement>('a[href="#contact"], [data-demo-tools]');
      if (!a) return;
      const tools = a.dataset.demoTools?.split(",").filter(Boolean);
      if (openDemoForm(tools)) e.preventDefault();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

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
          id="demo-form"
          {...reveal(0)}
          style={{ scrollMarginTop: 76, borderRadius: 24, padding: 1, background: "linear-gradient(180deg,rgba(143,233,242,.4),rgba(255,255,255,.06) 50%)" }}
        >
          <div style={{ borderRadius: 23, background: "#0b0d12", padding: "clamp(24px,3.5vw,40px)", height: "100%", boxSizing: "border-box" }}>
            <DemoRequestForm />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
