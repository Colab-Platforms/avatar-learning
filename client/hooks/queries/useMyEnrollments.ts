import { useQuery } from "@tanstack/react-query";
import {
  fetchMyEnrollments,
  type CourseTier,
  type EnrollmentTrack,
} from "@/lib/coursesApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useMyEnrollments() {
  return useQuery({
    queryKey: queryKeys.myEnrollments,
    queryFn: fetchMyEnrollments,
  });
}

/**
 * Routes address a course by slug (/dashboard/<slug>) in one subtree and by id
 * (/dashboard/learning/<id>) in the other, so match either — a lookup that only
 * knew slugs silently returned "not enrolled" for every learning URL.
 */
function findEnrollment(
  data: ReturnType<typeof useMyEnrollments>["data"],
  key: string,
) {
  return data?.find((e) => e.course.slug === key || e.course.id === key);
}

export function useEnrollmentTier(courseId: string | null): CourseTier | null {
  const { data } = useMyEnrollments();
  if (!courseId || !data) return null;
  return findEnrollment(data, courseId)?.tier ?? null;
}

/** The plans owned for a course, with each one's own progress. */
export function useEnrollmentTracks(
  courseId: string | null,
): EnrollmentTrack[] {
  const { data } = useMyEnrollments();
  if (!courseId || !data) return [];
  return findEnrollment(data, courseId)?.tracks ?? [];
}
