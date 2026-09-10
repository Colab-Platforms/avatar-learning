"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function BlogHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full border-b border-[#D3DCE6] bg-white">
      {/* ── Top Bar ── */}
      <div className="w-full px-4 sm:px-8 md:px-12 py-5 flex items-center justify-between border-b border-[#D3DCE6]/60">
        {/* Left: Bullet dot logo mark */}
        <Link
          href="/"
          className="flex items-center gap-3 group"
          aria-label="Avatar Learning home"
        >
          <div className="w-4 h-4 rounded-full bg-slate-900 group-hover:bg-brand-500 transition-colors duration-250 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xs font-bold tracking-widest text-slate-500 uppercase group-hover:text-slate-900 transition-colors">
            AVATAR
          </span>
        </Link>

        {/* Desktop Nav Links (Matching video: ABOUT US, PORTFOLIO, BLOG, CONTACT NOW) */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          <Link
            href="/about"
            className="text-xs lg:text-[13px] font-bold tracking-wider text-slate-700 hover:text-brand-500 uppercase transition-colors duration-200"
          >
            ABOUT US
          </Link>
          <Link
            href="/courses"
            className="text-xs lg:text-[13px] font-bold tracking-wider text-slate-700 hover:text-brand-500 uppercase transition-colors duration-200"
          >
            PORTFOLIO
          </Link>
          <Link
            href="/blog"
            className="text-xs lg:text-[13px] font-bold tracking-wider text-brand-600 uppercase transition-colors duration-200 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-500"
          >
            BLOG
          </Link>
          <Link
            href="/contact"
            className="text-xs lg:text-[13px] font-bold tracking-wider text-slate-700 hover:text-brand-500 uppercase transition-colors duration-200"
          >
            CONTACT NOW
          </Link>
        </nav>

        {/* Mobile "MENU" Pill Button (Matching frame 00:11 in video) */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="px-4 py-1.5 rounded-full border border-slate-300 text-xs font-bold tracking-wider text-slate-900 uppercase hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>CLOSE</span>
              </>
            ) : (
              <>
                <Menu className="w-3.5 h-3.5" />
                <span>MENU</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden border-b border-[#D3DCE6] bg-slate-50/95 backdrop-blur-md overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col space-y-4">
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold tracking-wider text-slate-800 uppercase hover:text-brand-500 py-1"
              >
                ABOUT US
              </Link>
              <Link
                href="/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold tracking-wider text-slate-800 uppercase hover:text-brand-500 py-1"
              >
                PORTFOLIO
              </Link>
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold tracking-wider text-brand-600 uppercase py-1 flex items-center justify-between"
              >
                <span>BLOG</span>
                <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">
                  ACTIVE
                </span>
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-bold tracking-wider text-slate-800 uppercase hover:text-brand-500 py-1"
              >
                CONTACT NOW
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Giant Hero Typography: "SEVERAL" ── */}
      <div className="w-full px-4 sm:px-8 md:px-12 pt-4 pb-2 md:pt-6 md:pb-4 flex justify-center items-center overflow-hidden">
        <h1 className="text-[18vw] md:text-[16.5vw] font-black tracking-tighter leading-none text-slate-950 uppercase select-none text-center transform transition-transform duration-500 hover:scale-[1.01]">
          SEVERAL
        </h1>
      </div>

      {/* ── Editorial Horizontal Concept Banner ── */}
      <div className="w-full border-t border-[#D3DCE6] py-3.5 px-4 sm:px-8 md:px-12 bg-[#F8FAFC]/70">
        <div className="w-full flex items-center justify-center text-center">
          <p className="text-[10px] sm:text-[11px] md:text-xs font-semibold tracking-wider text-slate-700 uppercase leading-relaxed max-w-5xl">
            EDITORIAL ©2026 PRODUCT CONCEPT WITH THE EVER-CHANGING LIGHT THROUGHOUT
            THE DAY PRESENTS ENDLESS POSSIBILITIES FOR EXPERIMENTING WITH
            DIFFERENT MOODS AND ATMOSPHERES —
          </p>
        </div>
      </div>
    </header>
  );
}
