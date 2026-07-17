import { confirmD2HBooking } from "@/lib/adminApi";
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
  return "Failed to confirm counselling session";
}

export function useConfirmCounsellingBooking(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      counsellorName: string;
      meetingLink: string;
      scheduledAt: string;
    }) => confirmD2HBooking(userId, payload),
    onSuccess: async () => {
      toast.success("Counselling session confirmed");
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
