import { useMutation } from "@tanstack/react-query";
import {
  verifyWebinarPayment,
  type VerifyWebinarPaymentPayload,
} from "@/lib/paymentApi";

export function useVerifyWebinarPayment() {
  return useMutation({
    mutationFn: (payload: VerifyWebinarPaymentPayload) =>
      verifyWebinarPayment(payload),
  });
}
