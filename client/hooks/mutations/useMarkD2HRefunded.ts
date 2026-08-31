import { markD2HRefunded } from "@/lib/adminApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message
    );
  }
  if (error instanceof Error) return error.message;
  return "Failed to mark enrollment as refunded";
}

export function useMarkD2HRefunded(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enrollmentId: string) => markD2HRefunded(enrollmentId),
    onSuccess: async () => {
      toast.success("Enrollment marked as refunded");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.adminDirect2hireStudent(userId),
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
