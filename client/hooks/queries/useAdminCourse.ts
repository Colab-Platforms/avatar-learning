import { fetchAdminCourse } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAdminCourse(id: string) {
  return useQuery({
    queryKey: queryKeys.adminCourse(id),
    queryFn: () => fetchAdminCourse(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
