"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CLARITY_CONSENT_V2_GRANTED,
  GTM_ID,
  META_PIXEL_ID,
  clarityProjectId,
  isPrivatePath,
  readConsent,
  shouldLoadClarity,
  shouldLoadTrackers,
  shouldShowBanner,
  writeConsent,
  type ConsentChoice,
} from "@/lib/clarityConsent";

const PROJECT_ID = clarityProjectId(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID);

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[] };
type TrackerWindow = Window & { clarity?: ClarityFn; dataLayer?: unknown[]; fbq?: unknown; _fbq?: unknown };

const FIELD_SELECTOR = "input, textarea, select";

/** Marks every form field (now and any added later) so Clarity never records what a visitor types, whatever the project's masking mode. */
function maskFields() {
  const mark = (root: ParentNode) => root.querySelectorAll(FIELD_SELECTOR).forEach((el) => el.setAttribute("data-clarity-mask", "True"));
  mark(document);
  new MutationObserver((records) => {
    for (const r of records) {
      r.addedNodes.forEach((n) => {
        if (!(n instanceof Element)) return;
        if (n.matches(FIELD_SELECTOR)) n.setAttribute("data-clarity-mask", "True");
        mark(n);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}

function addScript(id: string, src: string, onload?: () => void) {
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  s.src = src;
  if (onload) s.onload = onload;
  document.head.appendChild(s);
}

function injectClarity(projectId: string) {
  const w = window as TrackerWindow;
  if (document.getElementById("ms-clarity")) return;
  // Mask before the tag can record anything.
  maskFields();
  w.clarity = w.clarity || function (...args: unknown[]) { (w.clarity!.q = w.clarity!.q || []).push(args); };
  // Tell Clarity the visitor accepted (documented Consent API v2). Sent twice on purpose: now, so it is queued by the
  // stub and cannot be lost if acceptance happens before the tag has loaded, and again once the real tag is running.
  w.clarity(...CLARITY_CONSENT_V2_GRANTED);
  addScript("ms-clarity", `https://www.clarity.ms/tag/${projectId}`, () => w.clarity?.(...CLARITY_CONSENT_V2_GRANTED));
}

/** Google Tag Manager and the Meta Pixel: same loaders as before, but only ever started after acceptance on a public page. */
function injectMarketingTags() {
  const w = window as TrackerWindow;
  if (!document.getElementById("gtm-loader")) {
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    addScript("gtm-loader", `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`);
  }
  if (!document.getElementById("meta-pixel-loader") && !w.fbq) {
    // Standard Meta Pixel bootstrap: calls made before fbevents.js loads are queued and replayed.
    const fbq = function () {
      // eslint-disable-next-line prefer-rest-params
      const args = arguments;
      if (typeof (fbq as unknown as { callMethod?: unknown }).callMethod === "function") (fbq as unknown as { callMethod: { apply: (t: unknown, a: unknown) => void } }).callMethod.apply(fbq, args);
      else (fbq as unknown as { queue: unknown[] }).queue.push(args);
    } as unknown as Record<string, unknown> & ((...a: unknown[]) => void);
    w.fbq = fbq;
    if (!w._fbq) w._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    addScript("meta-pixel-loader", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", META_PIXEL_ID);
    fbq("track", "PageView");
  }
}

/**
 * Loads every tracker (Microsoft Clarity, Google Tag Manager, Meta Pixel) only on public pages and only after the visitor accepts.
 * Never runs on private pages (admin, login, payment, dashboard...). If a visitor who already has trackers running
 * navigates into a private area, the page is reloaded once so the tags are gone before anything private is shown.
 */
export function AnalyticsConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentChoice | null>(null);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    setConsent(readConsent(typeof window === "undefined" ? null : window.localStorage));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (shouldLoadTrackers({ pathname, consent })) {
      injectMarketingTags();
      if (shouldLoadClarity({ pathname, consent, projectId: PROJECT_ID }) && PROJECT_ID) injectClarity(PROJECT_ID);
      loaded.current = true;
    } else if (loaded.current && isPrivatePath(pathname)) {
      loaded.current = false;
      window.location.reload();
    }
  }, [pathname, consent, ready]);

  if (!ready || !shouldShowBanner({ pathname, consent })) return null;

  const choose = (choice: ConsentChoice) => {
    writeConsent(window.localStorage, choice);
    setConsent(choice);
  };

  return (
    <div role="dialog" aria-label="Analytics consent" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-xl sm:left-auto sm:right-4">
      <p>
        We use Microsoft Clarity (clicks, scrolling and page views; text you type into forms is masked), Google Tag Manager and the Meta Pixel to understand and improve this site and our advertising. Nothing loads until you accept.{" "}
        <Link href="/privacy-policy" className="underline">Privacy policy</Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => choose("granted")} className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700">Accept</button>
        <button type="button" onClick={() => choose("denied")} className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">Decline</button>
      </div>
    </div>
  );
}
