import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  submitInternshipTask,
  type SubmitInternshipPayload,
} from "@/lib/internshipApi";

export function useSubmitInternshipTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: SubmitInternshipPayload;
    }) => submitInternshipTask(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.internshipTasks });
    },
  });
}
