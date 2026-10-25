import { fetchAdminCoursesPaginated } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAdminCourses(search?: string) {
  return useQuery({
    queryKey: queryKeys.adminCoursesPage(1, 0, search),
    queryFn: () => fetchAdminCoursesPaginated(search),
    staleTime: 5 * 60 * 1000,
  });
}
