"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startAssessmentAttempt } from "@/lib/assessmentApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useStartAssessmentAttempt(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessmentId: string) => startAssessmentAttempt(courseId, assessmentId),
    onSuccess: (_data, assessmentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments(courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessment(courseId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentDetail(courseId, assessmentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentHistory(courseId, assessmentId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.enrolledCourse(courseId) });
    },
  });
}
