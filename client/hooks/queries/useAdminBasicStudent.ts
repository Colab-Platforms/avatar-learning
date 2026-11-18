import { fetchD2HBasicStudentProfile } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAdminBasicStudent(userId: string) {
  return useQuery({
    queryKey: queryKeys.adminBasicStudent(userId),
    queryFn: () => fetchD2HBasicStudentProfile(userId),
    enabled: !!userId,
  });
}
