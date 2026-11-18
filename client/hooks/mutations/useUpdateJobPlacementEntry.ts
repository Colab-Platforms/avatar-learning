import {
  updateJobPlacementEntry,
  type UpdateJobPlacementEntryPayload,
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
  return "Failed to update placement entry";
}

export function useUpdateJobPlacementEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      entryId,
      payload,
    }: {
      entryId: string;
      payload: UpdateJobPlacementEntryPayload;
    }) => updateJobPlacementEntry(entryId, payload),
    onSuccess: async () => {
      toast.success("Placement entry updated");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.jobPlacementJourney,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
