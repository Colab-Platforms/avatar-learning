"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LA_INVESTORS, LA_NAV } from "./data";
import { ArrowRight } from "./icons";
import s from "./learnAdopt.module.css";

export function LearnAdoptNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // The bar is fixed to the top; once the page scrolls it gains a frosted
  // backdrop so it stays readable over the content.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={s.nav} aria-label="Main" data-scrolled={scrolled ? "" : undefined}>
      <Link href="/" className={s.logo} aria-label="Avatar home">
        <Image src="/landingpage-images/Avatar_logo_Light.svg" alt="Avatar" width={119} height={32} priority />
      </Link>

      <div className={s.navRight}>
        <ul className={s.navLinks}>
          {LA_NAV.map((l) => (
            <li key={l.label}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>
        <Link href={LA_INVESTORS.href} className={s.navPill}>
          {LA_INVESTORS.label}
          <ArrowRight className={s.arrow} />
        </Link>
        <button
          type="button"
          className={s.menuBtn}
          aria-expanded={open}
          aria-controls="la-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <span data-open={open} />
        </button>
      </div>

      {open && (
        <div id="la-mobile-menu" className={s.mobileMenu}>
          {[...LA_NAV, LA_INVESTORS].map((l) => (
            <Link key={l.label} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
              <ArrowRight className={s.arrow} />
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
