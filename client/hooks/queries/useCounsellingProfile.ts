import { fetchCounsellingProfile } from "@/lib/counselling/counsellingApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useCounsellingProfile() {
  return useQuery({
    queryKey: queryKeys.counsellingProfile,
    queryFn: fetchCounsellingProfile,
  });
}
