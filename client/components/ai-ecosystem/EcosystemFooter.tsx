import Image from "next/image";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { SOCIAL_LINKS } from "@/data/navigation";

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
};

const COLUMNS = [
  {
    title: "Services",
    links: [
      { label: "CRM", href: "#services" },
      { label: "OMS", href: "#services" },
      { label: "AI Content Writing", href: "#services" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Why Avatar", href: "#why-avatar" },
      { label: "Book a Demo", href: "#book-demo" },
    ],
  },
];

export function EcosystemFooter() {
  return (
    <footer className="relative border-t border-white/[0.08] py-8">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Image
              src="/landingpage-images/Avatar_logo_Light.svg"
              alt="Avatar"
              width={120}
              height={32}
              className="h-7 w-auto"
            />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-white/95">
              AI-powered solutions to manage, automate and scale modern
              business — presented here as an internal prototype for review.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map((s) => {
                const Icon = SOCIAL_ICONS[s.platform];
                if (!Icon) return null;
                return (
                  <a
                    key={s.platform}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/95 hover:border-white/25 hover:text-white transition-all duration-200"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-white/95">
                {col.title}
              </h4>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-[14.5px] text-white/95 hover:text-white transition-colors duration-200"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.08] pt-4 text-[13px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Avatar India. All rights reserved.</p>
          <p>Internal prototype — for review purposes only.</p>
        </div>
      </div>
    </footer>
  );
}
