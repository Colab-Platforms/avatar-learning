import { fetchD2HEnrollmentsPaginated } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useAdminDirect2HireEnrollments(
  page: number,
  pageSize: number = 20,
  search?: string,
) {
  return useQuery({
    queryKey: queryKeys.adminDirect2hireStudentsPage(page, pageSize, search),
    queryFn: () => fetchD2HEnrollmentsPaginated(page, pageSize, search),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}
