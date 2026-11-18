"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { savePlacementAnswer, type PlacementAttemptState } from "@/lib/direct2hire/placementApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useSavePlacementAnswer(attemptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, selectedOptionId }: { questionId: string; selectedOptionId: string | null }) =>
      savePlacementAnswer(attemptId, questionId, selectedOptionId),
    onSuccess: (_data, { questionId, selectedOptionId }) => {
      queryClient.setQueryData<PlacementAttemptState>(queryKeys.placementAttempt(attemptId), (old) =>
        old ? { ...old, answers: { ...old.answers, [questionId]: selectedOptionId } } : old,
      );
    },
  });
}
