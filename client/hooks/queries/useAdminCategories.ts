import { fetchCategoriesPaginated } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAdminCategories() {
  return useQuery({
    queryKey: queryKeys.adminCategoriesPage(1, 0),
    queryFn: () => fetchCategoriesPaginated(),
    staleTime: 5 * 60 * 1000,
  });
}
