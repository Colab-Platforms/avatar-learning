import { fetchAdminCourses } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAdminCoursesList() {
  return useQuery({
    queryKey: queryKeys.adminCourses,
    queryFn: fetchAdminCourses,
    staleTime: 5 * 60 * 1000,
  });
}
