import { ArrowRight } from "lucide-react";
import { SITE } from "@/data/site";
import { FOOTER_COLUMNS, SOCIAL_LINKS } from "@/data/navigation";
import type { SocialLink } from "@/types";

/* Avatar India official wordmark */
function AvatarWordmark() {
  return (
    <svg
      viewBox="0 0 119 32"
      className="h-5.5 w-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Avatar India"
    >
      <path
        d="M0 31.8526L4.29275 25.9658H11.2396L6.93694 31.8526H0Z"
        fill="white"
      />
      <path
        d="M8.19231 31.8539L12.8842 25.2436H4.80493L8.71551 19.7409H16.4577L26.3688 6.30249L29.4177 11.9491L15.3521 31.8539H8.19231Z"
        fill="#809DB1"
      />
      <path
        d="M9.25952 18.9733H15.9694L25.8805 5.39938L22.9642 0L9.25952 18.9733Z"
        fill="white"
      />
      <path
        d="M40.1713 31.8539H30.8102L24.333 20.699L29.8386 12.7256L33.6857 19.7409H35.0296L38.4142 26.0034H37.1196L40.1713 31.8539Z"
        fill="white"
      />
      <path
        d="M56.3448 19.6055L60.6799 29.3707L65.3548 19.6055H67.7353L62.0408 31.8539H59.532L54.135 19.6055H56.3448Z"
        fill="white"
      />
      <path
        d="M44.13 31.8539L48.4651 22.0887L53.14 31.8539H55.5205L49.8259 19.6055H47.3171L41.9202 31.8539H44.13Z"
        fill="white"
      />
      <path
        d="M46.927 31.7718L48.7166 28.702L50.5062 31.7718H46.927Z"
        fill="#809DB1"
      />
      <path
        d="M68.5626 31.8539L72.8977 22.0887L77.574 31.8539H79.9531L74.2585 19.6055H71.7512L66.3528 31.8539H68.5626Z"
        fill="white"
      />
      <path
        d="M71.3621 31.7718L73.1516 28.702L74.9412 31.7718H71.3621Z"
        fill="#809DB1"
      />
      <path
        d="M92.9952 31.8539L97.3317 22.0887L102.007 31.8539H104.386L98.6912 19.6055H96.1838L90.7854 31.8539H92.9952Z"
        fill="white"
      />
      <path
        d="M95.7961 31.7718L97.5857 28.702L99.3753 31.7718H95.7961Z"
        fill="#809DB1"
      />
      <path
        d="M84.1469 31.8539H86.4428L86.4371 21.4853H90.359L90.366 19.6055H80.3886L80.3816 21.611H84.0158L84.1469 31.8539Z"
        fill="white"
      />
      <path
        d="M109.136 31.7719V27.6714H111.69L115.1 31.7719H118.097L114.333 27.5136C114.333 27.5136 117.361 26.8502 117.424 23.8516C117.424 23.8516 117.706 21.8628 115.927 20.2846C115.877 20.219 114.859 19.5193 113.982 19.5235H107.001V21.6184L113.865 21.5933C114.067 21.6025 114.265 21.6543 114.445 21.7451C114.626 21.8358 114.784 21.9636 114.911 22.1198C115.14 22.4103 115.305 22.9047 115.276 23.5402C115.275 23.8152 115.235 24.0887 115.158 24.353C114.982 24.8893 115.096 24.8879 114.099 25.4703L113.525 25.5388L107.097 25.6519L107.001 31.7761L109.136 31.7719Z"
        fill="white"
      />
    </svg>
  );
}

/* Inline social icons to avoid deprecated lucide brand icons */
function FacebookSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M23.5 6.2a3.01 3.01 0 0 0-2.12-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.57A3.01 3.01 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3.01 3.01 0 0 0 2.12 2.13C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.57a3.01 3.01 0 0 0 2.12-2.13C24 15.9 24 12 24 12s0-3.9-.5-5.8z" />
      <path d="M9.5 15.5V8.5L15.8 12L9.5 15.5Z" fill="" />
    </svg>
  );
}

function InstagramSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
function LinkedInSvg() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const SOCIAL_ICON_MAP: Record<SocialLink["platform"], React.ElementType> = {
  facebook: FacebookSvg,
  instagram: InstagramSvg,
  linkedin: LinkedInSvg,
  youtube: YoutubeSvg,
};

export function Footer() {
  return (
    <footer className="relative bg-ink-950 text-white overflow-hidden">
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-brand-500/20 to-transparent" />

      {/* Background orb */}
      <div
        className="absolute bottom-0 right-0 w-125 h-75 pointer-events-none opacity-[0.05]"
        style={{
          background:
            "radial-gradient(circle at right bottom, #00C8FF 0%, transparent 65%)",
          filter: "blur(90px)",
        }}
      />

      <div className="container-x py-16">
        {/* Main grid */}
        <div className="grid gap-10 md:grid-cols-5 border border-white/5 rounded-3xl bg-white/1.5 p-8 sm:p-10">
          {/* Brand column */}
          <div className="md:col-span-1">
            <AvatarWordmark />
            <p className="mt-5 text-[13px] text-white/35 leading-[1.75] whitespace-pre-line">
              {SITE.copyright}
            </p>

            {/* Social icons */}
            <div className="mt-6 flex items-center gap-2">
              {SOCIAL_LINKS.map((link) => {
                const Icon = SOCIAL_ICON_MAP[link.platform];
                return (
                  <a
                    key={link.platform}
                    href={link.href}
                    aria-label={link.label}
                    className="flex items-center justify-center h-8 w-8 rounded-lg border border-white/6 bg-white/2.5
                               text-white/35 hover:text-brand-300 hover:border-brand-500/25 hover:bg-brand-500/8
                               transition-all duration-250"
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Nav columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h5 className="text-[12px] font-semibold tracking-[0.15em] uppercase text-white/35 mb-5">
                {col.title}
              </h5>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-[13px] text-white/42 hover:text-brand-300 transition-colors duration-250
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

        {/* Bottom bar */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-[12px] text-white/20">
          <span>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
