"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles, Database, Workflow, Users2, Zap, TrendingUp, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

const initialForm = { name: "", email: "", phone: "", company: "", message: "" };

// Closing visual: the same five business layers from the hero's radar,
// converging on one core as the final CTA comes into view.
const CTA_NODES: { icon: LucideIcon; x: number; y: number }[] = [
  { icon: Database, x: 12, y: 18 },
  { icon: Zap, x: 50, y: 8 },
  { icon: Workflow, x: 88, y: 18 },
  { icon: Users2, x: 16, y: 86 },
  { icon: TrendingUp, x: 84, y: 86 },
];

export function BookDemoSection() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onOpenRequest = () => setOpen(true);
    window.addEventListener("aie:open-book-demo", onOpenRequest);
    return () => window.removeEventListener("aie:open-book-demo", onOpenRequest);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast.success("Demo request received", {
      description: "This is a prototype — no request was actually sent.",
    });
    setForm(initialForm);
    setOpen(false);
  };

  return (
    <section id="book-demo" className="relative flex min-h-[100svh] items-center py-20 sm:py-24 scroll-mt-24">
      <div className="relative mx-auto w-full max-w-[1100px] px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[36px] border border-white/10 px-8 py-8 text-center sm:px-16 sm:py-10"
          style={{
            background:
              "radial-gradient(ellipse 120% 100% at 50% -10%, rgba(124,58,237,0.28) 0%, transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 40px 100px -30px rgba(124,58,237,0.35)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
            aria-hidden
          />

          {/* AI core — the five business layers converging on one point as the CTA lands, closing the page's visual thread */}
          <div className="pointer-events-none absolute inset-0 hidden sm:block" aria-hidden>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
              <defs>
                <linearGradient id="aieCtaStream" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              {CTA_NODES.map((n, i) => (
                <motion.line
                  key={i}
                  x1={n.x}
                  y1={n.y}
                  x2={50}
                  y2={50}
                  stroke="url(#aieCtaStream)"
                  strokeWidth={0.25}
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </svg>

            <motion.div
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(196,181,253,0.4) 0%, transparent 72%)" }}
              initial={{ opacity: 0.25, scale: 0.8 }}
              whileInView={{ opacity: [0.25, 0.7, 0.5], scale: [0.8, 1.15, 1] }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.4, delay: 0.8, ease: "easeInOut" }}
            />

            {CTA_NODES.map((n, i) => (
              <motion.div
                key={i}
                className="absolute flex h-7 w-7 items-center justify-center rounded-full border border-white/12"
                style={{
                  left: `${n.x}%`,
                  top: `${n.y}%`,
                  transform: "translate(-50%, -50%)",
                  background: "linear-gradient(145deg, rgba(147,197,253,0.2), rgba(124,58,237,0.12))",
                  boxShadow: "0 0 14px rgba(59,130,246,0.28)",
                }}
                initial={{ opacity: 0, x: (n.x - 50) * 0.18, y: (n.y - 50) * 0.18 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <n.icon className="h-[46%] w-[46%] text-violet-200" strokeWidth={1.5} />
              </motion.div>
            ))}
          </div>

          <div className="relative inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1 text-[12px] font-medium uppercase tracking-[0.2em] text-violet-200">
            <Sparkles className="h-3 w-3" />
            Book a Demo
          </div>

          <h2 className="relative mt-5 text-3xl font-extralight tracking-tight text-white sm:text-5xl">
            See Avatar in action.
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-white/90">
            Walk through CRM, OMS, and AI Content Writing with our team —
            tailored to how your business actually runs.
          </p>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative mt-7 inline-flex items-center gap-2.5 overflow-hidden rounded-full px-8 py-4 text-[15px] font-semibold text-white cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 16px 40px -8px rgba(124,58,237,0.6)",
            }}
          >
            <span className="relative z-10">Book a Demo</span>
            <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Book a demo"
              className="relative max-h-[90vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-[#0b0b12] p-7 sm:p-8"
              style={{ boxShadow: "0 30px 90px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)" }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/90 hover:border-white/25 hover:text-white transition-all duration-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-xl font-semibold text-white">Request a demo</h3>
              <p className="mt-1.5 text-[14px] text-white/95">
                
              </p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-white/90">
                    Full name
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors duration-200 focus:border-violet-400/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-white/90">
                    Work email
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="jane@company.com"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors duration-200 focus:border-violet-400/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-white/90">
                    Contact number
                  </label>
                  <div className="flex items-stretch overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition-colors duration-200 focus-within:border-violet-400/50">
                    <span className="flex select-none items-center border-r border-white/10 px-4 text-[15px] text-white/90">
                      +91
                    </span>
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                        }))
                      }
                      placeholder="98765 43210"
                      title="Enter a 10-digit mobile number"
                      className="w-full bg-transparent px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-white/90">
                    Company
                  </label>
                  <input
                    required
                    type="text"
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="Company name"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors duration-200 focus:border-violet-400/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-white/90">
                    What are you looking to solve? (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us a bit about your team..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors duration-200 focus:border-violet-400/50"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                    boxShadow: "0 12px 30px -8px rgba(124,58,237,0.6)",
                  }}
                >
                  Request Demo <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
