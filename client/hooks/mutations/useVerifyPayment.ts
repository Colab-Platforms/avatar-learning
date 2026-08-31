import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifyPayment, type VerifyPaymentPayload } from "@/lib/paymentApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyPaymentPayload) => verifyPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myEnrollments });
    },
  });
}
