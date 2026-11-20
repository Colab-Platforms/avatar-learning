/**
 * Microsoft Clarity loading rules for the PUBLIC website.
 * Pure functions (no DOM access except where a storage object is passed in) so they can be unit-tested.
 *
 * Rules:
 *  - Clarity runs only on public marketing pages, never on private/authenticated/payment/admin pages.
 *  - Clarity runs only after the visitor accepted analytics. No decision or "decline" means it is never loaded.
 */

export const CONSENT_KEY = "avatar-analytics-consent";
export type ConsentChoice = "granted" | "denied";

/** Used when NEXT_PUBLIC_CLARITY_PROJECT_ID is not set (the project the site already used). */
export const DEFAULT_CLARITY_PROJECT_ID = "xsy8mmymts";

/** Path prefixes where session recording must never run. Matched on a segment boundary ("/admin" does not match "/administer"). */
export const PRIVATE_PREFIXES = [
  "/admin",
  "/admin-adaption",
  "/dev-adaption-login",
  "/login",
  "/register",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/payment",
  "/checkout",
  "/enroll",
  "/dashboard",
  "/profile",
  "/partner-dashboard",
  "/onboarded",
  "/complete-profile",
];

export function isPrivatePath(pathname: string | null | undefined): boolean {
  if (!pathname) return true; // unknown path: fail closed
  const p = pathname.toLowerCase();
  return PRIVATE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

export function clarityProjectId(env: string | undefined): string | null {
  const v = (env ?? DEFAULT_CLARITY_PROJECT_ID).trim();
  // Clarity project IDs are short alphanumeric strings; anything else is a misconfiguration and is not injected into a script URL.
  return /^[a-z0-9]{6,20}$/i.test(v) ? v : null;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function readConsent(storage: StorageLike | null): ConsentChoice | null {
  try {
    const v = storage?.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(storage: StorageLike | null, choice: ConsentChoice): void {
  try {
    storage?.setItem(CONSENT_KEY, choice);
  } catch {
    /* storage blocked: the choice simply does not persist, and Clarity stays off */
  }
}

/**
 * Arguments for Clarity's documented Consent API v2, sent right after the visitor accepts:
 * window.clarity('consentv2', { ad_Storage: 'granted', analytics_Storage: 'granted' }).
 * https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2
 */
export const CLARITY_CONSENT_V2_GRANTED = ["consentv2", { ad_Storage: "granted", analytics_Storage: "granted" }] as const;

/** Third-party tags (Google Tag Manager, Meta Pixel) that were previously loaded unconditionally. */
export const GTM_ID = "GTM-N8M4PQML";
export const META_PIXEL_ID = "1593452955528348";

/** Every tracker (Clarity, Tag Manager, Meta Pixel) may run only after acceptance and only on public pages. */
export function shouldLoadTrackers(input: { pathname: string | null | undefined; consent: ConsentChoice | null }): boolean {
  return input.consent === "granted" && !isPrivatePath(input.pathname);
}

/** The single decision: should the Clarity tag be injected right now? */
export function shouldLoadClarity(input: { pathname: string | null | undefined; consent: ConsentChoice | null; projectId: string | null }): boolean {
  return input.consent === "granted" && !!input.projectId && !isPrivatePath(input.pathname);
}

/** Should the consent banner be shown? Only on public pages and only while undecided (it covers Clarity, Tag Manager and the Pixel). */
export function shouldShowBanner(input: { pathname: string | null | undefined; consent: ConsentChoice | null }): boolean {
  return input.consent === null && !isPrivatePath(input.pathname);
}
