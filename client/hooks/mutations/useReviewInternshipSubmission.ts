import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  reviewInternshipSubmission,
  type ReviewSubmissionPayload,
} from "@/lib/internshipApi";

export function useReviewInternshipSubmission(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      payload,
    }: {
      submissionId: string;
      payload: ReviewSubmissionPayload;
    }) => reviewInternshipSubmission(submissionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminDirect2hireStudent(userId),
      });
    },
  });
}
