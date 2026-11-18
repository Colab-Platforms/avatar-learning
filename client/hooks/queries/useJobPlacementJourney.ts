import { fetchMyJobPlacementJourney } from "@/lib/direct2hire/jobPlacementApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useJobPlacementJourney() {
  return useQuery({
    queryKey: queryKeys.jobPlacementJourney,
    queryFn: fetchMyJobPlacementJourney,
  });
}
