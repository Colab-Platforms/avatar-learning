import { fetchCourseSelectionState } from "@/lib/direct2hireApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useCourseSelection() {
  return useQuery({
    queryKey: queryKeys.courseSelection,
    queryFn: fetchCourseSelectionState,
  });
}
