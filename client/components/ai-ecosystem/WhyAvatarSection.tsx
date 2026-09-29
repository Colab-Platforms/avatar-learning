"use client";

import { motion } from "framer-motion";
import { SectionEyebrow } from "./SectionEyebrow";
import { WHY_AVATAR } from "./data";

export function WhyAvatarSection() {
  return (
    <section id="why-avatar" className="relative flex min-h-[100svh] items-center py-8 sm:py-14 scroll-mt-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 85% 30%, rgba(124,58,237,0.12) 0%, transparent 65%)",
        }}
        aria-hidden
      />

      {/* animated backdrop echoing the hero: drifting grid, flowing wave lines with glow dots, a slow scan sweep.
          Masked top and bottom so it blends into neighbouring sections instead of reading as a panel. */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
        }}
        aria-hidden
      >
        <div
          className="aie-why-grid absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(124,58,237,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.24) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 80%)",
          }}
        />
      </div>

      <style jsx>{`
        .aie-why-grid {
          animation: aie-why-grid-drift 14s linear infinite;
        }
        @keyframes aie-why-grid-drift {
          from {
            background-position: 0 0, 0 0;
          }
          to {
            background-position: 0 56px, 56px 0;
          }
        }
      `}</style>

      <div className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-6 max-w-2xl text-center sm:mb-8"
        >
          <SectionEyebrow number="01" label="Why Avatar" className="text-blue-300" textSize="text-[16px]" />
          <h2 className="mt-4 text-3xl font-extralight tracking-tight text-white sm:text-5xl">
            Built for businesses that{" "}
            <span
              className="bg-clip-text font-light text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #C4B5FD 0%, #93C5FD 100%)",
              }}
            >
              move fast.
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_AVATAR.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] hover:-translate-y-1"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 transition-all duration-300 group-hover:border-violet-300/30"
                  style={{
                    background: "linear-gradient(145deg, rgba(139,92,246,0.22), rgba(59,130,246,0.12))",
                  }}
                >
                  <item.icon className="h-5 w-5 text-violet-200" />
                </div>
                <span className="text-[12px] font-mono text-white/35">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 text-[16px] font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/90">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
