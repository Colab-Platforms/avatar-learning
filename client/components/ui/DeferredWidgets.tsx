"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getLastSite, setLastSite, siteFromThemeParam } from "@/lib/siteContext";

// Routes where the chatbot / help widget / career-quiz prompt should never
// mount (e.g. standalone prototype pages with their own dark theme/CTAs).
// "/" is the AI Adaptation Ecosystem page; "/ai-adaption-ecosystem" now just
// redirects there but is kept here in case anything still links to it mid-flight.
// The whole Avatar AI Adoption site has no chatbot / help bubble / quiz prompt
// (those belong to Avatar Learning): its own routes are listed here.
const EXCLUDED_PATHS = ["/", "/about", "/tools", "/blogs", "/insights", "/thank-you", "/faq", "/book-demo"];
// /admin-adaption is the internal Business Admin: no public-site chatbot, help bubble or quiz prompt there.
const EXCLUDED_PATH_PREFIXES = ["/ai-adaption-ecosystem", "/admin-adaption", "/adoption/", "/blogs/", "/insights/"];
// Pages shared with Avatar Learning (/investors/*, legal pages): they belong to whichever
// site the visitor came from (lib/siteContext), so they read the recorded site and never
// overwrite it. Old /investors?theme=dark|light links still say which site.
const SHARED_INVESTORS_PREFIX = "/investors";
const SHARED_LEGAL_PATHS = ["/privacy-policy", "/terms-and-conditions"];

function isAdoptionRoute(pathname: string) {
  if (EXCLUDED_PATHS.includes(pathname) || EXCLUDED_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return pathname === "/adoption";
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
  // Shared pages (investors, legal) depend on the recorded site, read from window in an effect —
  // useSearchParams here would need a Suspense boundary in the root layout.
  const [contextExcluded, setContextExcluded] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const shared = SHARED_LEGAL_PATHS.includes(pathname) || pathname.startsWith(SHARED_INVESTORS_PREFIX);
    if (!shared) {
      const adoption = isAdoptionRoute(pathname);
      setLastSite(adoption ? "adoption" : "learning");
      setContextExcluded(adoption);
      return;
    }
    const legacy = pathname.startsWith(SHARED_INVESTORS_PREFIX)
      ? siteFromThemeParam(new URLSearchParams(window.location.search).get("theme"))
      : null;
    setContextExcluded((legacy ?? getLastSite()) === "adoption");
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
