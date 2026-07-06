"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Phone, X } from "lucide-react";

const WHATSAPP_NUMBER = "919136774304";
const PHONE_NUMBER = "+919136774304";
const WHATSAPP_MESSAGE = "Hi! I'd like to know more about the Direct2Hire program.";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.031 0C5.4 0 .001 5.4 0 12.031c0 2.12.554 4.19 1.607 6.021L0 24l6.062-1.593a11.94 11.94 0 0 0 5.966 1.607h.005c6.63 0 12.03-5.4 12.031-12.031A11.96 11.96 0 0 0 20.567 3.5 11.96 11.96 0 0 0 12.031 0zm7.076 19.106a9.9 9.9 0 0 1-7.076 2.94h-.004a9.93 9.93 0 0 1-5.06-1.387l-.362-.215-3.596.944.96-3.507-.235-.36a9.93 9.93 0 0 1-1.522-5.294C2.014 6.454 6.454 2.014 12.031 2.014a9.9 9.9 0 0 1 7.049 2.923 9.9 9.9 0 0 1 2.919 7.048c-.003 5.577-4.443 10.018-9.892 10.018z" />
    </svg>
  );
}

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="fixed right-4 bottom-30 md:right-19 md:bottom-40  z-50 flex flex-col items-end gap-3"
    >
      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-[280px] overflow-hidden rounded-2xl border border-border bg-white shadow-[0_16px_48px_rgba(15,23,42,0.16)]"
          >
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-emerald-50/70"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                <WhatsAppIcon className="h-5 w-5" />
              </span>
              <div className="text-left">
                <p className="text-[14px] font-semibold text-text">Chat on WhatsApp</p>
                <p className="text-[12px] text-text-subtle">For instant help &amp; updates</p>
              </div>
            </a>

            <div className="mx-4 h-px bg-border" />

            <a
              href={`tel:${PHONE_NUMBER}`}
              className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-brand-50/70"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
                <Phone className="h-4.5 w-4.5" />
              </span>
              <div className="text-left">
                <p className="text-[14px] font-semibold text-text">Talk to an Advisor</p>
                <p className="text-[12px] text-text-subtle">Available Mon–Sat, 10am–6pm</p>
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close help menu" : "Need help? Chat or call us"}
        className="group inline-flex items-center gap-2 rounded-full bg-slate-900 pl-3 pr-4 py-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex h-6 w-6 items-center justify-center"
            >
              <X className="h-4 w-4" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex h-6 w-6 items-center justify-center"
            >
              <MessageCircle className="h-4 w-4" />
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
