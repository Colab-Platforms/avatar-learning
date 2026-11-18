import { useMutation } from "@tanstack/react-query";
import { createPaymentOrder } from "@/lib/paymentApi";

export function useCreateOrder() {
  return useMutation({
    mutationFn: ({
      courseId,
      plan = "BASIC",
      couponCode,
    }: {
      courseId: string;
      plan?: "BASIC" | "D2H";
      couponCode?: string;
    }) => createPaymentOrder(courseId, plan, couponCode),
  });
}
