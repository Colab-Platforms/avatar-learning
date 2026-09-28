"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SectionEyebrow } from "./SectionEyebrow";
import { CUSTOM_SOLUTION_EXAMPLES } from "./data";

export function CustomSolutionsSection() {
  return (
    <section className="relative py-12 sm:py-16">
      <div className="relative mx-auto w-full max-w-[1100px] px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[32px] border border-white/10 px-8 py-7 text-center sm:px-14 sm:py-9"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(59,130,246,0.14) 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <SectionEyebrow number="07" label="Beyond CRM, OMS & Content" className="text-blue-300/90" />
          <h2 className="mt-4 text-2xl font-extralight tracking-tight text-white sm:text-4xl">
            Need Customize Solution More?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15.5px] leading-relaxed text-white/90">
            Your business is unique. We can customize AI-powered solutions
            around your specific workflows, requirements and goals — the
            three services above are just examples of what's possible.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {CUSTOM_SOLUTION_EXAMPLES.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13.5px] text-white/92"
              >
                <c.icon className="h-3.5 w-3.5 text-violet-300" />
                {c.label}
              </span>
            ))}
          </div>

          <a
            href="#book-demo"
            className="group relative mt-7 inline-flex items-center gap-2.5 overflow-hidden rounded-full px-7 py-3.5 text-[15px] font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 16px 40px -8px rgba(124,58,237,0.55)",
            }}
          >
            <span className="relative z-10">Build Your Custom Solution</span>
            <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
