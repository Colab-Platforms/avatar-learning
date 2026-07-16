"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminStudentPlacementAttempts } from "@/lib/adminPlacementApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useAdminStudentPlacementAttempts(userId: string) {
  return useQuery({
    queryKey: queryKeys.adminStudentPlacementAttempts(userId),
    queryFn: () => fetchAdminStudentPlacementAttempts(userId),
    enabled: !!userId,
  });
}
