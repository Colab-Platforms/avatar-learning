import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchWebinarRegistrationsPaginated,
  type WebinarRegistrationStatus,
} from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useAdminWebinarRegistrations(
  page: number,
  pageSize: number = 20,
  search?: string,
  status?: WebinarRegistrationStatus,
) {
  return useQuery({
    queryKey: queryKeys.adminWebinarRegistrations(page, pageSize, search, status),
    queryFn: () =>
      fetchWebinarRegistrationsPaginated(page, pageSize, search, status),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}
