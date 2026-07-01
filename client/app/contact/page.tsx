"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  Check,
  X,
  Loader2,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal, AnimateOnScroll } from "@/components/ui";

/* ─── data ─────────────────────────────────────────────────────────── */

const CONTACT_INFO = [
  {
    icon: Phone,
    label: "Call Us",
    value: "+91 9136774304",
    sub: "Mon–Sat, 9am–9pm",
    href: "tel:+919136774304",
    color: "text-brand-400",
    bg: "bg-brand-500/10 border-brand-500/15",
    hoverBg:
      "group-hover:bg-brand-500/20 group-hover:border-brand-500/35 group-hover:shadow-[0_0_14px_rgba(0,200,255,0.15)]",
  },
  {
    icon: Mail,
    label: "Email Us",
    value: "support@avatarindia.com",
    sub: "We reply within 24h",
    href: "mailto:support@avatarindia.com",
    color: "text-elec-400",
    bg: "bg-elec-500/10 border-elec-500/15",
    hoverBg:
      "group-hover:bg-elec-500/20 group-hover:border-elec-500/35 group-hover:shadow-[0_0_14px_rgba(0,128,255,0.15)]",
  },
  {
    icon: MapPin,
    label: "Our Office",
    value: "Mumbai, Maharashtra, India",
    sub: "Visit us anytime",
    href: undefined,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/15",
    hoverBg:
      "group-hover:bg-emerald-500/20 group-hover:border-emerald-500/35 group-hover:shadow-[0_0_14px_rgba(16,185,129,0.15)]",
  },
];

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1JpYwqS4jQ/",
    bg: "bg-[#1877f2] hover:bg-[#1465d0]",
    svg: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/avatar.india/",
    bg: "bg-gradient-to-br from-purple-600 via-pink-500 to-rose-400 hover:opacity-90",
    svg: (
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@AvatarIndia-g1i",
    bg: "bg-[#ff0000] hover:bg-[#cc0000]",
    svg: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M23.5 6.2a3.01 3.01 0 0 0-2.12-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.57A3.01 3.01 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3.01 3.01 0 0 0 2.12 2.13C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.57a3.01 3.01 0 0 0 2.12-2.13C24 15.9 24 12 24 12s0-3.9-.5-5.8z" />
        <path d="M9.5 15.5V8.5L15.8 12L9.5 15.5Z" fill="#FF0000" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "",
    bg: "bg-[#0077b5] hover:bg-[#005e8f]",
    svg: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
];

const inputCls = cn(
  "w-full rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3",
  "text-[14px] text-white placeholder-white/22",
  "focus:outline-none focus:border-brand-500/50 focus:bg-white/[0.06]",
  "focus:ring-2 focus:ring-brand-500/10 transition-all duration-200",
);

/* ─── page ──────────────────────────────────────────────────────────── */

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setForm({ name: "", email: "", subject: "", message: "" });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main
        className="min-h-screen text-white overflow-x-hidden pt-16"
        style={{
          background:
            "linear-gradient(160deg,#060D1A 0%,#091220 25%,#060D1A 55%,#091525 80%,#060D1A 100%)",
        }}
      >
        {/* ambient layers */}
        <div
          className="pointer-events-none fixed inset-0 dot-grid-dark opacity-20"
          aria-hidden
        />
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] opacity-[0.10]"
          style={{
            background:
              "radial-gradient(ellipse at top,rgba(0,200,255,0.45) 0%,transparent 65%)",
            filter: "blur(70px)",
          }}
          aria-hidden
        />

        <div className="relative container-x py-20 max-w-7xl">
          {/* ── PAGE HEADER ── */}
          <ScrollReveal animation="fade-up">
            <div className="mb-3 flex items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg
                               bg-brand-500/10 border border-brand-500/20"
              >
                <MessageSquare className="h-4 w-4 text-brand-400" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400">
                We&apos;d love to hear from you
              </p>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
              Contact Us
            </h1>
            <p className="text-white/40 text-[15px] leading-relaxed max-w-lg">
              Have questions, feedback, or need assistance? Our team is ready to
              help — typically within 24 hours.
            </p>
          </ScrollReveal>

          {/* ── CONTACT INFO CARDS ── */}
          <ScrollReveal animation="fade-up" delay={80} className="mt-10">
            <div className="grid sm:grid-cols-3 gap-4">
              {CONTACT_INFO.map((info, i) => (
                <AnimateOnScroll key={info.label} delay={i * 70}>
                  <div
                    className="group h-full rounded-2xl border border-white/6 p-6
                               hover:border-white/12 hover:-translate-y-1 transition-all duration-300"
                    style={{
                      background:
                        "linear-gradient(145deg,rgba(13,23,39,0.85) 0%,rgba(9,18,32,0.95) 100%)",
                    }}
                  >
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl border mb-4 transition-all duration-350",
                        info.bg,
                        info.hoverBg,
                      )}
                    >
                      <info.icon className={cn("h-5 w-5", info.color)} />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5">
                      {info.label}
                    </p>
                    {info.href ? (
                      <Link
                        href={info.href}
                        className={cn(
                          "text-[14px] font-semibold text-white/80 hover:text-white transition-colors duration-200 block",
                        )}
                      >
                        {info.value}
                      </Link>
                    ) : (
                      <p className="text-[14px] font-semibold text-white/80">
                        {info.value}
                      </p>
                    )}
                    <p className="text-[12px] text-white/28 mt-1">{info.sub}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </ScrollReveal>

          {/* ── MAIN GRID: FORM + SIDEBAR ── */}
          <div className="mt-10 grid lg:grid-cols-[1fr_340px] gap-6 items-start">
            {/* ── CONTACT FORM ── */}
            <ScrollReveal animation="fade-up" delay={120}>
              <div
                className="rounded-2xl border border-white/7 overflow-hidden"
                style={{
                  background:
                    "linear-gradient(145deg,rgba(9,21,37,0.92) 0%,rgba(6,13,26,0.97) 100%)",
                  boxShadow:
                    "0 8px 40px rgba(0,0,0,0.3),inset 0 1px 0 rgba(0,200,255,0.05)",
                }}
              >
                {/* card header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
                  <div
                    className="h-7 w-7 rounded-lg bg-brand-500/10 border border-brand-500/15
                                  flex items-center justify-center"
                  >
                    <Send className="h-3.5 w-3.5 text-brand-400" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-white">
                      Send a Message
                    </h2>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      We typically respond within 24 hours
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  {/* success toast */}
                  {submitted && (
                    <div
                      className="flex items-center gap-2.5 rounded-xl border border-emerald-500/25
                                 bg-emerald-500/8 px-4 py-3 text-[13px] text-emerald-300 mb-6"
                      style={{
                        animation:
                          "fade-up-in 0.4s cubic-bezier(0.22,1,0.36,1) both",
                      }}
                    >
                      <Check className="h-4 w-4 shrink-0" />
                      Thank you! Your message has been sent. We&apos;ll get back
                      to you soon.
                    </div>
                  )}
                  {error && (
                    <div
                      className="flex items-center gap-2.5 rounded-xl border border-red-500/25
                                 bg-red-500/8 px-4 py-3 text-[13px] text-red-300 mb-6"
                      style={{
                        animation:
                          "fade-up-in 0.4s cubic-bezier(0.22,1,0.36,1) both",
                      }}
                    >
                      <X className="h-4 w-4 shrink-0" /> {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={set("name")}
                          required
                          placeholder="Full Name"
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                          Your Email
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={set("email")}
                          required
                          placeholder="email@example.com"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={set("subject")}
                        required
                        placeholder="How can we help?"
                        className={inputCls}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                        Your Message
                      </label>
                      <textarea
                        value={form.message}
                        onChange={set("message")}
                        required
                        placeholder="Write your message here..."
                        rows={6}
                        className={cn(inputCls, "resize-none")}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[11px] text-white/22 flex items-center gap-1.5">
                        <span className="h-3.5 w-3.5 opacity-50">🔒</span>
                        Your information is safe with us
                      </p>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-2.5
                                   text-[13px] font-semibold text-ink-950
                                   hover:bg-brand-400 hover:scale-[1.04]
                                   shadow-[0_2px_14px_rgba(0,200,255,0.35)]
                                   hover:shadow-[0_4px_24px_rgba(0,200,255,0.55)]
                                   disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                                   transition-all duration-250"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />{" "}
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" /> Send Message
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </ScrollReveal>

            {/* ── SIDEBAR ── */}
            <ScrollReveal animation="fade-left" delay={160}>
              <div className="space-y-4">
                {/* Get In Touch card */}
                <div
                  className="rounded-2xl border border-white/7 p-6"
                  style={{
                    background:
                      "linear-gradient(145deg,rgba(9,21,37,0.92) 0%,rgba(6,13,26,0.97) 100%)",
                    boxShadow:
                      "0 8px 40px rgba(0,0,0,0.3),inset 0 1px 0 rgba(0,200,255,0.05)",
                  }}
                >
                  <h3 className="text-[15px] font-semibold text-white mb-1.5">
                    Get In Touch
                  </h3>
                  <p className="text-[13px] text-white/38 leading-relaxed mb-5">
                    Have questions or need assistance? Our team is ready to help
                    you start your AI journey.
                  </p>

                  <div className="divider-glow mb-5" />

                  <div className="space-y-4">
                    {CONTACT_INFO.map((info) => (
                      <div key={info.label} className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                            info.bg,
                          )}
                        >
                          <info.icon
                            className={cn("h-3.5 w-3.5", info.color)}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-white/28 uppercase tracking-wider">
                            {info.label}
                          </p>
                          {info.href ? (
                            <Link
                              href={info.href}
                              className="text-[13px] text-white/65 hover:text-white transition-colors duration-200 truncate block"
                            >
                              {info.value}
                            </Link>
                          ) : (
                            <p className="text-[13px] text-white/65">
                              {info.value}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Follow us card */}
                <div
                  className="rounded-2xl border border-white/7 p-6"
                  style={{
                    background:
                      "linear-gradient(145deg,rgba(9,21,37,0.92) 0%,rgba(6,13,26,0.97) 100%)",
                  }}
                >
                  <h3 className="text-[14px] font-semibold text-white mb-4">
                    Follow Us
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {SOCIAL_LINKS.map((s) => (
                      <Link
                        key={s.label}
                        href={s.href}
                        aria-label={s.label}
                        className={cn(
                          "flex h-10 w-full items-center justify-center rounded-xl text-white",
                          "hover:scale-110 active:scale-95 transition-transform duration-200",
                          s.bg,
                        )}
                      >
                        {s.svg}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Quick link card */}
                <div
                  className="rounded-2xl border border-brand-500/15 p-6 relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(145deg,rgba(0,200,255,0.04) 0%,rgba(6,13,26,0.97) 100%)",
                    boxShadow: "0 0 30px rgba(0,200,255,0.05)",
                  }}
                >
                  <div
                    className="absolute top-0 inset-x-0 h-px"
                    style={{
                      background:
                        "linear-gradient(90deg,transparent,rgba(0,200,255,0.4) 50%,transparent)",
                    }}
                  />
                  <p className="text-[12px] text-brand-400/70 uppercase tracking-wider font-semibold mb-2">
                    Quick Links
                  </p>
                  <p className="text-[13px] text-white/40 mb-4">
                    Explore our programs or read about our story.
                  </p>
                  <div className="space-y-2">
                    <Link
                      href="/courses"
                      className="flex items-center justify-between w-full rounded-xl border border-white/6
                                 px-4 py-2.5 text-[13px] text-white/55
                                 hover:border-brand-500/30 hover:text-brand-300 hover:bg-brand-500/5
                                 transition-all duration-250"
                    >
                      Browse Programs <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/about"
                      className="flex items-center justify-between w-full rounded-xl border border-white/6
                                 px-4 py-2.5 text-[13px] text-white/55
                                 hover:border-brand-500/30 hover:text-brand-300 hover:bg-brand-500/5
                                 transition-all duration-250"
                    >
                      About Avatar <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
