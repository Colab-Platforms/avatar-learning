import { markCounsellingCompleted } from "@/lib/adminApi";
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
  return "Failed to mark counselling as completed";
}

export function useMarkCounsellingCompleted(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markCounsellingCompleted(userId),
    onSuccess: async () => {
      toast.success("Counselling marked as completed");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.adminDirect2hireStudent(userId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.adminDirect2hireStudents,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
