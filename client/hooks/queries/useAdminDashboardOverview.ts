import { fetchAdminDashboardOverview } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAdminDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.adminDashboardOverview,
    queryFn: fetchAdminDashboardOverview,
    staleTime: 5 * 60 * 1000,
  });
}
