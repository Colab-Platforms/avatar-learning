"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS } from "./data";
import pillStyles from "../ui/hoverPill.module.css";

const PRODUCT_LINK = { label: "Avatar Learning", href: "/learning" };

function handlePillMouseMove(e: React.MouseEvent<HTMLElement>) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  el.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

function scrollToSection(id: string, headerEl: HTMLElement | null) {
  const target = document.getElementById(id);
  if (!target || !headerEl) return;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const offset = headerEl.getBoundingClientRect().height + 8;
  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(top, 0), behavior: prefersReducedMotion ? "auto" : "smooth" });
}

export function EcosystemHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 820);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const el = progressRef.current;
      if (!el) return;
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      el.style.transform = `scaleX(${Math.min(1, window.scrollY / max)})`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const onNavClick = useCallback(
    (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setMenuOpen(false);
      scrollToSection(href.slice(1), headerRef.current);
    },
    [],
  );

  return (
    <>
      <nav
        ref={headerRef}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(7,8,11,.72)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <a href="#top" aria-label="Avatar home" style={{ display: "flex", alignItems: "center" }}>
            <Image
              src="/landingpage-images/Avatar_logo_Light.svg"
              alt="Avatar"
              width={110}
              height={26}
              style={{ height: 26, width: "auto", display: "block" }}
              priority
            />
          </a>

          {isDesktop && (
            <div style={{ display: "flex", gap: 32, fontSize: 14 }}>
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={onNavClick(l.href)}
                  style={{ color: "#a3abb5" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#a3abb5")}
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isDesktop && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  padding: 3,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,.1)",
                  marginRight: 4,
                }}
              >
                <Link
                  href={PRODUCT_LINK.href}
                  className={pillStyles.hoverPill}
                  onMouseMove={handlePillMouseMove}
                  style={
                    {
                      display: "inline-flex",
                      alignItems: "center",
                      height: 36,
                      boxSizing: "border-box",
                      padding: "0 14px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#205A99",
                      background: "#ffffff",
                      "--pill-border": "rgba(255,255,255,0)",
                      "--pill-border-hover": "rgba(42,120,204,0.45)",
                      "--pill-ring": "rgba(111,227,239,0.3)",
                      "--pill-shadow": "rgba(32,90,153,0.22)",
                      "--pill-inner": "rgba(111,227,239,0.18)",
                      "--pill-sweep": "rgba(42,120,204,0.25)",
                      "--pill-cursor-glow": "rgba(111,227,239,0.4)",
                    } as React.CSSProperties
                  }
                >
                  <span className={pillStyles.hoverPillLabel}>{PRODUCT_LINK.label}</span>
                </Link>
              </div>
            )}
            <a
              href="#contact"
              onClick={onNavClick("#contact")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 44,
                boxSizing: "border-box",
                background: "#f4f6f8",
                color: "#07080b",
                padding: "0 18px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Get in touch
            </a>
            {!isDesktop && (
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Menu"
                aria-expanded={menuOpen}
                style={{
                  cursor: "pointer",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,.14)",
                  background: "rgba(255,255,255,.03)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  padding: 0,
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 1.5,
                    background: "#f4f6f8",
                    borderRadius: 2,
                    transition: "transform .3s",
                    transform: menuOpen ? "translateY(3.25px) rotate(45deg)" : "none",
                  }}
                />
                <span
                  style={{
                    width: 16,
                    height: 1.5,
                    background: "#f4f6f8",
                    borderRadius: 2,
                    transition: "transform .3s",
                    transform: menuOpen ? "translateY(-3.25px) rotate(-45deg)" : "none",
                  }}
                />
              </button>
            )}
          </div>
        </div>

        <div
          ref={progressRef}
          style={{
            position: "absolute",
            left: 0,
            bottom: -1,
            height: 1,
            width: "100%",
            transform: "scaleX(0)",
            transformOrigin: "0 50%",
            background: "linear-gradient(90deg,#6b7cff,#6fe3ef)",
            boxShadow: "0 0 8px #6fe3ef",
          }}
        />
      </nav>

      {menuOpen && !isDesktop && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            top: 68,
            bottom: 0,
            zIndex: 70,
            background: "rgba(7,8,11,.97)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            padding: "16px 24px 32px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {NAV_LINKS.map((m) => (
            <a
              key={m.label}
              href={m.href}
              onClick={onNavClick(m.href)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                minHeight: 60,
                borderBottom: "1px solid rgba(255,255,255,.08)",
                color: "#f4f6f8",
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              {m.label}
              <span style={{ color: "#6fe3ef", fontSize: 16 }}>→</span>
            </a>
          ))}
          <Link
            href={PRODUCT_LINK.href}
            onClick={() => setMenuOpen(false)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              minHeight: 60,
              borderBottom: "1px solid rgba(255,255,255,.08)",
              color: "#6fe3ef",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            {PRODUCT_LINK.label}
            <span style={{ color: "#6fe3ef", fontSize: 16 }}>→</span>
          </Link>
          <a
            href="#contact"
            onClick={onNavClick("#contact")}
            style={{
              marginTop: "auto",
              height: 52,
              borderRadius: 999,
              background: "#f4f6f8",
              color: "#07080b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 500,
              fontSize: 15,
            }}
          >
            Get in touch
          </a>
        </div>
      )}
    </>
  );
}
