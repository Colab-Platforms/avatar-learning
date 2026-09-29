"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionEyebrow } from "./SectionEyebrow";
import { SERVICES } from "./data";

export function ServicesSection() {
  const [activeService, setActiveService] = useState<string | null>(null);

  return (
    <section id="services" className="relative flex min-h-[100svh] items-center py-8 sm:py-14 scroll-mt-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59,130,246,0.10) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-6 max-w-2xl text-center sm:mb-8"
        >
          <SectionEyebrow number="02" label="Services" />
          <h2 className="mt-4 text-3xl font-extralight tracking-tight text-white sm:text-5xl">
            One platform.{" "}
            <span
              className="bg-clip-text font-light text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #C4B5FD 0%, #93C5FD 100%)",
              }}
            >
              Every business function.
            </span>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/90">
            CRM, order management and content — built as one connected
            system, not separate tools stitched together.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          {SERVICES.map((service, i) => {
            const isOpen = activeService === service.id;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5",
                  isOpen
                    ? "border-violet-400/30 bg-gradient-to-br from-white/[0.08] to-white/[0.02] hover:border-violet-400/50"
                    : "border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.01] hover:border-violet-300/30 hover:from-white/[0.07] hover:shadow-[0_24px_60px_-20px_rgba(124,58,237,0.45)]",
                )}
                style={{
                  boxShadow: isOpen
                    ? "0 20px 60px -20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.06)"
                    : "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                {/* top accent line — brighter when open, appears on hover otherwise */}
                <span
                  className={cn(
                    "absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  )}
                  style={{
                    background: "linear-gradient(90deg, transparent, #A78BFA, #60A5FA, transparent)",
                  }}
                  aria-hidden
                />

                <button
                  type="button"
                  onClick={() => setActiveService(isOpen ? null : service.id)}
                  className="flex w-full items-start justify-between gap-4 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 transition-all duration-300 group-hover:scale-110 group-hover:border-violet-300/40"
                      style={{
                        background:
                          "linear-gradient(145deg, rgba(139,92,246,0.25), rgba(59,130,246,0.15))",
                        boxShadow: isOpen
                          ? "0 0 24px -4px rgba(139,92,246,0.6)"
                          : "0 0 16px -6px rgba(139,92,246,0.35)",
                      }}
                    >
                      <service.icon className="h-5 w-5 text-violet-200" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-semibold text-white">
                        {service.name}
                      </h3>
                      <p className="mt-1.5 text-[14.5px] leading-relaxed text-white/90">
                        {service.tagline}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "mt-1.5 h-4 w-4 shrink-0 text-white/95 transition-transform duration-300",
                      isOpen && "rotate-180 text-violet-300",
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 border-t border-white/10 pt-5">
                        <p className="text-[14.5px] leading-relaxed text-white/90">
                          {service.description}
                        </p>

                        {/* data-flow strip — reads as a live pipeline, replays each time the card opens */}
                        <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-2">
                          {service.flow.map((step, si) => (
                            <motion.div
                              key={step}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.35, delay: 0.15 + si * 0.12, ease: [0.22, 1, 0.36, 1] }}
                              className="flex items-center gap-1.5"
                            >
                              <span
                                className="inline-flex items-center rounded-full border border-violet-300/25 bg-violet-500/10 px-2.5 py-1 text-[11.5px] font-medium text-violet-200"
                              >
                                {step}
                              </span>
                              {si < service.flow.length - 1 && (
                                <ArrowRight className="h-3 w-3 shrink-0 text-white/25" />
                              )}
                            </motion.div>
                          ))}
                        </div>

                        <ul className="mt-4 flex flex-col gap-2">
                          {service.benefits.map((b) => (
                            <li
                              key={b}
                              className="flex items-start gap-3 text-[14px] text-white/92"
                            >
                              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
                              {b}
                            </li>
                          ))}
                        </ul>
                        <a
                          href="#book-demo"
                          className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-violet-300 hover:text-violet-200 hover:gap-2.5 transition-all duration-250"
                        >
                          Know More <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
