"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markIntroVideoWatched } from "@/lib/introVideoApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/authSlice";

export function useMarkIntroVideoWatched() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  return useMutation({
    mutationFn: markIntroVideoWatched,
    onSuccess: () => {
      if (user) {
        dispatch(setUser({ ...user, isIntroVideoWatched: true }));
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.introVideo });
    },
  });
}
