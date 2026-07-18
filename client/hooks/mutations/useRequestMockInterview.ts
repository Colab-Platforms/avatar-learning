import { requestMockInterview } from "@/lib/direct2hire/mockInterviewApi";
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
  return "Failed to request mock interview";
}

export function useRequestMockInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => requestMockInterview(),
    onSuccess: async () => {
      toast.success("Mock interview requested successfully");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.mockInterview,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
