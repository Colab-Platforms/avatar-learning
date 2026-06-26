import { fetchEnrolledCourseDetail } from "@/lib/coursesApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useLearnCourse(id: string) {
  return useQuery({
    queryKey: queryKeys.enrolledCourse(id),
    queryFn: () => fetchEnrolledCourseDetail(id),
  });
}
