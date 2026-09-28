"use client";

import { motion } from "framer-motion";
import { SectionEyebrow } from "./SectionEyebrow";
import { GOALS } from "./data";

// The same restrained dot-line-label motif used in Pricing and Who We Serve —
// a recurring visual signature rather than one literal line across the page.
const JOURNEY_STAGES = ["Understand", "Build", "Automate", "Transform", "Scale"];

export function AboutUsSection() {
  return (
    <>
      <section id="about" className="relative overflow-hidden bg-[#05050a] py-12 scroll-mt-24 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 15% 30%, rgba(59,130,246,0.08) 0%, transparent 65%)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8">
          {/* ── About Us introduction ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-2xl text-center"
          >
            <SectionEyebrow number="05" label="About Us" />

            <h2 className="mt-3 text-4xl font-extralight leading-[1.1] tracking-tight text-white sm:text-6xl">
              Building the Ecosystem{" "}
              <span
                className="bg-clip-text font-light text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, #C4B5FD 0%, #93C5FD 100%)",
                }}
              >
                for the AI Era
              </span>
            </h2>

            <div className="mt-4 flex flex-col gap-2 text-left text-[15.5px] leading-relaxed text-white/90">
              <p>
                Avatar India is an{" "}
                <span className="font-medium text-white/95">AI Adaption Ecosystem</span> helping
                individuals, businesses, and organizations understand, learn,
                adopt, and implement AI. From AI learning and career
                development to{" "}
                <span className="font-medium text-white/95">
                  AI solutions and business implementation
                </span>
                , we bring together the knowledge, technology, and talent
                needed to make AI practical and accessible.
              </p>
              <p>
                Our ecosystem connects{" "}
                <span className="font-medium text-white/95">
                  learning, talent, AI solutions, and implementation
                </span>{" "}
                — helping individuals build relevant AI skills and helping
                businesses turn AI opportunities into real-world outcomes.
              </p>
            </div>
          </motion.div>

          {/* ── AI journey timeline ── */}
          <div className="relative mx-auto mt-10 hidden max-w-3xl items-center px-6 sm:mt-14 sm:flex">
            <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="absolute left-0 right-0 h-1 w-full px-6">
              <defs>
                <linearGradient id="aieJourneyLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <motion.line
                x1="4"
                y1="2"
                x2="96"
                y2="2"
                stroke="url(#aieJourneyLine)"
                strokeWidth="0.6"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="relative flex w-full justify-between">
              {JOURNEY_STAGES.map((stage, i) => (
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
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#05050a] py-12 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 85% 70%, rgba(124,58,237,0.08) 0%, transparent 65%)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8">
          {/* ── Goals introduction ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-2xl text-center"
          >
            <SectionEyebrow number="06" label="Our Goals" />
            <h3 className="mt-3 text-2xl font-extralight tracking-tight text-white sm:text-3xl">
              What We Aim to Achieve
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-white/90">
              Our goals focus on making AI easier to learn, adopt, implement,
              and scale across individuals and businesses.
            </p>
          </motion.div>

          {/* ── goal cards — dashboard-style dials, no invented metrics, purely conceptual ── */}
          <div className="mx-auto mt-8 grid max-w-[1100px] grid-cols-1 gap-3.5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
            {GOALS.map((goal, i) => (
              <motion.div
                key={goal.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition-colors duration-300 hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className="relative flex h-8 w-8 items-center justify-center">
                  <svg viewBox="0 0 32 32" className="absolute inset-0 h-full w-full -rotate-90">
                    <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                    <motion.circle
                      cx="16"
                      cy="16"
                      r="13"
                      fill="none"
                      stroke="url(#aieGoalDial)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeDasharray="81.7"
                      initial={{ strokeDashoffset: 81.7 }}
                      whileInView={{ strokeDashoffset: 20 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <defs>
                      <linearGradient id="aieGoalDial" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#C4B5FD" />
                        <stop offset="100%" stopColor="#93C5FD" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-[10px] font-mono text-white/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h4 className="mt-2.5 text-[14.5px] font-semibold text-white">{goal.title}</h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/95">{goal.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
