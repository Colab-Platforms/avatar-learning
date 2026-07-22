import { fetchCurrentUser } from "@/lib/user/profileImageApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: fetchCurrentUser,
    enabled,
    staleTime: 60_000,
  });
}
