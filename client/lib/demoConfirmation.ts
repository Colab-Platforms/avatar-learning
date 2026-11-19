"use client";

/**
 * Hand-off from the Book a Demo form to /thank-you.
 *
 * The form saves the backend's confirmation here only after the server has
 * stored the request; /thank-you reads it. It lives in sessionStorage (this tab
 * only) — never in the URL — and holds no personal details, just the request
 * id, the confirmed tools and the time.
 */

export type DemoConfirmation = { id: string; tools: string[]; createdAt: string };

const KEY = "adoption_demo_confirmation";
const TRACKED_KEY = "adoption_demo_tracked"; // request ids already reported as conversions

export function saveDemoConfirmation(c: DemoConfirmation) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* storage blocked: /thank-you will show its neutral version */
  }
}

export function readDemoConfirmation(): DemoConfirmation | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as DemoConfirmation;
    return typeof c?.id === "string" && Array.isArray(c.tools) ? c : null;
  } catch {
    return null;
  }
}

type Fbq = (...args: unknown[]) => void;
declare global {
  interface Window {
    fbq?: Fbq;
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Reports one lead conversion per confirmed request, through the analytics the
 * site already loads (Meta Pixel + Google Tag Manager in app/layout.tsx).
 * Refreshing or revisiting /thank-you doesn't report it again; Meta also gets
 * the request id as eventID so it can de-duplicate on its side.
 */
export function trackDemoLeadOnce(c: DemoConfirmation) {
  let tracked: string[] = [];
  try {
    tracked = JSON.parse(localStorage.getItem(TRACKED_KEY) ?? "[]");
  } catch {
    tracked = [];
  }
  if (tracked.includes(c.id)) return false;
  try {
    window.fbq?.("track", "Lead", { content_name: "AI Adoption demo request", content_category: c.tools.join(",") }, { eventID: `demo-${c.id}` });
  } catch {
    /* analytics must never break the page */
  }
  try {
    (window.dataLayer = window.dataLayer || []).push({
      event: "generate_lead",
      lead_type: "ai_adoption_demo",
      conversion_page: "/thank-you",
      event_id: `demo-${c.id}`, // same id Meta receives, for cross-platform de-duplication
      demo_request_id: c.id,
      demo_tools: c.tools.join(","),
    });
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(TRACKED_KEY, JSON.stringify([...tracked, c.id].slice(-50)));
  } catch {
    /* ignore */
  }
  return true;
}
