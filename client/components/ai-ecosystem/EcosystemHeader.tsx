"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_LINKS } from "./data";
import { AccountMenu } from "./AccountMenu";
import { adoptionAuth, useAdoptionSession } from "@/lib/adoptionSession";
import pillStyles from "../ui/hoverPill.module.css";

const PRODUCT_LINK = { label: "Avatar Learning", href: "/learning" };
/** The page's "Get in touch" demo form card (BookDemoSection). */
const DEMO_HREF = "#demo-form";
/** AI Adoption sign-in page (separate from the learning platform's /login). */
const LOGIN_HREF = "/adoption/login";

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
    // 920, not 820: below ~900px the full link row plus Book a Demo and Login no longer fits.
    const onResize = () => setIsDesktop(window.innerWidth >= 920);
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

  // Signed-in AI Adoption visitors see an account menu instead of Login.
  const { user: signedInUser } = useAdoptionSession();

  const pathname = usePathname();
  const router = useRouter();

  const onNavClick = useCallback(
    (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (href === "#investors" || href === "/#investors" || href.includes("investors")) {
        e.preventDefault();
        setMenuOpen(false);
        router.push("/investors?theme=dark");
        return;
      }
      if (href.startsWith("#")) {
        e.preventDefault();
        setMenuOpen(false);
        if (pathname === "/" || pathname === "") {
          scrollToSection(href.slice(1), headerRef.current);
        } else {
          router.push(`/${href}`);
        }
      } else {
        setMenuOpen(false);
      }
    },
    [pathname, router],
  );

  // Book a Demo: bring the enquiry form itself into view (not just the section
  // heading), then put the cursor in its first field so the visitor can type.
  // On pages without the form, the link's href opens /#demo-form instead.
  const goToDemoForm = useCallback((card: HTMLElement) => {
    // The card fades in sliding up (a translateY), so aim at where it ends up,
    // not where it is mid-animation.
    const targetTop = () => {
      const offset = (headerRef.current?.getBoundingClientRect().height ?? 0) + 8;
      const shift = new DOMMatrixReadOnly(getComputedStyle(card).transform).m42;
      return Math.max(card.getBoundingClientRect().top - shift + window.scrollY - offset, 0);
    };
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: targetTop(), behavior: smooth ? "smooth" : "auto" });
    // Content above can still shift while scrolling; settle on the form, then focus it.
    window.setTimeout(() => {
      const top = targetTop();
      if (Math.abs(top - window.scrollY) > 4) window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
      window.setTimeout(() => card.querySelector<HTMLInputElement>("form input")?.focus({ preventScroll: true }), smooth ? 350 : 0);
    }, smooth ? 800 : 0);
  }, []);

  const onDemoClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const card = document.getElementById(DEMO_HREF.slice(1));
      if (!card) return;
      e.preventDefault();
      setMenuOpen(false);
      goToDemoForm(card);
    },
    [goToDemoForm],
  );

  // Arriving from another page via /#demo-form: land on the form the same way.
  useEffect(() => {
    if (window.location.hash !== DEMO_HREF) return;
    const t = window.setTimeout(() => {
      const card = document.getElementById(DEMO_HREF.slice(1));
      if (card) goToDemoForm(card);
    }, 600);
    return () => window.clearTimeout(t);
  }, [goToDemoForm]);

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
          <a href="#top" aria-label="Avatar home" style={{ display: "flex", alignItems: "center", flex: "none" }}>
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
            <div
              style={{
                display: "flex",
                gap: "clamp(16px, 2.2vw, 32px)",
                fontSize: 14,
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
            >
              {NAV_LINKS.map((l) =>
                l.href.startsWith("#") ? (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={onNavClick(l.href)}
                    style={{ color: "#a3abb5", textDecoration: "none", transition: "color .2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#a3abb5")}
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    style={{ color: "#a3abb5", textDecoration: "none", transition: "color .2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#a3abb5")}
                  >
                    {l.label}
                  </Link>
                )
              )}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
            {/* Avatar Learning button: temporarily hidden. Uncomment to restore.
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                padding: 3,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.1)",
                marginRight: isDesktop ? 4 : 0,
                flex: "none",
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
                    height: isDesktop ? 42 : 36,
                    boxSizing: "border-box",
                    padding: isDesktop ? "0 20px" : "0 14px",
                    borderRadius: 999,
                    fontSize: isDesktop ? 15 : 13,
                    fontWeight: 700,
                    color: "#205A99",
                    background: "#ffffff",
                    whiteSpace: "nowrap",
                    position: "relative",
                    zIndex: 50,
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
            */}
            <a
              href={`/${DEMO_HREF}`}
              onClick={onDemoClick}
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: isDesktop ? 42 : 36,
                boxSizing: "border-box",
                padding: isDesktop ? "0 22px" : "0 14px",
                borderRadius: 999,
                border: "1px solid rgba(138,181,227,.35)",
                background: "linear-gradient(135deg,#2A78CC 0%,#205A99 100%)",
                color: "#fff",
                fontSize: isDesktop ? 15 : 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(42,120,204,.25),inset 0 1px 0 rgba(255,255,255,.18)",
                transition: "transform .2s ease, box-shadow .2s ease, filter .2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 24px rgba(42,120,204,.5),0 0 0 3px rgba(111,227,239,.14),inset 0 1px 0 rgba(255,255,255,.22)";
                e.currentTarget.style.filter = "brightness(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(42,120,204,.25),inset 0 1px 0 rgba(255,255,255,.18)";
                e.currentTarget.style.filter = "none";
              }}
            >
              Book a Demo
            </a>
            {/* Login: secondary to Book a Demo. Desktop only here; on smaller screens it's in the menu. */}
            {isDesktop && signedInUser && <AccountMenu user={signedInUser} />}
            {isDesktop && !signedInUser && (
              <Link
                href={LOGIN_HREF}
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6fe3ef]"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 42,
                  boxSizing: "border-box",
                  padding: "0 20px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,.14)",
                  background: "rgba(255,255,255,.03)",
                  color: "#f4f6f8",
                  fontSize: 15,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  transition: "border-color .2s ease, background .2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.3)";
                  e.currentTarget.style.background = "rgba(255,255,255,.07)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.14)";
                  e.currentTarget.style.background = "rgba(255,255,255,.03)";
                }}
              >
                Login
              </Link>
            )}
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
          {NAV_LINKS.map((m) =>
            m.href.startsWith("#") ? (
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
                  textDecoration: "none",
                }}
              >
                {m.label}
                <span style={{ color: "#6fe3ef", fontSize: 16 }}>→</span>
              </a>
            ) : (
              <Link
                key={m.label}
                href={m.href}
                onClick={() => setMenuOpen(false)}
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
                  textDecoration: "none",
                }}
              >
                {m.label}
                <span style={{ color: "#6fe3ef", fontSize: 16 }}>→</span>
              </Link>
            )
          )}
          {signedInUser && (
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
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
                textDecoration: "none",
              }}
            >
              My Account
              <span style={{ color: "#6fe3ef", fontSize: 16 }}>→</span>
            </Link>
          )}
          {signedInUser ? (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                void adoptionAuth.logout();
              }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                minHeight: 60,
                padding: 0,
                border: 0,
                borderBottom: "1px solid rgba(255,255,255,.08)",
                background: "transparent",
                color: "#f4f6f8",
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                Log out
                <span style={{ fontSize: 13, letterSpacing: 0, color: "#8a939e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{signedInUser.email}</span>
              </span>
              <span style={{ color: "#6fe3ef", fontSize: 16 }}>→</span>
            </button>
          ) : (
          <Link
            href={LOGIN_HREF}
            onClick={() => setMenuOpen(false)}
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
              textDecoration: "none",
            }}
          >
            Login
            <span style={{ color: "#6fe3ef", fontSize: 16 }}>→</span>
          </Link>
          )}
          {/* Avatar Learning menu item: temporarily hidden. Uncomment to restore.
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
          */}
        </div>
      )}
    </>
  );
}
