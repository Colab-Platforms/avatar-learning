import apiClient from "../apiClient";
import type { AuthUser } from "@/store/authSlice";

export const fetchCurrentUser = (): Promise<AuthUser> =>
  apiClient.get("/users/me").then((r) => r.data.data);

export const uploadProfileImage = (file: File): Promise<AuthUser> => {
  const formData = new FormData();
  formData.append("image", file);
  return apiClient
    .patch("/users/profile/image", formData, {
      headers: { "Content-Type": undefined },
    })
    .then((r) => r.data.data);
};

export const removeProfileImage = (): Promise<AuthUser> =>
  apiClient.delete("/users/profile/image").then((r) => r.data.data);
