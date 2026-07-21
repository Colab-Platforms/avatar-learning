"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { useDirect2HireCheckout } from "@/hooks/useDirect2HireCheckout";

export function StickyBuyBar() {
  // Visible from the moment the page loads; only hides once the footer
  // comes into view so it doesn't sit on top of it.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const distanceFromBottom =
        document.documentElement.scrollHeight -
        window.innerHeight -
        window.scrollY;
      setVisible(distanceFromBottom > 250);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { processing, enrolled } = useDirect2HireCheckout();
  const heroBtnLabel = processing
    ? "Processing Payment…"
    : enrolled
      ? "Enrolled ✓"
      : "Enroll Now for ₹999";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(15,23,42,0.08)] pb-[env(safe-area-inset-bottom)]"
        >
          <div className="container-x">
            <div className="flex items-center justify-between gap-3 py-3 sm:py-3.5">
              {/* Left Content */}
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  {/* Icon badge (Desktop only) */}
                  <span className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 border border-brand-200">
                    <Zap className="h-3.5 w-3.5 text-brand-600" />
                  </span>

                  <div className="flex flex-col justify-center min-w-0">
                    {/* Title (Desktop only) */}
                    <p className="hidden sm:block text-[11px] text-text-subtle font-medium leading-none mb-1">
                      Direct2Hire Career Plan
                    </p>

                    {/* Main Price */}
                    <div className="flex items-baseline gap-1.5 leading-none">
                      <span className="text-xl sm:text-2xl font-black text-text tracking-tight">
                        ₹999
                      </span>
                      {/* Desktop inline cut price & badge */}
                      <span className="hidden sm:inline-flex items-center gap-1.5 ml-1">
                        <span className="text-xs text-text-subtle line-through font-medium">
                          ₹24,999
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                          96% OFF
                        </span>
                      </span>
                    </div>

                    {/* Mobile cut price & discount badge (below main price) */}
                    <div className="flex sm:hidden items-center gap-1.5 mt-1 leading-none">
                      <span className="text-[11px] text-text-subtle line-through font-medium">
                        ₹24,999
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-1 py-0.5 rounded">
                        96% OFF
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right CTA Button */}
              <Link href="/direct2hire/enroll" className="shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  className="whitespace-nowrap"
                >
                  <span>{heroBtnLabel}</span>
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
