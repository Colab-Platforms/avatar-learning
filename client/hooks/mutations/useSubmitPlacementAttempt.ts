"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitPlacementAttempt } from "@/lib/direct2hire/placementApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useSubmitPlacementAttempt(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submitPlacementAttempt(attemptId),
    onSuccess: async () => {
      // Await so results page receives fresh allowance (remaining attempts, canStartNewAttempt)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.placementAttempt(attemptId) }),
        queryClient.invalidateQueries({ queryKey: ["placement-assessment"] }),
        queryClient.invalidateQueries({ queryKey: ["placement-attempt-history"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.placementResult(attemptId) }),
      ]);
    },
  });
}
