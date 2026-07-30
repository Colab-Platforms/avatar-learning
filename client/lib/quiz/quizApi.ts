import apiClient from "@/lib/apiClient";
import type { AuthUser } from "@/store/authSlice";

export interface CompleteQuizPayload {
  primaryCareerDomain: string;
  secondaryCareerDomain?: string | null;
  recommendedCareer: string;
  matchPercentage: number;
}

export const completeCareerQuiz = (
  payload: CompleteQuizPayload,
): Promise<AuthUser> =>
  apiClient
    .post("/users/me/quiz/complete", payload)
    .then((r) => r.data.data);
