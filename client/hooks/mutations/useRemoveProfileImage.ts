import { removeProfileImage } from "@/lib/user/profileImageApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { setUser } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Network error. Please check your connection and try again.";
    }
    return (
      (error.response.data as { message?: string } | undefined)?.message ||
      error.message
    );
  }
  if (error instanceof Error) return error.message;
  return "Failed to remove profile photo";
}

export function useRemoveProfileImage() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: removeProfileImage,
    onSuccess: async (user) => {
      dispatch(setUser(user));
      toast.success("Profile photo removed");
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.direct2hireStatus,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
