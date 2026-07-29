"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Headphones, Phone, X } from "lucide-react";
import { usePathname } from "next/navigation";

const WHATSAPP_NUMBER = "918976830780";
const PHONE_NUMBER = "+918976830780";
const WHATSAPP_MESSAGE =
  "Hi! I'd like to know more about the Direct2Hire program.";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.031 0C5.4 0 .001 5.4 0 12.031c0 2.12.554 4.19 1.607 6.021L0 24l6.062-1.593a11.94 11.94 0 0 0 5.966 1.607h.005c6.63 0 12.03-5.4 12.031-12.031A11.96 11.96 0 0 0 20.567 3.5 11.96 11.96 0 0 0 12.031 0zm7.076 19.106a9.9 9.9 0 0 1-7.076 2.94h-.004a9.93 9.93 0 0 1-5.06-1.387l-.362-.215-3.596.944.96-3.507-.235-.36a9.93 9.93 0 0 1-1.522-5.294C2.014 6.454 6.454 2.014 12.031 2.014a9.9 9.9 0 0 1 7.049 2.923 9.9 9.9 0 0 1 2.919 7.048c-.003 5.577-4.443 10.018-9.892 10.018z" />
    </svg>
  );
}

export function HelpWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIcon, setActiveIcon] = useState<"whatsapp" | "phone">("whatsapp");

  useEffect(() => {
    if (isOpen) return;
    const timer = setInterval(() => {
      setActiveIcon((prev) => (prev === "whatsapp" ? "phone" : "whatsapp"));
    }, 3000);
    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!pathname) return null;

  const isExcluded =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/partner-dashboard");

  if (isExcluded) return null;

  const isDirect2Hire = pathname === "/direct2hire";

  return (
    <div
      ref={containerRef}
      className={`fixed right-6 md:right-8 z-50 flex flex-col items-end gap-3 transition-all duration-300 ${
        isDirect2Hire ? "bottom-[180px] md:bottom-[196px]" : "bottom-[108px] md:bottom-[132px]"
      }`}
    >
      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-[280px] overflow-hidden rounded-2xl border border-border bg-white shadow-[0_16px_48px_rgba(15,23,42,0.12)]"
          >
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3.5 text-white">
              <h4 className="text-[13.5px] font-bold tracking-wide">Support & Advice</h4>
              <p className="text-[10.5px] text-brand-100/90 flex items-center gap-1.5 mt-0.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Counselors online to assist you
              </p>
            </div>

            <div className="py-1">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-emerald-50/70"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition-transform group-hover:scale-105">
                  <WhatsAppIcon className="h-4.5 w-4.5" />
                </span>
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-text">
                    Chat on WhatsApp
                  </p>
                  <p className="text-[11px] text-text-muted">
                    Instant help & support
                  </p>
                </div>
              </a>

              <div className="mx-4 h-px bg-border/50" />

              <a
                href={`tel:${PHONE_NUMBER}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-brand-50/70"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
                  <Phone className="h-4 w-4" />
                </span>
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-text">
                    Talk to an Advisor
                  </p>
                  <p className="text-[11px] text-text-muted">
                    Mon–Sat, 10am–6pm
                  </p>
                </div>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close help menu" : "Need help? Chat or call us"}
        className="group inline-flex items-center gap-2.5 rounded-full border border-brand-200/80 bg-white/90 px-4 py-3 text-brand-600 shadow-[0_8px_30px_rgba(42,120,204,0.12)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-50 hover:border-brand-300 hover:shadow-[0_12px_36px_rgba(42,120,204,0.18)] active:translate-y-0 cursor-pointer"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex h-6 w-6 items-center justify-center text-brand-600"
            >
              <X className="h-4 w-4" />
            </motion.span>
          ) : (
            <motion.span
              key={activeIcon}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex h-6 w-6 items-center justify-center shrink-0"
            >
              {activeIcon === "whatsapp" ? (
                <WhatsAppIcon className="h-4.5 w-4.5 text-emerald-500 fill-emerald-500" />
              ) : (
                <Phone className="h-4 w-4 text-brand-600" />
              )}
            </motion.span>
          )}
        </AnimatePresence>
        <span className="hidden text-[13px] font-semibold sm:inline">
          {isOpen ? "Close" : "Need Help?"}
        </span>
      </button>
    </div>
  );
}
