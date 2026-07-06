import { useMutation } from "@tanstack/react-query";
import { createDirect2HireOrder } from "@/lib/paymentApi";

export function useCreateDirect2HireOrder() {
  return useMutation({
    mutationFn: () => createDirect2HireOrder(),
  });
}
