"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminStudentPlacementOverrides } from "@/lib/adminPlacementApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useAdminStudentPlacementOverrides(userId: string, courseId?: string) {
  return useQuery({
    queryKey: queryKeys.adminStudentPlacementOverrides(userId, courseId),
    queryFn: () => fetchAdminStudentPlacementOverrides(userId, courseId),
    enabled: !!userId,
  });
}
