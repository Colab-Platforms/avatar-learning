import { fetchD2HStudents } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAdminDirect2HireStudents() {
  return useQuery({
    queryKey: queryKeys.adminDirect2hireStudents,
    queryFn: fetchD2HStudents,
  });
}
