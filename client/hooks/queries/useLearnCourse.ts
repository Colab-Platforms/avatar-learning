import {
  fetchEnrolledCourseDetail,
  type CourseTrack,
} from "@/lib/coursesApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useLearnCourse(
  id: string,
  options?: { enabled?: boolean; track?: CourseTrack | null },
) {
  const track = options?.track ?? null;
  return useQuery({
    // Track is part of the key: the two plans are different content, so they
    // must not share a cache entry.
    queryKey: queryKeys.enrolledCourse(id, track),
    queryFn: () => fetchEnrolledCourseDetail(id, track),
    enabled: (options?.enabled ?? true) && Boolean(id),
    staleTime: 0,
    refetchOnMount: "always",
  });
}
