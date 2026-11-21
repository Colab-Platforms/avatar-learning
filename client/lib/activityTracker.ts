/**
 * First-party visit tracking rules (pure, so they are unit-tested). The browser holds ONE random id in localStorage, sends a page
 * view on each navigation and a heartbeat every 30 seconds while the tab is visible. There is no fingerprinting: nothing about the
 * device is read beyond the User-Agent header the browser already sends with every request. Form contents, keystrokes and
 * query strings are never sent.
 */

export const VISITOR_KEY = "av_vid";
export const HEARTBEAT_MS = 30_000;
export const CONSENT_KEY = "avatar-analytics-consent";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const ID_RE = /^[A-Za-z0-9_-]{20,64}$/;
export const isValidVisitorId = (v: unknown): v is string => typeof v === "string" && ID_RE.test(v);

/** A random, URL-safe id from the browser's crypto source (never derived from device characteristics). */
export function newVisitorId(cryptoLike: Pick<Crypto, "getRandomValues"> | undefined = typeof crypto !== "undefined" ? crypto : undefined): string {
  const bytes = new Uint8Array(24);
  if (cryptoLike) cryptoLike.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The saved id, or a new one saved for next time. Null when storage is blocked (then nothing is tracked, rather than creating an id per page). */
export function getOrCreateVisitorId(storage: StorageLike | null, make: () => string = newVisitorId): string | null {
  try {
    const existing = storage?.getItem(VISITOR_KEY);
    if (isValidVisitorId(existing)) return existing;
    const id = make();
    storage?.setItem(VISITOR_KEY, id);
    return storage?.getItem(VISITOR_KEY) === id ? id : null;
  } catch {
    return null;
  }
}

/** Visit tracking runs only with the visitor's analytics consent (the same choice as the cookie banner), unless the site owner turned the requirement off. */
export function trackingAllowed(input: { consent: "granted" | "denied" | null; requireConsent?: boolean }): boolean {
  return input.requireConsent === false ? input.consent !== "denied" : input.consent === "granted";
}

/** Administrators' own screens are not visitor activity. */
export function trackablePath(pathname: string | null | undefined): boolean {
  if (!pathname || !pathname.startsWith("/")) return false;
  return !/^\/(admin|admin-adaption|dev-adaption-login)(\/|$)/i.test(pathname);
}

export const pageViewBody = (visitorId: string, path: string, referrer?: string | null) => ({ visitorId, path, ...(referrer ? { referrer } : {}) });
export const heartbeatBody = (visitorId: string, path: string) => ({ visitorId, path });

export function readConsent(storage: StorageLike | null): "granted" | "denied" | null {
  try {
    const v = storage?.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export interface TrackResult { tracked?: boolean; terminated?: boolean }
/** True when an administrator ended this sign-in: the page should sign out locally. */
export const wasTerminated = (r: TrackResult | null | undefined): boolean => r?.terminated === true;
