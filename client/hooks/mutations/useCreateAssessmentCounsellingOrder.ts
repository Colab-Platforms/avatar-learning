import { useMutation } from "@tanstack/react-query";
import { createAssessmentCounsellingOrder } from "@/lib/paymentApi";

export function useCreateAssessmentCounsellingOrder() {
  return useMutation({
    mutationFn: () => createAssessmentCounsellingOrder(),
  });
}
