import type { AuthUser } from "@/store/authSlice";

/** Paths an incomplete-profile user may still visit. */
export const PROFILE_INCOMPLETE_ALLOWED_PREFIXES = [
  "/complete-profile",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

export function needsProfileCompletion(
  user: Pick<AuthUser, "profileCompleted"> | null | undefined,
): boolean {
  if (!user) return false;
  // Only an explicit false forces onboarding (legacy localStorage may omit the field)
  return user.profileCompleted === false;
}

export function isProfileIncompleteAllowedPath(pathname: string): boolean {
  return PROFILE_INCOMPLETE_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
