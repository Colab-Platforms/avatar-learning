import { useQuery } from "@tanstack/react-query";
import { getWebinarRegistrationStatus } from "@/lib/paymentApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useWebinarRegistrationStatus(
  registrationId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.webinarRegistrationStatus(registrationId ?? ""),
    queryFn: () => getWebinarRegistrationStatus(registrationId as string),
    enabled: Boolean(registrationId) && (options?.enabled ?? true),
    retry: false,
  });
}
