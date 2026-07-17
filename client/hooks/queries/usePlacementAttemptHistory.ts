"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPlacementAttemptHistory } from "@/lib/direct2hire/placementApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function usePlacementAttemptHistory(courseId: string) {
  return useQuery({
    queryKey: queryKeys.placementAttemptHistory(courseId),
    queryFn: () => fetchPlacementAttemptHistory(courseId),
    enabled: !!courseId,
  });
}
