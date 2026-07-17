import { fetchD2HStudentProfile } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAdminDirect2HireStudent(userId: string) {
  return useQuery({
    queryKey: queryKeys.adminDirect2hireStudent(userId),
    queryFn: () => fetchD2HStudentProfile(userId),
    enabled: !!userId,
  });
}
