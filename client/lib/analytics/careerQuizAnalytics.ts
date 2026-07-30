/**
 * Lightweight analytics seam for Career Quiz funnel events.
 * Wire to Meta Pixel / Clarity / GA later without touching UI call sites.
 */
export type CareerQuizAnalyticsEvent =
  | "popup_displayed"
  | "popup_dismissed"
  | "quiz_started"
  | "quiz_completed"
  | "login_after_quiz"
  | "registration_after_quiz";

export type CareerQuizAnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>;

export function trackCareerQuizEvent(
  event: CareerQuizAnalyticsEvent,
  props?: CareerQuizAnalyticsProps,
): void {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[career-quiz]", event, props ?? {});
  }

  if (typeof window === "undefined") return;

  try {
    const fbq = (
      window as Window & {
        fbq?: (...args: unknown[]) => void;
      }
    ).fbq;
    fbq?.("trackCustom", `CareerQuiz_${event}`, props ?? {});
  } catch {
    /* analytics must never break UX */
  }
}
