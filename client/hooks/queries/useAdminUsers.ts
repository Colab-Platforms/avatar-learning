import { fetchUsersPaginated } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useAdminUsers(
  page: number,
  pageSize: number = 10,
  search?: string,
) {
  return useQuery({
    queryKey: queryKeys.adminUsersPage(page, pageSize, search),
    queryFn: () => fetchUsersPaginated(page, pageSize, search),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}
