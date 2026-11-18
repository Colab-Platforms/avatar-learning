import { useMutation } from "@tanstack/react-query";
import {
  createWebinarOrder,
  type CreateWebinarOrderInput,
} from "@/lib/paymentApi";

export function useCreateWebinarOrder() {
  return useMutation({
    mutationFn: (input: CreateWebinarOrderInput) => createWebinarOrder(input),
  });
}
