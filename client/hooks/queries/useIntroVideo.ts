"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchIntroVideo } from "@/lib/direct2hire/introVideoApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useIntroVideo(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.introVideo,
    queryFn: fetchIntroVideo,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}
