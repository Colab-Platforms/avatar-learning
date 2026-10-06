"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Routes where the chatbot / help widget / career-quiz prompt should never
// mount (e.g. standalone prototype pages with their own dark theme/CTAs).
// "/" is the AI Adaptation Ecosystem page; "/ai-adaption-ecosystem" now just
// redirects there but is kept here in case anything still links to it mid-flight.
const EXCLUDED_PATHS = ["/"];
const EXCLUDED_PATH_PREFIXES = ["/ai-adaption-ecosystem"];

// These three widgets (chatbot, help bubble, career-quiz prompt) are global
// but not part of first paint — none of them are visible until the user has
// been on the page for a few seconds or scrolls. Loading them via
// next/dynamic keeps framer-motion/react-markdown/pretext out of every
// route's main chunk, and mounting them only once the browser is idle keeps
// their JS from competing with hydrating the actual page content.
const ChatbotAgent = dynamic(() => import("./ChatbotAgent"), { ssr: false });
const HelpWidget = dynamic(
  () => import("./HelpWidget").then((m) => m.HelpWidget),
  { ssr: false },
);
const CareerQuizPrompt = dynamic(
  () => import("@/components/quiz/CareerQuizPrompt").then((m) => m.CareerQuizPrompt),
  { ssr: false },
);

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

export function DeferredWidgets() {
  const pathname = usePathname();
  const isExcluded =
    EXCLUDED_PATHS.some((p) => pathname === p) ||
    EXCLUDED_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isExcluded) return;
    const idleWindow = window as IdleWindow;
    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(() => setMounted(true), {
        timeout: 2500,
      });
      return () => idleWindow.cancelIdleCallback?.(id);
    }
    const timer = setTimeout(() => setMounted(true), 2000);
    return () => clearTimeout(timer);
  }, [isExcluded]);

  if (isExcluded || !mounted) return null;

  return (
    <>
      <ChatbotAgent />
      <HelpWidget />
      <CareerQuizPrompt />
    </>
  );
}
