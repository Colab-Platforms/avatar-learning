import { useQuery } from "@tanstack/react-query";
import { getDirect2HireStatus } from "@/lib/paymentApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useDirect2HireStatus(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.direct2hireStatus,
    queryFn: () => getDirect2HireStatus(),
    enabled,
  });
}
