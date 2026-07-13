import { fetchDirect2HireLead } from "@/lib/direct2hire/leadApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useDirect2HireLead() {
  return useQuery({
    queryKey: queryKeys.direct2hireLead,
    queryFn: fetchDirect2HireLead,
  });
}
