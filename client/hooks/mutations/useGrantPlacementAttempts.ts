"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { grantAdminStudentPlacementAttempts } from "@/lib/adminPlacementApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useGrantPlacementAttempts(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { attemptsGranted: number; reason: string }) =>
      grantAdminStudentPlacementAttempts(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStudentPlacementSummary(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStudentPlacementAttempts(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStudentPlacementOverrides(userId) });
    },
  });
}
