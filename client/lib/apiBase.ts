import { checkApiBase } from "./apiBaseCheck";

/**
 * The API base URL every frontend request uses, checked once. NEXT_PUBLIC_DEPLOY_ENV is copied from Vercel's VERCEL_ENV at
 * build time by next.config.ts (production | preview | development); it is empty everywhere else (local dev, other hosts).
 * The literal process.env.NEXT_PUBLIC_* reads below are what Next inlines into the bundle.
 */
const check = checkApiBase(process.env.NEXT_PUBLIC_DEPLOY_ENV, process.env.NEXT_PUBLIC_API_BASE_URL);

export const API_BASE_URL: string = check.base;
/** Non-null only for a Vercel Preview with a missing/invalid/production API URL. Every request must then be refused. */
export const API_BASE_ERROR: string | null = check.ok ? null : check.reason;

if (API_BASE_ERROR && typeof window !== "undefined") {
  console.error(`[api] ${API_BASE_ERROR}`);
}

/** Throws (instead of letting a request go to a wrong or empty host) when the API base is not allowed. */
export function assertApiBase(): void {
  if (API_BASE_ERROR) throw new Error(API_BASE_ERROR);
}
