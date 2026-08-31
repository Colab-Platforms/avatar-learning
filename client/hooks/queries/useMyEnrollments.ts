import { useQuery } from "@tanstack/react-query";
import { fetchMyEnrollments, type CourseTier } from "@/lib/coursesApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useMyEnrollments() {
  return useQuery({
    queryKey: queryKeys.myEnrollments,
    queryFn: fetchMyEnrollments,
  });
}

export function useEnrollmentTier(courseId: string | null): CourseTier | null {
  const { data } = useMyEnrollments();
  if (!courseId || !data) return null;
  return data.find((e) => e.course.slug === courseId)?.tier ?? null;
}
