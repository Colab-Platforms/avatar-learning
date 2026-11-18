import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import {
  createAdminInternshipTask,
  updateAdminInternshipTask,
  deleteAdminInternshipTask,
  type CreateInternshipTaskPayload,
  type UpdateInternshipTaskPayload,
} from "@/lib/internshipApi";

export function useCreateAdminInternshipTask(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInternshipTaskPayload) =>
      createAdminInternshipTask(courseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminInternshipTasks(courseId),
      });
    },
  });
}

export function useUpdateAdminInternshipTask(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: UpdateInternshipTaskPayload;
    }) => updateAdminInternshipTask(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminInternshipTasks(courseId),
      });
    },
  });
}

export function useDeleteAdminInternshipTask(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => deleteAdminInternshipTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminInternshipTasks(courseId),
      });
    },
  });
}
