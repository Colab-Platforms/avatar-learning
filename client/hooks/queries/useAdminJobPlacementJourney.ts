import { fetchAdminStudentJobPlacementJourney } from "@/lib/direct2hire/jobPlacementApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAdminJobPlacementJourney(userId: string) {
  return useQuery({
    queryKey: queryKeys.adminJobPlacementJourney(userId),
    queryFn: () => fetchAdminStudentJobPlacementJourney(userId),
    enabled: !!userId,
  });
}
