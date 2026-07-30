"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  completeCareerQuiz,
  type CompleteQuizPayload,
} from "@/lib/quiz/quizApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/authSlice";
import { trackCareerQuizEvent } from "@/lib/analytics/careerQuizAnalytics";

export function useCompleteQuiz() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (payload: CompleteQuizPayload) => completeCareerQuiz(payload),
    onSuccess: (user) => {
      dispatch(setUser(user));
      queryClient.setQueryData(queryKeys.currentUser, user);
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      trackCareerQuizEvent("quiz_completed", {
        recommendedCareer: user.quizRecommendedCareer ?? undefined,
        matchPercentage: user.quizMatchPercentage ?? undefined,
      });
    },
  });
}
