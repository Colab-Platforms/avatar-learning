"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { grantAdminStudentPlacementAttempts } from "@/lib/adminPlacementApi";

export function useGrantPlacementAttempts(userId: string, courseId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { attemptsGranted: number; reason: string }) =>
      grantAdminStudentPlacementAttempts(userId, payload, courseId),
    onSuccess: () => {
      // Invalidate by prefix (userId only, no courseId) so every course tab's
      // cached placement data for this student is refetched, not just the
      // one that was open when the grant happened.
      queryClient.invalidateQueries({ queryKey: ["admin-student-placement-summary", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-student-placement-attempts", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-student-placement-overrides", userId] });
    },
  });
}
