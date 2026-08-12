"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, PartyPopper, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SHOW_DELAY_MS = 1200;
const STORAGE_KEY = "id2026-freedom90-dismissed";
const COUPON_CODE = "FREEDOM90";

const EXCLUDED_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/dashboard",
  "/admin",
  "/checkout",
  "/payment",
  "/partner-dashboard",
  "/onboarded",
];

function isExcludedPath(pathname: string | null): boolean {
  if (!pathname) return true;
  return EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function IndependenceDayPromo() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isExcludedPath(pathname)) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const timer = window.setTimeout(() => setIsOpen(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  function handleClose() {
    setIsOpen(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable, no-op
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="independence-day-promo-title"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]"
          >
            {/* Tricolor top bar */}
            <div className="h-2 w-full flex">
              <div className="flex-1 bg-[#FF9933]" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-[#138808]" />
            </div>

            {/* Decorative gradient wash */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#FF9933]/10 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#138808]/10 via-transparent to-transparent" />

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-3 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative flex flex-col items-center px-7 pb-8 pt-8 text-center">
              {/* Chakra badge */}
              <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF9933] via-white to-[#138808] shadow-lg shadow-[#000080]/10">
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white">
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#000080]">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <span
                        key={i}
                        className="absolute h-3 w-[1.5px] bg-[#000080] origin-bottom"
                        style={{
                          top: 0,
                          left: "50%",
                          transform: `rotate(${i * 30}deg) translateX(-50%)`,
                        }}
                      />
                    ))}
                    <span className="h-1.5 w-1.5 rounded-full bg-[#000080]" />
                  </span>
                </div>
              </div>

              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#FF9933]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#a85800] border border-[#FF9933]/25">
                <PartyPopper className="h-3 w-3" />
                80th Independence Day
              </div>

              <h3
                id="independence-day-promo-title"
                className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900"
              >
                Celebrate Freedom with{" "}
                <span className="bg-gradient-to-r from-[#FF9933] via-[#a85800] to-[#138808] bg-clip-text text-transparent">
                  90% Off
                </span>
              </h3>

              <p className="mb-6 max-w-[320px] text-sm leading-relaxed text-slate-500">
                This Independence Day, get our{" "}
                <span className="font-bold text-[#138808]">₹999</span>{" "}
                Direct2Hire program for just{" "}
                <span className="font-bold text-[#138808]">₹99</span>. Use the
                code below at checkout — valid till 16th August.
              </p>

              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  "group mb-6 flex w-full max-w-[280px] items-center justify-between rounded-2xl border-2 border-dashed px-5 py-3.5 transition-all duration-200 cursor-pointer",
                  copied
                    ? "border-[#138808] bg-[#138808]/5"
                    : "border-slate-300 bg-slate-50 hover:border-[#FF9933] hover:bg-[#FF9933]/5",
                )}
              >
                <span className="font-mono text-lg font-bold tracking-[0.2em] text-slate-800">
                  {COUPON_CODE}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold",
                    copied ? "text-[#138808]" : "text-slate-500",
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </span>
              </button>

              <div className="flex w-full flex-col-reverse gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98] transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-100"
                >
                  Maybe Later
                </button>
                <a
                  href="/direct2hire"
                  onClick={handleClose}
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#FF9933] to-[#138808] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#138808] focus:ring-offset-2"
                >
                  Grab the Offer
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
