"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportPlacementTabSwitchViolation } from "@/lib/direct2hire/placementApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useReportPlacementTabSwitchViolation(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reportPlacementTabSwitchViolation(attemptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.placementAttempt(attemptId) });
    },
  });
}
