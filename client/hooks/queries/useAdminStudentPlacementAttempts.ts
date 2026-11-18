"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminStudentPlacementAttempts } from "@/lib/adminPlacementApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useAdminStudentPlacementAttempts(userId: string, courseId?: string) {
  return useQuery({
    queryKey: queryKeys.adminStudentPlacementAttempts(userId, courseId),
    queryFn: () => fetchAdminStudentPlacementAttempts(userId, courseId),
    enabled: !!userId,
  });
}
