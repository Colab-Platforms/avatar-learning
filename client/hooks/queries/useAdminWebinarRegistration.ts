import { useQuery } from "@tanstack/react-query";
import { fetchWebinarRegistrationDetail } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useAdminWebinarRegistration(id: string) {
  return useQuery({
    queryKey: queryKeys.adminWebinarRegistration(id),
    queryFn: () => fetchWebinarRegistrationDetail(id),
    enabled: !!id,
  });
}
