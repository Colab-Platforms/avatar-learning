"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Sparkles, X } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import {
  dismissGuestPrompt,
  isGuestPromptDismissed,
} from "@/lib/quiz/careerQuizPromptStorage";
import { trackCareerQuizEvent } from "@/lib/analytics/careerQuizAnalytics";
import { cn } from "@/lib/utils";

const SHOW_DELAY_MS = 3000;
const SCROLL_THRESHOLD = 0.25;
const BLOCKING_CHECK_INTERVAL_MS = 600;

// const EXCLUDED_PREFIXES = [
//   "/login",
//   "/register",
//   "/forgot-password",
//   "/reset-password",
//   "/dashboard",
//   "/admin",
//   "/quiz",
//   "/direct2hire",
//   "/checkout",
//   "/payment",
//   "/profile",
//   "/partner-dashboard",
//   "/onboarded",
//   "/partners/onboarding",
// ];

function isExcludedPath(pathname: string | null): boolean {
  return pathname !== "/";
}

function isBlockingOverlayOpen(): boolean {
  if (typeof window === "undefined") return true;
  if ((window as Window & { __isChatbotOpen?: boolean }).__isChatbotOpen) {
    return true;
  }
  const dialogs = document.querySelectorAll(
    '[role="dialog"]:not([data-career-quiz-dialog])',
  );
  return dialogs.length > 0;
}

export function CareerQuizPrompt() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasHydrated } = useAppSelector((s) => s.auth);

  const [isOpen, setIsOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const shownRef = useRef(false);

  const [isEntered, setIsEntered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const isLoggedIn = Boolean(user);
  const excluded = isExcludedPath(pathname);

  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser(
    hasHydrated && isLoggedIn && !excluded && !sessionDismissed,
  );

  const quizCompleted =
    currentUser?.quizCompleted === true || user?.quizCompleted === true;

  const isEligibleAudience =
    hasHydrated &&
    !excluded &&
    !sessionDismissed &&
    !(isLoggedIn && isUserLoading) &&
    !(isLoggedIn && quizCompleted) &&
    !(!isLoggedIn && isGuestPromptDismissed());

  const openPrompt = useCallback(() => {
    if (shownRef.current || sessionDismissed) return false;
    if (isBlockingOverlayOpen()) return false;

    shownRef.current = true;
    setIsOpen(true);
    trackCareerQuizEvent("popup_displayed", {
      authenticated: isLoggedIn,
      path: pathname ?? "",
    });
    return true;
  }, [isLoggedIn, pathname, sessionDismissed]);

  // Track responsive screen and motion preference states
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaMobile = window.matchMedia("(max-width: 639px)");
    setIsMobile(mediaMobile.matches);
    const handleMobileChange = (e: MediaQueryListEvent) =>
      setIsMobile(e.matches);
    mediaMobile.addEventListener("change", handleMobileChange);

    const mediaMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaMotion.matches);
    const handleMotionChange = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mediaMotion.addEventListener("change", handleMotionChange);

    return () => {
      mediaMobile.removeEventListener("change", handleMobileChange);
      mediaMotion.removeEventListener("change", handleMotionChange);
    };
  }, []);

  // Reset trigger state when route / eligibility basis changes
  useEffect(() => {
    setIsOpen(false);
    setArmed(false);
    setIsEntered(false);
    shownRef.current = false;
  }, [pathname, excluded, quizCompleted]);

  // Arm after ~4s OR 25% scroll — whichever comes first
  useEffect(() => {
    if (!isEligibleAudience || armed || shownRef.current) return;

    let didArm = false;
    const markArmed = () => {
      if (didArm) return;
      didArm = true;
      setArmed(true);
    };

    const timer = window.setTimeout(markArmed, SHOW_DELAY_MS);

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable >= SCROLL_THRESHOLD) {
        markArmed();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isEligibleAudience, armed]);

  // Open when armed; wait if another modal/chatbot is open
  useEffect(() => {
    if (!isEligibleAudience || !armed || isOpen || sessionDismissed) return;
    if (shownRef.current) return;

    if (openPrompt()) return;

    const id = window.setInterval(() => {
      if (shownRef.current || sessionDismissed) {
        window.clearInterval(id);
        return;
      }
      if (openPrompt()) {
        window.clearInterval(id);
      }
    }, BLOCKING_CHECK_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [armed, isEligibleAudience, isOpen, openPrompt, sessionDismissed]);

  // Handle escape key listener for dismissing dialog
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function handleDismiss() {
    setIsOpen(false);
    setSessionDismissed(true);
    if (!isLoggedIn) {
      dismissGuestPrompt();
    }
    trackCareerQuizEvent("popup_dismissed", {
      authenticated: isLoggedIn,
      path: pathname ?? "",
    });
  }

  function handleTakeQuiz() {
    setIsOpen(false);
    setSessionDismissed(true);
    trackCareerQuizEvent("quiz_started", {
      source: "career_quiz_prompt",
      authenticated: isLoggedIn,
    });
    router.push("/quiz");
  }

  const enableAnimations = !prefersReducedMotion;
  const enableFloating = enableAnimations && !isMobile;

  const entranceInitial = enableAnimations
    ? { opacity: 0, y: isMobile ? 120 : 60 }
    : { opacity: 0, y: 0 };

  const entranceAnimate = enableAnimations
    ? isEntered && enableFloating
      ? { y: [0, -3, 0], opacity: 1 }
      : { opacity: 1, y: 0 }
    : { opacity: 1, y: 0 };

  const motionTransition = enableAnimations
    ? isEntered && enableFloating
      ? { y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }
      : { type: "spring" as const, duration: 0.55, bounce: 0.12 }
    : { duration: 0.25 };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-6 sm:right-auto z-40 w-full sm:w-[350px] md:w-[380px] lg:w-[400px] pointer-events-none">
          <motion.div
            initial={entranceInitial}
            animate={entranceAnimate}
            exit={entranceInitial}
            transition={motionTransition}
            onAnimationComplete={() => setIsEntered(true)}
            className="relative w-full pointer-events-auto"
          >
            {/* Subtle floating aura / soft background glow */}
            {enableFloating && (
              <motion.div
                animate={{
                  opacity: [0.35, 0.65, 0.35],
                  scale: [0.97, 1.03, 0.97],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -inset-1.5 -z-10 rounded-3xl bg-gradient-to-tr from-brand-300/30 to-brand-500/25 blur-xl pointer-events-none"
              />
            )}

            <motion.div
              whileHover={enableFloating ? { y: -4 } : {}}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              role="dialog"
              aria-modal="true"
              data-career-quiz-dialog="true"
              aria-labelledby="career-quiz-prompt-title"
              className={cn(
                "relative w-full bg-white",
                "shadow-[0_20px_50px_rgba(15,23,42,0.12)] sm:shadow-[0_24px_60px_rgba(15,23,42,0.15)]",
                "rounded-t-3xl rounded-b-none sm:rounded-2xl border-t border-x border-border sm:border sm:border-slate-100/90 sm:hover:border-slate-200/90",
                "px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-7 transition-shadow duration-300",
              )}
            >
              {/* Drag indicator / accent line for mobile bottom sheet */}
              <div
                className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-200 sm:hidden"
                aria-hidden
              />

              <button
                type="button"
                onClick={handleDismiss}
                className="absolute right-4 top-4 rounded-full p-1.5 text-text-subtle hover:bg-surface-alt hover:text-text active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-start text-left">
                {/* AI themed illustration / icon */}
                {/* <div className="relative mb-4.5 inline-flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-brand-500/8 blur-md" />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/10">
                    <Brain className="h-5.5 w-5.5" />
                    
                    <div className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-400 text-slate-900 border-2 border-white shadow-sm">
                      <Sparkles className="h-2 w-2 fill-current" />
                    </div>
                  </div>
                </div> */}

                {/* Pill Badge */}
                <div className="mb-3.5 inline-flex">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-brand-700 border border-brand-100 uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                    FREE • 2 MINUTES
                  </span>
                </div>

                {/* Heading */}
                <h3
                  id="career-quiz-prompt-title"
                  className="text-lg sm:text-[19px] font-bold text-text tracking-tight mb-2 pr-6 leading-snug"
                >
                  Discover Your Ideal Career in AI
                </h3>

                {/* Supporting Text */}
                <p className="text-[13.5px] text-text-muted leading-relaxed mb-6">
                  Take our free Career Quiz and receive personalized career
                  recommendations based on your interests and strengths.
                </p>

                {/* Actions */}
                <div className="flex w-full flex-col-reverse sm:flex-row items-stretch gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-text-muted hover:bg-slate-50 hover:text-text active:scale-[0.98] transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-100"
                  >
                    Maybe Later
                  </button>
                  <button
                    type="button"
                    onClick={handleTakeQuiz}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 text-[13px] font-semibold shadow-sm hover:shadow-brand-100 active:scale-[0.98] transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                    Take Quiz
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
