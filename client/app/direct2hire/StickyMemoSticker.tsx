"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, CheckCircle2 } from "lucide-react";

/* ─── Desktop sticky sticker ─────────────────────────────────────── */

const IMG_W = 923;
const IMG_H = 1024;
const ANCHOR_OFFSET_FROM_SLIDESHOW_TOP = 20;
const PIN_TOP = 120;
const BOTTOM_PADDING = 16;

function useStickyPosition() {
  const [state, setState] = useState<{
    top: number;
    left?: number;
    right?: number;
    hidden: boolean;
    displayW: number;
    displayH: number;
  } | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const update = () => {
      const slideshow = document.getElementById("d2h-slideshow");
      const boundarySec = document.getElementById("what-you-get");
      if (!slideshow || !boundarySec) return;

      const slideshowRect = slideshow.getBoundingClientRect();
      const boundaryRect = boundarySec.getBoundingClientRect();

      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        setState({ top: 0, hidden: true, displayW: 0, displayH: 0 });
        return;
      }

      const displayW = 360;
      const displayH = Math.round((IMG_H / IMG_W) * displayW);

      const naturalTop = slideshowRect.top + ANCHOR_OFFSET_FROM_SLIDESHOW_TOP;
      const stuckTop = Math.max(naturalTop, PIN_TOP);
      const bottomLimit = boundaryRect.bottom - displayH - BOTTOM_PADDING;
      const top = Math.min(stuckTop, bottomLimit);

      let left: number | undefined = undefined;
      let right: number | undefined = undefined;

      left = slideshowRect.right - displayW * 0.45;
      if (left + displayW > window.innerWidth) {
        left = undefined;
        right = 16;
      }

      setState({
        top,
        left,
        right,
        hidden: bottomLimit < -displayH,
        displayW,
        displayH,
      });
    };

    update();
    const onScrollOrResize = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = undefined;
        update();
      });
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return state;
}

/* ─── Mobile full-screen modal ───────────────────────────────────── */

const PERKS = [
  "AI career assessment mapped to your strengths",
  "30-min 1-on-1 counselling on Google Meet",
];

function MobileFullScreenModal() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;
    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => setDismissed(true), 400);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={dismiss}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
          />

          {/* Modal panel slides up from bottom */}
          <motion.div
            key="panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-[70] lg:hidden rounded-t-3xl overflow-hidden"
            style={{ maxHeight: "92dvh" }}
          >
            {/* ── background ── */}
            <div className="absolute inset-0 bg-white" />

            {/* Blue decorative blob top-right */}
            <div
              className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-40"
              style={{ background: "radial-gradient(circle, #3b82f6, #1d4ed8)" }}
            />

            {/* ── drag handle ── */}
            <div className="relative flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* ── close button ── */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>

            <div className="relative overflow-y-auto px-5 pt-1 pb-8">
              {/* ── Header badge ── */}
              <div className="flex justify-center mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-[11px] font-bold tracking-wider text-blue-700 uppercase">
                    D2H Program · Limited Offer
                  </span>
                </span>
              </div>

              {/* ── Title ── */}
              <h2 className="text-center text-[22px] font-black text-slate-900 leading-tight mb-1">
                Assessment + Counselling
              </h2>
              <p className="text-center text-[13px] text-slate-500 mb-5 leading-relaxed">
                Know exactly which AI career is right for you — in just 30 minutes.
              </p>

              {/* ── Perks ── */}
              <div className="flex flex-col gap-2.5 mb-6">
                {PERKS.map((perk) => (
                  <div key={perk} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[13px] text-slate-700 leading-snug">{perk}</p>
                  </div>
                ))}
              </div>

              {/* ── Price block ── */}
              <div className="flex items-center justify-center gap-3 mb-5">
                <span className="text-[42px] font-black text-blue-600 leading-none">₹99</span>
                <div className="flex flex-col">
                  <span className="text-[15px] text-slate-400 line-through leading-none">₹2,000</span>
                  <span className="text-[11px] font-bold text-emerald-600 mt-0.5">95% OFF today</span>
                </div>
              </div>

              {/* ── CTA ── */}
              <Link
                href="/direct2hire/assessment-counselling"
                onClick={dismiss}
                className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 font-bold text-[15.5px] text-white shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
                style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" }}
              >
                Get started for ₹99
                <ArrowRight className="w-4.5 h-4.5 shrink-0" />
              </Link>

              <p className="text-center text-[11px] text-slate-400 mt-3">
                ₹99 credited toward the full programme · No hidden charges
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Combined export ────────────────────────────────────────────── */

export function StickyMemoSticker() {
  const pos = useStickyPosition();

  return (
    <>
      {/* Desktop sticky sticker */}
      {pos && !pos.hidden && (
        <div
          className="fixed z-50 flex flex-col items-end gap-2"
          style={{
            top: pos.top,
            ...(pos.left !== undefined
              ? { left: pos.left }
              : { right: pos.right }),
          }}
        >
          <Link
            href="/direct2hire/assessment-counselling"
            className="block cursor-pointer"
          >
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [-4, -1, -4] }}
              transition={{
                y: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
              }}
              whileHover={{ scale: 1.06, rotate: 0 }}
              whileTap={{ scale: 0.94 }}
              style={{ width: pos.displayW, height: pos.displayH }}
              className="relative filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]"
            >
              <Image
                src="/Direct2hire/sticky.png"
                alt="Assessment + Counselling"
                width={pos.displayW}
                height={pos.displayH}
                className="w-full h-full object-contain"
                priority
                unoptimized
              />
            </motion.div>
          </Link>
        </div>
      )}

      {/* Mobile full-screen modal */}
      <MobileFullScreenModal />
    </>
  );
}
