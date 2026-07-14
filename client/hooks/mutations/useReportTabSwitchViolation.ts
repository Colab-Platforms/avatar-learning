"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportTabSwitchViolation } from "@/lib/assessmentApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useReportTabSwitchViolation(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reportTabSwitchViolation(attemptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessmentAttempt(attemptId) });
    },
  });
}
