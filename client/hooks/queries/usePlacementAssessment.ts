import { fetchPlacementAssessment } from "@/lib/direct2hire/placementApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function usePlacementAssessment(courseId: string) {
  return useQuery({
    queryKey: queryKeys.placementAssessment(courseId),
    queryFn: () => fetchPlacementAssessment(courseId),
    enabled: !!courseId,
    staleTime: 0,
  });
}
