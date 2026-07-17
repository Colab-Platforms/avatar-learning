import apiClient from "./apiClient";
import type { DBCourse } from "./coursesApi";

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

export type CourseSelectionCourse = Pick<
  DBCourse,
  | "id"
  | "title"
  | "slug"
  | "description"
  | "thumbnail"
  | "level"
  | "totalWeeks"
  | "whatYouLearn"
>;

export interface CourseSelectionState {
  counsellingCompleted: boolean;
  selectedCourseId: string | null;
  selectedCourseAt: string | null;
  selectedCourse: CourseSelectionCourse | null;
  availableCourses: CourseSelectionCourse[];
}

export const fetchCourseSelectionState = (): Promise<CourseSelectionState> =>
  apiClient.get("/direct2hire/course-selection").then((r) => r.data.data);

export const selectDirect2HireCourse = (
  courseId: string,
): Promise<{ booking: unknown; course: CourseSelectionCourse }> =>
  apiClient
    .post("/direct2hire/course-selection", { courseId })
    .then((r) => r.data.data);
