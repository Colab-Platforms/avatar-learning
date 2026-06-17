import { Facebook, Instagram, Linkedin, ArrowRight } from "lucide-react";
import { SITE } from "@/data/site";
import { FOOTER_COLUMNS, SOCIAL_LINKS } from "@/data/navigation";
import type { SocialLink } from "@/types";

function AvatarLogo() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M16 3 L29 27 H3 Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11 22 H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const SOCIAL_ICONS: Record<SocialLink["platform"], React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
};

export function Footer() {
  return (
    <footer className="relative bg-ink-950 text-white overflow-hidden">

      {/* Top glow divider */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/25 to-transparent" />

      {/* Background orb */}
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[300px] pointer-events-none opacity-[0.06]"
        style={{ background: "radial-gradient(circle at right bottom, #2F7BFF 0%, transparent 65%)", filter: "blur(80px)" }}
      />

      <div className="container-x py-16">

        {/* Main grid */}
        <div className="grid gap-10 md:grid-cols-5 border border-white/[0.06] rounded-3xl bg-white/[0.018] p-8 sm:p-10">

          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <AvatarLogo />
              <span className="font-bold tracking-[0.2em] text-[13px]">{SITE.name}</span>
            </div>
            <p className="mt-5 text-[13px] text-white/40 leading-[1.75] whitespace-pre-line">
              {SITE.copyright}
            </p>

            {/* Social icons */}
            <div className="mt-6 flex items-center gap-2">
              {SOCIAL_LINKS.map((link) => {
                const Icon = SOCIAL_ICONS[link.platform];
                return (
                  <a
                    key={link.platform}
                    href={link.href}
                    aria-label={link.label}
                    className="flex items-center justify-center h-8 w-8 rounded-lg border border-white/[0.08] bg-white/[0.03]
                               text-white/40 hover:text-white hover:border-white/20 hover:bg-white/[0.07]
                               transition-all duration-250"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Nav columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h5 className="text-[12px] font-semibold tracking-[0.15em] uppercase text-white/45 mb-5">
                {col.title}
              </h5>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-[13px] text-white/48 hover:text-white transition-colors duration-250
                                 inline-flex items-center gap-1 group"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-250">
                        {item.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter bar */}
        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.018] px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-[14px] font-semibold text-white/85">Stay in the loop</p>
            <p className="text-[12px] text-white/38 mt-0.5">Latest courses, hackathons & AI news</p>
          </div>
          <form className="flex gap-2 sm:min-w-[360px]">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 rounded-full bg-white/[0.05] border border-white/[0.08] px-4 py-2.5 text-[13px] text-white placeholder-white/30
                         focus:outline-none focus:border-brand-500/60 focus:bg-white/[0.07] transition-all duration-250"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 text-white px-5 py-2.5 text-[13px] font-medium
                         hover:bg-brand-600 hover:scale-[1.04] active:scale-[0.97]
                         shadow-[0_2px_12px_rgba(47,123,255,0.3)] hover:shadow-[0_4px_24px_rgba(47,123,255,0.5)]
                         transition-all duration-250"
            >
              Subscribe
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-[12px] text-white/25">
          <span>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
          <div className="flex items-center gap-5">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <a key={item} href="#" className="hover:text-white/60 transition-colors duration-250">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
