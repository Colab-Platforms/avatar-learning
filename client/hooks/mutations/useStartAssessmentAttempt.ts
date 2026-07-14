"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startAssessmentAttempt } from "@/lib/assessmentApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useStartAssessmentAttempt(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startAssessmentAttempt(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessment(courseId) });
    },
  });
}
