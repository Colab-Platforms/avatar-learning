import {
  devContinueAsPaid,
  upsertDirect2HireLead,
  type UpsertLeadPayload,
} from "@/lib/direct2hire/leadApi";
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
  return "Something went wrong";
}

export function useUpsertDirect2HireLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertLeadPayload) => upsertDirect2HireLead(payload),
    onSuccess: async () => {
      toast.success("Details saved successfully");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.direct2hireLead,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDevContinueAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: devContinueAsPaid,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.direct2hireStatus,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.direct2hireLead,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
