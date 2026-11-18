import { fetchAdminCoursesPaginated } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useAdminCourses(page: number, pageSize: number = 10, search?: string) {
  return useQuery({
    queryKey: queryKeys.adminCoursesPage(page, pageSize, search),
    queryFn: () => fetchAdminCoursesPaginated(page, pageSize, search),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}
