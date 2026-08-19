import { fetchCounsellingProfile } from "@/lib/counselling/counsellingApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useCounsellingProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.counsellingProfile,
    queryFn: fetchCounsellingProfile,
    enabled,
  });
}
