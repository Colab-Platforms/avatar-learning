import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { fetchMyInternshipTasks } from "@/lib/internshipApi";

export function useInternshipTasks(courseId?: string) {
  return useQuery({
    queryKey: queryKeys.internshipTasks(courseId),
    queryFn: () => fetchMyInternshipTasks(courseId),
  });
}
