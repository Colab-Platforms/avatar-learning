"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { API_ROOT } from "@/lib/adoptionSession";
import { API_BASE_ERROR } from "@/lib/apiBase";
import {
  HEARTBEAT_MS, getOrCreateVisitorId, heartbeatBody, pageViewBody, readConsent, trackablePath, trackingAllowed, wasTerminated, type TrackResult,
} from "@/lib/activityTracker";

const REQUIRE_CONSENT = process.env.NEXT_PUBLIC_TRACKING_REQUIRE_CONSENT !== "false";

function accessToken(): string | null {
  try {
    const raw = localStorage.getItem("auth");
    return raw ? (JSON.parse(raw) as { accessToken?: string }).accessToken ?? null : null;
  } catch {
    return null;
  }
}

async function send(path: "pageview" | "heartbeat", body: unknown): Promise<TrackResult | null> {
  try {
    const token = accessToken();
    const res = await fetch(`${API_ROOT}/track/${path}`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return ((await res.json()) as { data?: TrackResult }).data ?? null;
  } catch {
    return null; // tracking must never show an error or disturb the page
  }
}

/**
 * First-party visit tracking for Live Monitoring. Renders nothing. Sends a page view on every navigation and a heartbeat every 30s
 * while the tab is visible, only after the visitor accepted analytics (the same choice as the cookie banner). It never reads form
 * contents or keystrokes, and it sends no query strings. If an administrator ends this sign-in, the heartbeat tells us and we sign out.
 */
export function ActivityTracker() {
  const pathname = usePathname();
  const pathRef = useRef<string | null>(null);
  const sentFirst = useRef(false);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  // Page view on each navigation (and as soon as consent is given while on a page).
  useEffect(() => {
    if (API_BASE_ERROR || !trackablePath(pathname)) return;
    let cancelled = false;
    let last: string | null = null;
    const attempt = () => {
      if (cancelled || last === pathname) return;
      const id = trackingAllowed({ consent: readConsent(window.localStorage), requireConsent: REQUIRE_CONSENT }) ? getOrCreateVisitorId(window.localStorage) : null;
      if (!id || !pathname) return;
      last = pathname;
      const referrer = !sentFirst.current && document.referrer ? document.referrer : null;
      sentFirst.current = true;
      void send("pageview", pageViewBody(id, pathname, referrer)).then((r) => {
        if (wasTerminated(r)) signOutLocally();
      });
    };
    attempt();
    const poll = window.setInterval(attempt, 2000); // consent can be granted while this page is open
    const stop = window.setTimeout(() => window.clearInterval(poll), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.clearTimeout(stop);
    };
  }, [pathname]);

  // Heartbeat while the tab is visible.
  useEffect(() => {
    if (API_BASE_ERROR) return;
    const beat = () => {
      const path = pathRef.current;
      if (document.visibilityState !== "visible" || !trackablePath(path)) return;
      if (!trackingAllowed({ consent: readConsent(window.localStorage), requireConsent: REQUIRE_CONSENT })) return;
      const id = getOrCreateVisitorId(window.localStorage);
      if (!id || !path) return;
      void send("heartbeat", heartbeatBody(id, path)).then((r) => {
        if (wasTerminated(r)) signOutLocally();
      });
    };
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, []);

  return null;
}

/** An administrator ended this sign-in: drop the stored session and go to the sign-in page. */
function signOutLocally() {
  try {
    localStorage.removeItem("auth");
  } catch {
    /* storage blocked */
  }
  window.location.assign("/login?reason=session-ended");
}
