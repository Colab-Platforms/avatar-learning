import { useMutation } from "@tanstack/react-query";
import { verifyWebinarRecoveryOtp } from "@/lib/paymentApi";

export function useVerifyWebinarRecoveryOtp() {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      verifyWebinarRecoveryOtp(email, otp),
  });
}
