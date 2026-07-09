"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let loadPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay SDK")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });

  return loadPromise;
}

export function useRazorpay() {
  const [loaded, setLoaded] = useState(
    typeof window !== "undefined" && Boolean(window.Razorpay),
  );

  useEffect(() => {
    if (loaded) return;
    let cancelled = false;

    loadRazorpayScript()
      .then(() => {
        if (!cancelled) setLoaded(true);
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, [loaded]);

  return loaded;
}
