import { fetchCounsellingBooking } from "@/lib/counselling/counsellingApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useCounsellingBooking(enabled = true) {
  return useQuery({
    queryKey: queryKeys.counsellingBooking,
    queryFn: fetchCounsellingBooking,
    enabled,
  });
}
