"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminStudentPlacementSummary } from "@/lib/adminPlacementApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useAdminStudentPlacementSummary(userId: string, courseId?: string) {
  return useQuery({
    queryKey: queryKeys.adminStudentPlacementSummary(userId, courseId),
    queryFn: () => fetchAdminStudentPlacementSummary(userId, courseId),
    enabled: !!userId,
  });
}
