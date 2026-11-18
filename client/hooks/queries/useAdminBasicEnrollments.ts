import { fetchD2HBasicEnrollmentsPaginated } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useAdminBasicEnrollments(
  page: number,
  pageSize: number = 20,
  search?: string,
) {
  return useQuery({
    queryKey: queryKeys.adminBasicStudentsPage(page, pageSize, search),
    queryFn: () => fetchD2HBasicEnrollmentsPaginated(page, pageSize, search),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}
