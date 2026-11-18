import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { fetchAdminInternshipTasks } from "@/lib/internshipApi";

export function useAdminInternshipTasks(courseId: string) {
  return useQuery({
    queryKey: queryKeys.adminInternshipTasks(courseId),
    queryFn: () => fetchAdminInternshipTasks(courseId),
    enabled: !!courseId,
  });
}
