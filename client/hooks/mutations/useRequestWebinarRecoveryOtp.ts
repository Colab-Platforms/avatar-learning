import { useMutation } from "@tanstack/react-query";
import { requestWebinarRecoveryOtp } from "@/lib/paymentApi";

export function useRequestWebinarRecoveryOtp() {
  return useMutation({
    mutationFn: (email: string) => requestWebinarRecoveryOtp(email),
  });
}
