import { deleteJobPlacementEntry } from "@/lib/direct2hire/jobPlacementApi";
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
  return "Failed to remove placement entry";
}

export function useDeleteJobPlacementEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => deleteJobPlacementEntry(entryId),
    onSuccess: async () => {
      toast.success("Placement entry removed");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.jobPlacementJourney,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
