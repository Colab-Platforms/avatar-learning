"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitAssessmentAttempt } from "@/lib/assessmentApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useSubmitAssessmentAttempt(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submitAssessmentAttempt(attemptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessmentAttempt(attemptId) });
    },
  });
}
