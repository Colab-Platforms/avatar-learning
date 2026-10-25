import { useQuery } from "@tanstack/react-query";
import {
  fetchWebinarRegistrationsPaginated,
  type WebinarRegistrationStatus,
} from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useAdminWebinarRegistrations(
  search?: string,
  status?: WebinarRegistrationStatus,
) {
  return useQuery({
    queryKey: queryKeys.adminWebinarRegistrations(1, 0, search, status),
    queryFn: () => fetchWebinarRegistrationsPaginated(search, status),
    staleTime: 60 * 1000,
  });
}
