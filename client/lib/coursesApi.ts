import apiClient from "./apiClient";

export interface PaginatedResponse<T> {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  data: T[];
}

export interface CourseLearnItem {
  title: string;
  body: string;
}
export interface AudienceItem {
  title: string;
  body: string;
}

export interface DBCourse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  heroImage?: string;
  bannerImage?: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  price: number;
  totalWeeks: number;
  tools: string[];
  sessions?: string;
  certificate: boolean;
  rating?: number;
  reviews?: string;
  startDate?: string;
  seats?: string;
  whatYouLearn?: CourseLearnItem[];
  audience?: AudienceItem[];
  isPublished: boolean;
  category: { id: string; name: string; slug: string };
  _count: { lessons: number; enrollments: number };
}

export interface DBResource {
  id: string;
  title: string;
  category: string;
  type: string;
  url: string | null;
  downloadUrl?: string | null;
  bunnyVideoId?: string;
  size?: string;
}

export interface DBTopic {
  id: string;
  title: string;
  description?: string;
  topicOrder: number;
  duration?: number;
  resources: DBResource[];
  isCompleted?: boolean;
  isLocked?: boolean;
}

export interface DBLesson {
  id: string;
  weekNumber: number;
  title: string;
  description?: string;
  modules: string[];
  duration?: number;
  isPublished: boolean;
  isFreePreview: boolean;
  resources: DBResource[];
  topics: DBTopic[];
  isCompleted?: boolean;
  topicsComplete?: boolean;
  isLocked?: boolean;
  weeklyAssessment?: import("./assessmentApi").LessonAssessmentCard | null;
}

export interface DBCourseDetail extends DBCourse {
  lessons: DBLesson[];
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completedAt: string | null;
  progress: number;
  isCompleted: boolean;
}

export interface EnrolledCourseDetail extends DBCourseDetail {
  enrollment: Enrollment;
  finalAssessment?: import("./assessmentApi").LessonAssessmentCard | null;
}

export interface MyEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completedAt: string | null;
  progress: number;
  isCompleted: boolean;
  course: DBCourse;
}

//fetch courses without pagination
// export const fetchPublishedCourses = (): Promise<DBCourse[]> =>
//     apiClient.get("/courses").then((r) => r.data.data.data ?? r.data.data);

export const fetchPublishedCoursesPaginated = (
  page: number = 1,
  pageSize: number = 12,
): Promise<PaginatedResponse<DBCourse>> =>
  apiClient.get("/courses", { params: { page, pageSize } }).then((r) => {
    // console.log(r.data.data)
    return r.data.data;
  });

export const fetchCourseBySlug = (slug: string): Promise<DBCourseDetail> =>
  apiClient.get(`/courses/${slug}`).then((r) => r.data.data);

export const enrollCourse = (courseId: string): Promise<Enrollment> =>
  apiClient.post(`/courses/${courseId}/enroll`).then((r) => r.data.data);

export const unenrollCourse = (courseId: string): Promise<void> =>
  apiClient.delete(`/courses/${courseId}/enroll`).then((r) => r.data);

export const checkEnrollment = (
  courseId: string,
): Promise<{ enrolled: boolean; enrollment: Enrollment | null }> =>
  apiClient.get(`/courses/${courseId}/enrollment`).then((r) => r.data.data);

export const fetchEnrolledCourseDetail = (
  courseId: string,
): Promise<EnrolledCourseDetail> =>
  apiClient.get(`/courses/${courseId}/learn`).then((r) => r.data.data);

export const markTopicWatched = (topicId: string): Promise<Enrollment> =>
  apiClient
    .post(`/courses/topics/${topicId}/watch`)
    .then((r) => r.data.data);

export const fetchVideoPlaybackUrl = (
  resourceId: string,
): Promise<{ embedUrl: string; expiresInSeconds: number }> =>
  apiClient
    .get(`/courses/resources/${resourceId}/playback`)
    .then((r) => r.data.data);

export const fetchMyEnrollments = (): Promise<MyEnrollment[]> =>
  apiClient
    .get("/courses/me/enrollments")
    .then((r) => r.data.data.data ?? r.data.data);

export const fetchMyEnrollmentsPaginated = (
  page: number = 1,
  pageSize: number = 12,
): Promise<PaginatedResponse<MyEnrollment>> =>
  apiClient
    .get("/courses/me/enrollments", { params: { page, pageSize } })
    .then((r) => r.data.data);

export const downloadResourceFile = async (
  resourceId: string,
  filename: string,
): Promise<void> => {
  const response = await apiClient.get(
    `/courses/resources/${resourceId}/download`,
    {
      responseType: "blob",
    },
  );

  const disposition = response.headers["content-disposition"] as
    | string
    | undefined;
  const match = disposition?.match(/filename="([^"]+)"/);
  const resolvedName = match?.[1] ?? filename;

  const blob = response.data as Blob;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = resolvedName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const downloadCourseCertificate = async (
  courseId: string,
  filename: string,
): Promise<void> => {
  const response = await apiClient.get(`/courses/${courseId}/certificate`, {
    responseType: "blob",
  });

  const disposition = response.headers["content-disposition"] as
    | string
    | undefined;
  const match = disposition?.match(/filename="([^"]+)"/);
  const resolvedName = match?.[1] ?? filename;

  const blob = response.data as Blob;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = resolvedName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const fetchHeroCourses = (): Promise<DBCourse[]> =>
  apiClient.get("/courses/hero").then((r) => r.data.data);
