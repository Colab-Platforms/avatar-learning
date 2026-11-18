import { fetchAssessments, fetchAssessmentById, fetchAttemptHistory } from "@/lib/assessmentApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import type { CourseTrack } from "@/lib/coursesApi";
import { useQuery } from "@tanstack/react-query";

export function useAssessments(
  courseId: string,
  options?: {
    enabled?: boolean;
    track?: CourseTrack | null;
    /** Freshness window in ms. Callers that only read a derived flag (e.g. the
     * sidebar's step-lock check) should pass something > 0 so this doesn't
     * refetch the whole assessment list on every dashboard navigation. */
    staleTime?: number;
  },
) {
  const track = options?.track ?? null;
  return useQuery({
    queryKey: queryKeys.assessments(courseId, track),
    queryFn: () => fetchAssessments(courseId, track),
    enabled: Boolean(courseId) && (options?.enabled ?? true),
    staleTime: options?.staleTime ?? 0,
    refetchOnMount: options?.staleTime ? true : "always",
  });
}

/** @deprecated Prefer useAssessments or useAssessmentDetail */
export function useAssessment(courseId: string) {
  return useAssessments(courseId);
}

export function useAssessmentDetail(
  courseId: string,
  assessmentId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.assessmentDetail(courseId, assessmentId),
    queryFn: () => fetchAssessmentById(courseId, assessmentId),
    enabled: Boolean(courseId && assessmentId) && (options?.enabled ?? true),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useAssessmentHistory(
  courseId: string,
  assessmentId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.assessmentHistory(courseId, assessmentId),
    queryFn: () => fetchAttemptHistory(courseId, assessmentId),
    enabled: Boolean(courseId && assessmentId) && (options?.enabled ?? true),
    staleTime: 0,
    refetchOnMount: "always",
  });
}
