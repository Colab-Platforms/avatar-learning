import { fetchPlacementAttemptResult } from "@/lib/direct2hire/placementApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function usePlacementResult(attemptId: string) {
  return useQuery({
    queryKey: queryKeys.placementResult(attemptId),
    queryFn: () => fetchPlacementAttemptResult(attemptId),
  });
}
