import { fetchAssessments, fetchAssessmentById, fetchAttemptHistory } from "@/lib/assessmentApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAssessments(courseId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.assessments(courseId),
    queryFn: () => fetchAssessments(courseId),
    enabled: Boolean(courseId) && (options?.enabled ?? true),
    staleTime: 0,
    refetchOnMount: "always",
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
