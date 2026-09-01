import { fetchCounsellingProfile } from "@/lib/counselling/counsellingApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useCounsellingProfile(courseId?: string) {
  return useQuery({
    queryKey: courseId
      ? [...queryKeys.counsellingProfile, courseId]
      : queryKeys.counsellingProfile,
    queryFn: () => fetchCounsellingProfile(courseId),
  });
}
