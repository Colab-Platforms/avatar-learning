import { markMockInterviewCompleted } from "@/lib/direct2hire/mockInterviewApi";
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
  return "Failed to mark interview completed";
}

export function useMarkMockInterviewCompleted(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markMockInterviewCompleted(userId),
    onSuccess: async () => {
      toast.success("Mock interview marked as completed");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.adminMockInterview(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.mockInterview,
        }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
