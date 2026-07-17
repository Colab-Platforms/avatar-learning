import {
  createCounsellingBooking,
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
  return "Failed to request counselling session";
}

export function useCreateCounsellingBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { preferredMode: string; notes?: string }) =>
      createCounsellingBooking(payload),
    onSuccess: async () => {
      toast.success("Counselling session requested successfully");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.counsellingBooking,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
