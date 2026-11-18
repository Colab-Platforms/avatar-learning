import { fetchCategories } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAdminCategoriesList() {
  return useQuery({
    queryKey: queryKeys.adminCategories,
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}
