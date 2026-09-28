"use client";

import { motion } from "framer-motion";
import { SectionEyebrow } from "./SectionEyebrow";
import { WHO_WE_SERVE } from "./data";

// A restrained "business scanner" strip: how AI moves through a business,
// shown once as a scroll-revealed line above the (unchanged) audience cards.
const SCAN_STAGES = ["Business", "Processes", "Automation", "AI", "Growth"];

export function WhoWeServeSection() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden py-20 sm:py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.10) 0%, transparent 70%)",
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
          <SectionEyebrow number="03" label="Who We Serve" className="text-blue-300/90" />
          <h2 className="mt-3 text-3xl font-extralight tracking-tight text-white sm:text-5xl">
            Built for Businesses{" "}
            <span
              className="bg-clip-text font-light text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #C4B5FD 0%, #93C5FD 100%)",
              }}
            >
              Ready to Adopt AI
            </span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/90">
            From growing businesses to sales and marketing teams, we help
            organizations adopt AI solutions around their real business
            needs.
          </p>
        </motion.div>

        {/* business scanner strip — Business -> Processes -> Automation -> AI -> Growth */}
        <div className="relative mx-auto mb-8 hidden max-w-3xl items-center overflow-hidden px-6 sm:flex">
          <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="absolute left-0 right-0 h-1 w-full px-6">
            <defs>
              <linearGradient id="aieScanLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.45" />
              </linearGradient>
            </defs>
            <motion.line
              x1="4"
              y1="2"
              x2="96"
              y2="2"
              stroke="url(#aieScanLine)"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>

          {/* a soft glow that sweeps once the strip has drawn in, echoing the hero's radar scan */}
          <motion.div
            className="aie-scan-sweep absolute top-1/2 h-4 w-16 -translate-y-1/2 rounded-full"
            style={{
              background: "radial-gradient(ellipse, rgba(196,181,253,0.5) 0%, transparent 70%)",
              filter: "blur(2px)",
            }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 1.1, duration: 0.4 }}
          />

          <div className="relative flex w-full justify-between">
            {SCAN_STAGES.map((stage, i) => (
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-2"
              >
                <span className="h-2.5 w-2.5 rounded-full border border-white/25 bg-[#05050a]" />
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/45">
                  {stage}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .aie-scan-sweep {
            animation: aie-scan-sweep-move 6s ease-in-out infinite;
          }
          @keyframes aie-scan-sweep-move {
            0%,
            100% {
              left: 2%;
            }
            50% {
              left: 82%;
            }
          }
        `}</style>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHO_WE_SERVE.map((audience, i) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-300 hover:border-violet-300/30 hover:bg-white/[0.05]"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 transition-all duration-300 group-hover:border-violet-300/40"
                  style={{
                    background: "linear-gradient(145deg, rgba(139,92,246,0.22), rgba(59,130,246,0.12))",
                    boxShadow: "0 0 0 rgba(139,92,246,0)",
                  }}
                >
                  <audience.icon className="h-5 w-5 text-violet-200 transition-all duration-300 group-hover:drop-shadow-[0_0_6px_rgba(196,181,253,0.6)]" />
                </div>
                <span className="text-[11px] font-mono text-white/35">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="mt-5 text-[16px] font-semibold text-white">{audience.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/75">
                {audience.description}
              </p>

              <ul className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
                {audience.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-[12.5px] text-white/85">
                    <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
