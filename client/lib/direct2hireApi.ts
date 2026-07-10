import apiClient from "./apiClient";

export interface D2HEnrollment {
  id: string;
  userId: string;
  status: "PENDING" | "PAID";
  createdAt: string;
  updatedAt: string;
}

export interface D2HCourseSummary {
  id: string;
  title: string;
  slug: string;
  totalLessons: number;
  enrolled: boolean;
  progress: number;
  isCompleted: boolean;
}

export interface D2HStatus {
  enrollment: D2HEnrollment;
  courses: D2HCourseSummary[];
}

export const fetchMyD2HStatus = (): Promise<D2HStatus> =>
  apiClient.get("/direct2hire/me").then((r) => r.data.data);
