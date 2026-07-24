import { fetchIntroVideo } from "@/lib/introVideoApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useIntroVideo(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.introVideo,
    queryFn: fetchIntroVideo,
    enabled: options?.enabled ?? true,
  });
}
