import {
  submitCounsellingProfile,
  type SubmitCounsellingPayload,
} from "@/lib/counselling/counsellingApi";
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
  return "Failed to submit counselling form";
}

export function useSubmitCounselling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitCounsellingPayload) =>
      submitCounsellingProfile(payload),
    onSuccess: async () => {
      toast.success("Form submitted successfully");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.counsellingProfile,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
