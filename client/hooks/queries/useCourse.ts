import { fetchCourseBySlug } from "@/lib/coursesApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useCourse(slug: string) {
  return useQuery({
    queryKey: queryKeys.course(slug),
    queryFn: () => fetchCourseBySlug(slug),
  });
}
