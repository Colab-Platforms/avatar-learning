"use client";

import { useEffect, useState } from "react";

export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("top");
    const contact = document.getElementById("contact");
    const onScroll = () => {
      if (!hero) return;
      const pastHero = hero.getBoundingClientRect().bottom < 0;
      // Hide once the contact section (and its own CTA/submit button) is on
      // screen — the floating pill would otherwise sit directly on top of it.
      const nearContact = contact ? contact.getBoundingClientRect().top < window.innerHeight * 0.85 : false;
      setVisible(pastHero && !nearContact);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 40,
        transform: visible ? "translateY(0)" : "translateY(140%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "transform .5s cubic-bezier(.2,.7,.1,1), opacity .4s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 10px 10px 18px",
          borderRadius: 999,
          background: "rgba(12,14,19,.92)",
          border: "1px solid rgba(255,255,255,.12)",
          boxShadow: "0 20px 50px rgba(0,0,0,.6)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span style={{ fontSize: 14, color: "#dfe4ea", whiteSpace: "nowrap" }} className="hidden sm:inline">
          Start your AI journey
        </span>
        <a
          href="#contact"
          style={{ flex: "none", display: "flex", alignItems: "center", height: 44, padding: "0 18px", borderRadius: 999, background: "#f4f6f8", color: "#07080b", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" }}
        >
          Book a call
        </a>
      </div>
    </div>
  );
}
