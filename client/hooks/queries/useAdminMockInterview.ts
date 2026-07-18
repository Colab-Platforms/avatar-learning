import { fetchAdminMockInterview } from "@/lib/direct2hire/mockInterviewApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAdminMockInterview(userId: string) {
  return useQuery({
    queryKey: queryKeys.adminMockInterview(userId),
    queryFn: () => fetchAdminMockInterview(userId),
    enabled: !!userId,
  });
}
