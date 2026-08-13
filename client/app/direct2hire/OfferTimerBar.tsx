"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";

export const OFFER_BAR_HEIGHT = 40;
const PROMO_CODE = "FREEDOM90";

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
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied; ignore
    }
  };

  return (
    <div
      className="fixed inset-x-0 top-0 z-60 flex items-center justify-center overflow-hidden border-b border-white/10 bg-linear-to-r from-orange-600 via-brand-700 to-green-700 px-2 text-center shadow-[0_2px_10px_rgba(0,0,0,0.25)] animate-[offer-glow_2.6s_ease-in-out_infinite]"
      style={{ height: OFFER_BAR_HEIGHT }}
    >
      {/* Desktop/Tablet View */}
      <p className="hidden sm:flex relative z-10 flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 sm:gap-x-2 text-[10px] xs:text-[11px] sm:text-[12.5px] font-semibold text-white">
        <Link
          href="/direct2hire"
          className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 sm:gap-x-2"
        >
          <span className="hidden sm:inline">Independence Day Offer</span>
          <span className="sm:hidden">Independence Offer</span>

          <span className="inline-flex items-center rounded-full bg-white px-2 py-px text-[10px] sm:text-[11.5px] font-extrabold text-orange-700 shadow-sm animate-[badge-pop_1.8s_ease-in-out_infinite]">
            90% OFF
          </span>

          <span className="text-white/90">
            Direct2Hire —{" "}
            <span className="line-through decoration-white decoration-2">
              ₹999
            </span>{" "}
            <span className="font-extrabold text-green-300">₹99</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={handleCopy}
          title="Copy code"
          className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-px text-white transition-all hover:bg-white/20 hover:border-white/45 active:scale-95"
        >
          Code: <span className="font-mono font-extrabold">{PROMO_CODE}</span>
          {copied ? (
            <Check className="h-3 w-3 text-green-300" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>

        <Link
          href="/direct2hire"
          className="hidden md:inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-px text-white/95"
        >
          Ends 16th August
        </Link>
      </p>

      {/* Mobile Scrolling Marquee View */}
      <div className="flex sm:hidden w-full overflow-hidden relative items-center justify-start h-full">
        <div className="animate-marquee whitespace-nowrap flex items-center select-none py-1">
          <div className="flex items-center gap-4 text-[10.5px] font-semibold text-white px-4">
            <Link
              href="/direct2hire"
              className="flex items-center gap-1.5"
            >
              <span>Independence Offer</span>
              <span className="inline-flex items-center rounded-full bg-white px-1.5 py-px text-[9.5px] font-extrabold text-orange-700 shadow-sm">
                90% OFF
              </span>
              <span className="text-white/90">
                Direct2Hire —{" "}
                <span className="line-through decoration-white">₹999</span>{" "}
                <span className="font-extrabold text-green-300">₹99</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={handleCopy}
              title="Copy code"
              className="inline-flex items-center gap-0.5 rounded-full border border-white/20 bg-white/10 px-2 py-px text-white active:scale-95 transition-all hover:bg-white/20 hover:border-white/45"
            >
              Code: <span className="font-mono font-extrabold">{PROMO_CODE}</span>
              {copied ? (
                <Check className="h-2.5 w-2.5 text-green-300" />
              ) : (
                <Copy className="h-2.5 w-2.5" />
              )}
            </button>

            <span className="text-white/80">Ends 16th August</span>
            <span className="mx-2 text-white/35 font-normal select-none">•</span>
          </div>

          {/* Repeated duplicate for seamless loop */}
          <div className="flex items-center gap-4 text-[10.5px] font-semibold text-white px-4" aria-hidden="true">
            <Link
              href="/direct2hire"
              className="flex items-center gap-1.5"
            >
              <span>Independence Offer</span>
              <span className="inline-flex items-center rounded-full bg-white px-1.5 py-px text-[9.5px] font-extrabold text-orange-700 shadow-sm">
                90% OFF
              </span>
              <span className="text-white/90">
                Direct2Hire —{" "}
                <span className="line-through decoration-white">₹999</span>{" "}
                <span className="font-extrabold text-green-300">₹99</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={handleCopy}
              title="Copy code"
              className="inline-flex items-center gap-0.5 rounded-full border border-white/20 bg-white/10 px-2 py-px text-white active:scale-95 transition-all hover:bg-white/20 hover:border-white/45"
            >
              Code: <span className="font-mono font-extrabold">{PROMO_CODE}</span>
              {copied ? (
                <Check className="h-2.5 w-2.5 text-green-300" />
              ) : (
                <Copy className="h-2.5 w-2.5" />
              )}
            </button>

            <span className="text-white/80">Ends 16th August</span>
            <span className="mx-2 text-white/35 font-normal select-none">•</span>
          </div>
        </div>
      </div>

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
        @keyframes marquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 16s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
