import { generateD2HPaymentLink } from "@/lib/adminApi";
import { useMutation } from "@tanstack/react-query";
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
  return "Failed to generate payment link";
}

export function useGenerateD2HPaymentLink(userId: string) {
  return useMutation({
    mutationFn: () => generateD2HPaymentLink(userId),
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
