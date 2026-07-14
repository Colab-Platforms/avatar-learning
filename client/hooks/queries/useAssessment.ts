import { fetchAssessment } from "@/lib/assessmentApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAssessment(courseId: string) {
  return useQuery({
    queryKey: queryKeys.assessment(courseId),
    queryFn: () => fetchAssessment(courseId),
  });
}
