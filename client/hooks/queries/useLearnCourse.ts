import { fetchEnrolledCourseDetail } from "@/lib/coursesApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useLearnCourse(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.enrolledCourse(id),
    queryFn: () => fetchEnrolledCourseDetail(id),
    enabled: (options?.enabled ?? true) && Boolean(id),
    staleTime: 0,
    refetchOnMount: "always",
  });
}
