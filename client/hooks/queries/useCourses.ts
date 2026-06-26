import { useQuery } from "@tanstack/react-query";
import { fetchPublishedCoursesPaginated } from "@/lib/coursesApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useCourses(page: number) {
  return useQuery({
    queryKey: queryKeys.coursesPage(page),
    queryFn: () => fetchPublishedCoursesPaginated(page, 12),
    placeholderData: (previous) => previous,
  });
}
