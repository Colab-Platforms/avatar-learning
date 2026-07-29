import { fetchCategoriesPaginated } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useAdminCategories(page: number, pageSize: number = 10) {
  return useQuery({
    queryKey: queryKeys.adminCategoriesPage(page, pageSize),
    queryFn: () => fetchCategoriesPaginated(page, pageSize),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}
