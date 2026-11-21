"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Routes where the chatbot / help widget / career-quiz prompt should never
// mount (e.g. standalone prototype pages with their own dark theme/CTAs).
// "/" is the AI Adaptation Ecosystem page; "/ai-adaption-ecosystem" now just
// redirects there but is kept here in case anything still links to it mid-flight.
// The whole Avatar AI Adoption site has no chatbot / help bubble / quiz prompt
// (those belong to Avatar Learning): its own routes are listed here.
const EXCLUDED_PATHS = ["/", "/tools", "/blogs", "/insights", "/thank-you", "/faq", "/book-demo"];
// /admin-adaption is the internal Business Admin: no public-site chatbot, help bubble or quiz prompt there.
const EXCLUDED_PATH_PREFIXES = ["/ai-adaption-ecosystem", "/admin-adaption", "/adoption/", "/blogs/", "/insights/"];
// Shared with Avatar Learning: /investors is the Adoption version only with ?theme=dark
// (every Adoption link adds it; Learning links don't).
const SHARED_INVESTORS_PREFIX = "/investors";
// Shared legal pages: hide the widgets only when the visitor came from an Adoption page in this tab.
const SHARED_LEGAL_PATHS = ["/privacy-policy", "/terms-and-conditions"];
const SITE_KEY = "avatar-last-site"; // "adoption" | "learning", sessionStorage

function isAdoptionRoute(pathname: string, search: string) {
  if (EXCLUDED_PATHS.includes(pathname) || EXCLUDED_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname === "/adoption") return true;
  return pathname.startsWith(SHARED_INVESTORS_PREFIX) && new URLSearchParams(search).get("theme") === "dark";
}

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
  const pathname = usePathname() ?? "";
  // Paths alone decide most routes on the first render (no flash on Adoption pages).
  const pathExcluded =
    EXCLUDED_PATHS.includes(pathname) || EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || pathname === "/adoption";
  // Query/session-dependent cases (Adoption /investors?theme=dark, legal pages reached from Adoption)
  // are read from window in an effect — useSearchParams here would need a Suspense boundary in the root layout.
  const [contextExcluded, setContextExcluded] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const search = window.location.search;
    const adoption = isAdoptionRoute(pathname, search);
    const legal = SHARED_LEGAL_PATHS.includes(pathname);
    let lastSite: string | null = null;
    try {
      if (!legal) sessionStorage.setItem(SITE_KEY, adoption ? "adoption" : "learning");
      else lastSite = sessionStorage.getItem(SITE_KEY);
    } catch {}
    setContextExcluded(adoption || (legal && lastSite === "adoption"));
  }, [pathname]);

  const isExcluded = pathExcluded || contextExcluded !== false;

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
