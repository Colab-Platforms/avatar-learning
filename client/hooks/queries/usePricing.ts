import { getPricing } from "@/lib/paymentApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

// Plan prices live in backend env (DIRECT2HIRE_PRICE_RUPEES /
// COURSE_BASIC_PRICE_RUPEES); the enroll page must never hardcode them.
export function usePricing(enabled = true) {
  return useQuery({
    queryKey: queryKeys.pricing,
    queryFn: getPricing,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
