import { fetchUsersPaginated } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAdminUsers(search?: string) {
  return useQuery({
    queryKey: queryKeys.adminUsersPage(1, 0, search),
    queryFn: () => fetchUsersPaginated(search),
    staleTime: 5 * 60 * 1000,
  });
}
