import { fetchMyD2HStatus } from "@/lib/direct2hireApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useD2HStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.direct2hireStatus,
    queryFn: fetchMyD2HStatus,
    enabled: options?.enabled ?? true,
  });
}
