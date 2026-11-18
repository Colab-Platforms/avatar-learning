import { fetchMyCounsellingFeedback } from "@/lib/counselling/counsellingFeedbackApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useCounsellingFeedback(enabled = true) {
  return useQuery({
    queryKey: queryKeys.counsellingFeedback,
    queryFn: fetchMyCounsellingFeedback,
    enabled,
  });
}
