import { useMutation } from "@tanstack/react-query";
import { verifyPayment, type VerifyPaymentPayload } from "@/lib/paymentApi";

export function useVerifyPayment() {
  return useMutation({
    mutationFn: (payload: VerifyPaymentPayload) => verifyPayment(payload),
  });
}
