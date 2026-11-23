"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBusinessMe, type BusinessAdminMe } from "@/lib/businessAdminApi";

/**
 * The signed-in person's Business Admin access, as decided by the server (GET /api/business-admin/me).
 * 403 means "not a Business Admin" and is a normal answer (null), not an error. Refetches when the tab regains focus and
 * every minute, so a role or permission change made by a Super Admin shows up without a new login.
 */
export function useBusinessAccess(userId: string | undefined, opts: { quiet?: boolean; enabled?: boolean } = {}) {
  return useQuery<BusinessAdminMe | null>({
    queryKey: ["business-admin", "me", userId ?? null, ...(opts.quiet ? ["quiet"] : [])],
    enabled: !!userId && opts.enabled !== false,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
    queryFn: async () => {
      try {
        return await fetchBusinessMe({ quiet: opts.quiet });
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) return null;
        throw err;
      }
    },
  });
}
