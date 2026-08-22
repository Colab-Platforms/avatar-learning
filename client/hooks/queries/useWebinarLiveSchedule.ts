import { useQuery } from "@tanstack/react-query";
import { getLiveWebinarSchedule } from "@/lib/paymentApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useWebinarLiveSchedule() {
  return useQuery({
    queryKey: queryKeys.webinarLiveSchedule,
    queryFn: getLiveWebinarSchedule,
    staleTime: 60 * 1000,
  });
}
