import { useQuery } from "@tanstack/react-query";
import { fetchInternshipsPaginated } from "@/lib/internshipsApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useInternships(page: number, categoryId?: string) {
  return useQuery({
    queryKey: queryKeys.internshipsPage(page, categoryId),
    queryFn: () => fetchInternshipsPaginated(page, 12, categoryId),
    placeholderData: (previous) => previous,
  });
}
