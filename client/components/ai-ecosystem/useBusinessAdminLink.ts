"use client";

import { useEffect, useState } from "react";
import { useBusinessAccess } from "@/hooks/queries/useBusinessAccess";
import { businessNav, ADMIN_PANEL_HREF } from "@/lib/businessNav";
import type { AdoptionUser } from "@/lib/adoptionSession";

export { ADMIN_PANEL_HREF };

/**
 * Whether the signed-in website account should see "Business Admin Panel" in its account menu.
 *
 * Visibility comes from the SERVER (GET /api/business-admin/me), never from a role the browser claims. Only Business Admin staff
 * receive a Learning session at sign-in (see adoptionSession.ts), so a normal account has no token to send and nothing is asked.
 * The probe is quiet: it never signs anyone out or redirects. This only decides whether a link is DRAWN; /admin-adaption and
 * every /api/business-admin endpoint still enforce access on their own.
 */
export function useBusinessAdminLink(user: Pick<AdoptionUser, "id"> | null | undefined): boolean {
  const [hasLearningSession, setHasLearningSession] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth");
      setHasLearningSession(!!(raw && JSON.parse(raw)?.accessToken));
    } catch {
      setHasLearningSession(false);
    }
  }, [user?.id]);

  const { data } = useBusinessAccess(user?.id, { quiet: true, enabled: hasLearningSession });
  return hasLearningSession && businessNav(data).showAdminPanel;
}
