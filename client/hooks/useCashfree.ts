"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Cashfree: (options: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank" | "_top" | "_modal";
      }) => Promise<{ error?: { message?: string }; paymentDetails?: unknown }>;
    };
  }
}

const CASHFREE_SCRIPT = "https://sdk.cashfree.com/js/v3/cashfree.js";

export function useCashfree() {
  const [loaded, setLoaded] = useState(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Cashfree) {
      setLoaded(true);
      return;
    }
    if (document.querySelector(`script[src="${CASHFREE_SCRIPT}"]`)) return;

    const script = document.createElement("script");
    script.src = CASHFREE_SCRIPT;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => console.error("Failed to load Cashfree SDK");
    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current) {
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, []);

  return loaded;
}
