import { fetchPlacementAttemptState } from "@/lib/direct2hire/placementApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function usePlacementAttempt(attemptId: string) {
  return useQuery({
    queryKey: queryKeys.placementAttempt(attemptId),
    queryFn: () => fetchPlacementAttemptState(attemptId),
    refetchInterval: (query) => (query.state.data?.attempt.status === "IN_PROGRESS" ? 15_000 : false),
  });
}
