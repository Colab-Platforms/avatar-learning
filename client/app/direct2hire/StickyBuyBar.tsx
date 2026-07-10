"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Landmark, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui";

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
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 border border-brand-200">
                    <Zap className="h-3.5 w-3.5 text-brand-600" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-[12px] text-text-subtle leading-tight truncate">
                      Career Session + AI Assessment + AI Learning + Internship
                      + Placements
                    </p>
                    <p className="flex items-baseline gap-2 leading-tight">
                      <span className="text-lg sm:text-xl font-black text-text">
                        ₹499
                      </span>
                      <span className="text-[11px] sm:text-[12px] text-text-subtle line-through">
                        ₹24,999
                      </span>
                      <span className="hidden sm:inline text-[11px] font-semibold text-emerald-600">
                        98% OFF
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/contact" className="shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  className="whitespace-nowrap"
                >
                  <span className="sm:hidden">Enroll Now</span>
                  <span className="hidden sm:inline">Enroll Now - ₹499</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
