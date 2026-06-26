import { checkEnrollment } from "@/lib/coursesApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useEnrollment(courseId: string) {
  return useQuery({
    queryKey: queryKeys.enrollment(courseId),
    queryFn: () => checkEnrollment(courseId),
    enabled: !!courseId,
  });
}
