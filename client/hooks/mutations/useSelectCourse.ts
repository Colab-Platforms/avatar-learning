import { selectDirect2HireCourse } from "@/lib/direct2hireApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message
    );
  }
  if (error instanceof Error) return error.message;
  return "Failed to select course";
}

export function useSelectCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => selectDirect2HireCourse(courseId),
    onSuccess: async () => {
      toast.success("Course selected successfully");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.courseSelection,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.counsellingBooking,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.direct2hireStatus,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
