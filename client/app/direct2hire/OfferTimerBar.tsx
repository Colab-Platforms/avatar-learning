"use client";

import { useEffect, useState } from "react";

export const OFFER_BAR_HEIGHT = 36;

const OFFER_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours
const DEADLINE_KEY = "d2h_offer_deadline";

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
  const label = useOfferCountdown();

  return (
    <div
      className="fixed inset-x-0 top-0 z-60 flex items-center justify-center bg-linear-to-r from-brand-700 via-brand-600 to-brand-700 px-3 text-center"
      style={{ height: OFFER_BAR_HEIGHT }}
    >
      <p className="text-[11px] sm:text-[12.5px] font-semibold text-white truncate">
        Batch enrolment offer ends in{" "}
        <span className="font-mono tabular-nums">{label}</span>
      </p>
    </div>
  );
}
