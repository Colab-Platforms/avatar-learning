"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markIntroVideoComplete } from "@/lib/direct2hire/introVideoApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useMarkIntroComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markIntroVideoComplete,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.introVideo, (prev: unknown) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...prev,
          isIntroVideoWatched: data.isIntroVideoWatched,
          introVideoWatchedAt: data.introVideoWatchedAt,
        };
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.introVideo });
    },
  });
}
