"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitAssessmentAttempt } from "@/lib/assessmentApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useSubmitAssessmentAttempt(attemptId: string, courseId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submitAssessmentAttempt(attemptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessmentAttempt(attemptId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessmentResult(attemptId) });
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.assessmentsAll(courseId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.assessment(courseId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.enrolledCourseAll(courseId) });
        queryClient.invalidateQueries({ queryKey: ["assessment-history", courseId] });
      }
    },
  });
}
