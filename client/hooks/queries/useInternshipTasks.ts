import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { fetchMyInternshipTasks } from "@/lib/internshipApi";

export function useInternshipTasks() {
  return useQuery({
    queryKey: queryKeys.internshipTasks,
    queryFn: fetchMyInternshipTasks,
  });
}
