import { useMutation } from "@tanstack/react-query";
import { createDirect2HireOrder, type Direct2HirePlan } from "@/lib/paymentApi";

export function useCreateDirect2HireOrder() {
  return useMutation({
    mutationFn: ({
      plan,
      couponCode,
    }: {
      plan: Direct2HirePlan;
      couponCode?: string;
    }) => createDirect2HireOrder(plan, couponCode),
  });
}
