"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const OFFER_BAR_HEIGHT = 40;

const OFFER_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours
const DEADLINE_KEY = "d2h_offer_deadline_v2";

function readDeadline() {
  const stored = Number(localStorage.getItem(DEADLINE_KEY));
  if (stored && stored > Date.now()) return stored;
  const next = Date.now() + OFFER_WINDOW_MS;
  localStorage.setItem(DEADLINE_KEY, String(next));
  return next;
}

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function useOfferCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let deadline = readDeadline();
    setRemaining(deadline - Date.now());

    const timer = setInterval(() => {
      const left = deadline - Date.now();
      if (left <= 0) {
        deadline = Date.now() + OFFER_WINDOW_MS;
        localStorage.setItem(DEADLINE_KEY, String(deadline));
      }
      setRemaining(deadline - Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return remaining === null ? "--:--:--" : formatRemaining(remaining);
}

export function OfferTimerBar() {
  // const label = useOfferCountdown();

  // return (
  //   <div
  //     className="fixed inset-x-0 top-0 z-60 flex items-center justify-center bg-linear-to-r from-brand-700 via-brand-600 to-brand-700 px-3 text-center"
  //     style={{ height: OFFER_BAR_HEIGHT }}
  //   >
  //     <p className="text-[11px] sm:text-[12.5px] font-semibold text-white truncate">
  //       Batch enrolment offer ends in{" "}
  //       <span className="font-mono tabular-nums">{label}</span>
  //     </p>
  //   </div>
  // );

  return (
    <Link
      href="/direct2hire"
      className="fixed inset-x-0 top-0 z-60 flex items-center justify-center overflow-hidden border-b border-white/10 bg-linear-to-r from-orange-600 via-brand-700 to-green-700 px-2 text-center shadow-[0_2px_10px_rgba(0,0,0,0.25)] animate-[offer-glow_2.6s_ease-in-out_infinite]"
      style={{ height: OFFER_BAR_HEIGHT }}
    >
      <p className="relative z-10 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 sm:gap-x-2 text-[10px] xs:text-[11px] sm:text-[12.5px] font-semibold text-white">
        {/* <Sparkles
          aria-hidden
          className="hidden xs:block h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-300 animate-pulse"
        /> */}

        <span className="hidden sm:inline">Independence Day Offer</span>
        <span className="sm:hidden">Independence Offer</span>

        <span className="inline-flex items-center rounded-full bg-white px-2 py-px text-[10px] sm:text-[11.5px] font-extrabold text-orange-700 shadow-sm animate-[badge-pop_1.8s_ease-in-out_infinite]">
          90% OFF
        </span>

        <span className="text-white/90">
          Direct2Hire —{" "}
          <span className="line-through decoration-white/60">₹999</span>{" "}
          <span className="font-extrabold text-green-300">₹99</span>
        </span>

        <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-px text-white/95">
          Ends 16th August
        </span>

        {/* <Sparkles
          aria-hidden
          className="hidden xs:block h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-300 animate-pulse"
        /> */}
      </p>

      <style jsx>{`
        @keyframes offer-glow {
          0%,
          100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.18);
          }
        }
        @keyframes badge-pop {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
      `}</style>
    </Link>
  );
}
