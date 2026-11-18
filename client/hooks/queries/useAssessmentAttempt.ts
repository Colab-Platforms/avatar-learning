import { fetchAttemptState } from "@/lib/assessmentApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAssessmentAttempt(attemptId: string) {
  return useQuery({
    queryKey: queryKeys.assessmentAttempt(attemptId),
    queryFn: () => fetchAttemptState(attemptId),
    refetchInterval: (query) => (query.state.data?.attempt.status === "IN_PROGRESS" ? 15_000 : false),
  });
}
