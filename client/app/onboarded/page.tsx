"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export default function OnboardedPage() {
  const router = useRouter();

  useEffect(() => {
    window.fbq?.("track", "CompleteRegistration");
    router.replace("/");
  }, [router]);

  return null;
}
