import { useQuery } from "@tanstack/react-query";
import { fetchInternshipCategories } from "@/lib/internshipsApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useInternshipCategories() {
  return useQuery({
    queryKey: queryKeys.internshipCategories,
    queryFn: fetchInternshipCategories,
    staleTime: 5 * 60 * 1000,
  });
}
