import apiClient from "../apiClient";
import type {
  CounsellingFeedback,
  SaveCounsellingFeedbackPayload,
} from "./counsellingFeedbackConstants";

export const fetchMyCounsellingFeedback = (): Promise<CounsellingFeedback | null> =>
  apiClient
    .get("/direct2hire/counselling/feedback")
    .then((r) => r.data.data);

export const fetchAdminCounsellingFeedback = (
  userId: string,
): Promise<CounsellingFeedback | null> =>
  apiClient
    .get(`/admin/direct2hire/students/${userId}/counselling/feedback`)
    .then((r) => r.data.data);

export const saveCounsellingFeedback = (
  userId: string,
  payload: SaveCounsellingFeedbackPayload,
) =>
  apiClient
    .put(`/admin/direct2hire/students/${userId}/counselling/feedback`, payload)
    .then((r) => r.data.data);
