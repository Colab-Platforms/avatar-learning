/**
 * Pure rules for which API a deployment may talk to. No environment reads and no side effects, so next.config.ts, the runtime
 * helpers and the unit tests can all share it.
 *
 * Only Vercel PREVIEW deployments are restricted. Production, local development and everything else behave exactly as before
 * (the variable is used as given, even when empty).
 *
 * Why: NEXT_PUBLIC_API_BASE_URL is baked into the bundle at build time. A Preview that inherits the production value silently
 * sends logins and bookings to the production backend. A Preview must have its own development API or it must not work.
 */

/** Production API hosts that a Preview must never use. */
export const PRODUCTION_API_HOSTS: readonly string[] = ["avatar-learning.onrender.com"];

export const API_BASE_VAR = "NEXT_PUBLIC_API_BASE_URL";

export type ApiBaseCheck = { ok: true; base: string } | { ok: false; base: ""; reason: string };

export function checkApiBase(deployEnv: string | undefined, raw: string | undefined): ApiBaseCheck {
  // Not a Vercel Preview: unchanged behaviour.
  if (deployEnv !== "preview") return { ok: true, base: raw ?? "" };

  const value = (raw ?? "").trim();
  const fix = `Set ${API_BASE_VAR} for the Vercel "Preview" environment to the development backend, e.g. https://<dev-service>.onrender.com/api.`;
  if (!value) return { ok: false, base: "", reason: `${API_BASE_VAR} is not set for this Preview deployment, so it has no API to call. ${fix}` };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, base: "", reason: `${API_BASE_VAR} is not a valid absolute URL for this Preview deployment. ${fix}` };
  }
  const host = url.hostname.toLowerCase();
  const local = host === "localhost" || host === "127.0.0.1";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) {
    return { ok: false, base: "", reason: `${API_BASE_VAR} must be an https URL for a Preview deployment. ${fix}` };
  }
  if (PRODUCTION_API_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    return { ok: false, base: "", reason: `${API_BASE_VAR} points at the PRODUCTION API (${host}) in a Preview deployment. Blocked so previews never touch production. ${fix}` };
  }
  return { ok: true, base: value };
}
