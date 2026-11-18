import { fetchCounsellingBooking } from "@/lib/counselling/counsellingApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useCounsellingBooking(courseId?: string) {
  return useQuery({
    queryKey: courseId
      ? [...queryKeys.counsellingBooking, courseId]
      : queryKeys.counsellingBooking,
    queryFn: () => fetchCounsellingBooking(courseId),
  });
}
