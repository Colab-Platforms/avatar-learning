"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank" | "_top" | "_modal";
      }) => Promise<{ error?: { message?: string }; paymentDetails?: unknown }>;
    };
  }
}

const CASHFREE_SCRIPT = "https://sdk.cashfree.com/js/v3/cashfree.js";

let loadPromise: Promise<void> | null = null;

function loadCashfreeScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Cashfree) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CASHFREE_SCRIPT}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Cashfree SDK")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = CASHFREE_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
    document.body.appendChild(script);
  });

  return loadPromise;
}

export function useCashfree() {
  const [loaded, setLoaded] = useState(
    typeof window !== "undefined" && Boolean(window.Cashfree),
  );

  useEffect(() => {
    if (loaded) return;
    let cancelled = false;

    loadCashfreeScript()
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
