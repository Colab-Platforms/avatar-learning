"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  isProfileIncompleteAllowedPath,
  needsProfileCompletion,
} from "@/lib/auth/profileCompletion";

/**
 * Client-side gate: authenticated users with an incomplete profile are forced
 * onto /complete-profile for any non-allowlisted route. Public marketing pages
 * remain reachable.
 */
export function ProfileCompletionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasHydrated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!hasHydrated || !user) return;
    if (!needsProfileCompletion(user)) return;
    if (isProfileIncompleteAllowedPath(pathname)) return;

    // Protected app surfaces only — leave public pages alone
    const protectedPrefixes = [
      "/dashboard",
      "/profile",
      "/partner-dashboard",
      "/partners/onboarding",
      "/direct2hire",
      "/admin",
      "/onboarded",
    ];
    const isProtected = protectedPrefixes.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (isProtected) {
      router.replace(`/complete-profile?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [hasHydrated, user, pathname, router]);

  return <>{children}</>;
}
