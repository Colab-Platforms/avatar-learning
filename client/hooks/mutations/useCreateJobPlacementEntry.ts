import {
  createJobPlacementEntry,
  type CreateJobPlacementEntryPayload,
} from "@/lib/direct2hire/jobPlacementApi";
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
  return "Failed to log placement";
}

export function useCreateJobPlacementEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateJobPlacementEntryPayload) =>
      createJobPlacementEntry(payload),
    onSuccess: async () => {
      toast.success("Placement added to your journey");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.jobPlacementJourney,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
