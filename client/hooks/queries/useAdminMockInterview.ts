import { fetchAdminMockInterview } from "@/lib/direct2hire/mockInterviewApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useAdminMockInterview(userId: string, courseId?: string) {
  return useQuery({
    queryKey: queryKeys.adminMockInterview(userId, courseId),
    queryFn: () => fetchAdminMockInterview(userId, courseId),
    enabled: !!userId,
  });
}
