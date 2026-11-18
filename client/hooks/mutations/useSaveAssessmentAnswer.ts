"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveAssessmentAnswer, type AttemptState } from "@/lib/assessmentApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useSaveAssessmentAnswer(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, selectedOptionId }: { questionId: string; selectedOptionId: string | null }) =>
      saveAssessmentAnswer(attemptId, questionId, selectedOptionId),
    onSuccess: (_data, { questionId, selectedOptionId }) => {
      queryClient.setQueryData<AttemptState>(queryKeys.assessmentAttempt(attemptId), (old) =>
        old ? { ...old, answers: { ...old.answers, [questionId]: selectedOptionId } } : old,
      );
    },
  });
}
