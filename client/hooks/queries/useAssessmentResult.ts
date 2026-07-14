import { fetchAttemptResult } from "@/lib/assessmentApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAssessmentResult(attemptId: string) {
  return useQuery({
    queryKey: queryKeys.assessmentResult(attemptId),
    queryFn: () => fetchAttemptResult(attemptId),
  });
}
