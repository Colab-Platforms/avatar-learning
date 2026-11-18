import { uploadProfileImage } from "@/lib/user/profileImageApi";
import { validateProfileImageFile } from "@/lib/user/profileImageValidation";
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
  return "Failed to upload profile photo";
}

export function useUploadProfileImage() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (file: File) => {
      const validationError = validateProfileImageFile(file);
      if (validationError) {
        throw new Error(validationError);
      }
      return uploadProfileImage(file);
    },
    onSuccess: async (user) => {
      dispatch(setUser(user));
      toast.success("Profile photo updated");
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.direct2hireStatus,
      });
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      if (message.includes("Unsupported file")) {
        toast.error("Unsupported file type. Use JPG, JPEG, PNG, or WEBP.");
        return;
      }
      if (message.includes("too large") || message.includes("5MB")) {
        toast.error("File too large. Maximum size is 5MB.");
        return;
      }
      toast.error(message);
    },
  });
}
