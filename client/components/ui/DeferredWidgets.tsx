"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const idleWindow = window as IdleWindow;
    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(() => setMounted(true), {
        timeout: 2500,
      });
      return () => idleWindow.cancelIdleCallback?.(id);
    }
    const timer = setTimeout(() => setMounted(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <ChatbotAgent />
      <HelpWidget />
      <CareerQuizPrompt />
    </>
  );
}
