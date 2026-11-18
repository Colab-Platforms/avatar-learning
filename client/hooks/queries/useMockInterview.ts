import { fetchMyMockInterview } from "@/lib/direct2hire/mockInterviewApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useMockInterview() {
  return useQuery({
    queryKey: queryKeys.mockInterview,
    queryFn: fetchMyMockInterview,
  });
}
