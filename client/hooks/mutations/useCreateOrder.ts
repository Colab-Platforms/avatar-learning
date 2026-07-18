import { useMutation } from "@tanstack/react-query";
import { createPaymentOrder } from "@/lib/paymentApi";

export function useCreateOrder() {
  return useMutation({
    mutationFn: (courseId: string) => createPaymentOrder(courseId),
  });
}
