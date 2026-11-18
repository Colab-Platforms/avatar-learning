"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportTabSwitchViolation } from "@/lib/assessmentApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useReportTabSwitchViolation(attemptId: string, courseId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reportTabSwitchViolation(attemptId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessmentAttempt(attemptId) });
      if (result.autoSubmitted && courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.assessmentsAll(courseId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.enrolledCourseAll(courseId) });
      }
    },
  });
}
