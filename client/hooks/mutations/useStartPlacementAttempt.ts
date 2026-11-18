"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startPlacementAttempt } from "@/lib/direct2hire/placementApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useStartPlacementAttempt(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startPlacementAttempt(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.placementAssessment(courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.placementAttemptHistory(courseId) });
    },
  });
}
