import apiClient from "./apiClient";
import axios from "axios";
import type { PaginatedResponse } from "./coursesApi";
import type { AdminStudentInternshipProgress } from "./internshipApi";

// ─── Categories ───────────────────────────────────────────────────────────────

export const fetchCategories = () =>
  apiClient.get("/admin/categories").then((r) => r.data.data);

export const createCategory = (payload: {
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
}) => apiClient.post("/admin/categories", payload).then((r) => r.data.data);

// ─── Courses ──────────────────────────────────────────────────────────────────

export const fetchAdminCourses = () =>
  apiClient.get("/admin/courses").then((r) => r.data.data.data ?? r.data.data);

export const fetchAdminCoursesPaginated = (
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedResponse<any>> =>
  apiClient
    .get("/admin/courses", { params: { page, pageSize } })
    .then((r) => r.data.data);

export const fetchAdminCourse = (id: string) =>
  apiClient.get(`/admin/courses/${id}`).then((r) => r.data.data);

export const createCourse = (payload: {
  categoryId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  price?: number;
  totalWeeks?: number;
  isDirect2HireCourse?: boolean;
}) => apiClient.post("/admin/courses", payload).then((r) => r.data.data);

export const updateCourse = (id: string, payload: Record<string, unknown>) =>
  apiClient.put(`/admin/courses/${id}`, payload).then((r) => r.data.data);

export const deleteCourse = (id: string) =>
  apiClient.delete(`/admin/courses/${id}`).then((r) => r.data);

export const toggleCoursePublish = (id: string) =>
  apiClient.patch(`/admin/courses/${id}/publish`).then((r) => r.data.data);

// ─── Lessons ──────────────────────────────────────────────────────────────────

export const createLesson = (
  courseId: string,
  payload: {
    weekNumber: number;
    title: string;
    description?: string;
    modules?: string[];
    lessonOrder: number;
    isFreePreview?: boolean;
  },
) =>
  apiClient
    .post(`/admin/courses/${courseId}/lessons`, payload)
    .then((r) => r.data.data);

export const updateLesson = (
  lessonId: string,
  payload: Record<string, unknown>,
) =>
  apiClient.put(`/admin/lessons/${lessonId}`, payload).then((r) => r.data.data);

export const deleteLesson = (lessonId: string) =>
  apiClient.delete(`/admin/lessons/${lessonId}`).then((r) => r.data);

// ─── Topics ───────────────────────────────────────────────────────────────────

export const createTopic = (
    lessonId: string,
    payload: {
        title: string;
        description?: string;
        topicOrder: number;
        duration?: number;
    }
) =>
    apiClient
        .post(`/admin/lessons/${lessonId}/topics`, payload)
        .then((r) => r.data.data);

export const updateTopic = (topicId: string, payload: Record<string, unknown>) =>
    apiClient.put(`/admin/topics/${topicId}`, payload).then((r) => r.data.data);

export const deleteTopic = (topicId: string) =>
    apiClient.delete(`/admin/topics/${topicId}`).then((r) => r.data);

// ─── Video Upload (two-step direct upload, scoped to a topic) ────────────────

interface InitUploadResult {
  videoGuid: string;
  uploadUrl: string;
  accessKey: string;
}

// Step 1: create the Bunny slot
const initVideoUpload = (topicId: string, title: string): Promise<InitUploadResult> =>
    apiClient.post(`/admin/topics/${topicId}/video/init`, { title }).then((r) => r.data.data);

// Step 2: upload the file directly to Bunny via XHR (for progress events)
const uploadDirectToBunny = (
  uploadUrl: string,
  accessKey: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("AccessKey", accessKey);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.total)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status < 300
        ? resolve()
        : reject(new Error(`Bunny upload failed: ${xhr.statusText}`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });

// Step 3: tell the backend to save the resource record
const completeVideoUpload = (topicId: string, videoGuid: string, title: string, fileSize: number) =>
    apiClient
        .post(`/admin/topics/${topicId}/video/complete`, { videoGuid, title, fileSize })
        .then((r) => r.data.data);

// All-in-one helper used by the UI
export const uploadVideo = async (
    topicId: string,
    file: File,
    title: string,
    onProgress?: (pct: number) => void
) => {
    const { videoGuid, uploadUrl, accessKey } = await initVideoUpload(topicId, title);
    await uploadDirectToBunny(uploadUrl, accessKey, file, onProgress);
    return completeVideoUpload(topicId, videoGuid, title, file.size);
};

// ─── File Upload (signed direct-to-Cloudinary, scoped to a topic) ────────────

// All-in-one helper used by the UI — resource_type "auto" so Cloudinary picks
// image vs raw per file (pdf/jpg/png as image, docx/zip/pptx as raw)
export const uploadCourseFile = async (
    topicId: string,
    file: File,
    title: string
) => {
    const { data: signRes } = await apiClient.get<{ success: boolean; data: {
        timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string;
    } }>("/admin/topics/files/sign");
    const { timestamp, signature, apiKey, cloudName, folder } = signRes.data;
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);
    form.append("folder", folder);
    const res = await axios.post<{ secure_url: string; bytes: number }>(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        form
    );
    return apiClient
        .post(`/admin/topics/${topicId}/files`, {
            title,
            url: res.data.secure_url,
            size: res.data.bytes,
            type: file.name.split(".").pop() ?? file.type,
        })
        .then((r) => r.data.data);
};

export const deleteResource = (resourceId: string) =>
  apiClient.delete(`/admin/resources/${resourceId}`).then((r) => r.data);

// ─── Course Image Upload (signed direct upload to Cloudinary) ─────────────────

export const uploadCourseImage = async (file: File): Promise<string> => {
  const { data: signRes } = await apiClient.get<{
    success: boolean;
    data: {
      timestamp: number;
      signature: string;
      apiKey: string;
      cloudName: string;
      folder: string;
    };
  }>("/admin/courses/images/sign");
  const { timestamp, signature, apiKey, cloudName, folder } = signRes.data;
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);
  const res = await axios.post<{ secure_url: string }>(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    form,
  );
  return res.data.secure_url;
};

// ─── Internships ──────────────────────────────────────────────────────────────

export const fetchAdminInternships = () =>
  apiClient
    .get("/admin/internships")
    .then((r) => r.data.data.data ?? r.data.data);

export const fetchAdminInternshipsPaginated = (
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedResponse<any>> =>
  apiClient
    .get("/admin/internships", { params: { page, pageSize } })
    .then((r) => r.data.data);

export const fetchAdminInternship = (id: string) =>
  apiClient.get(`/admin/internships/${id}`).then((r) => r.data.data);

export const createInternship = (payload: {
  categoryId: string;
  title: string;
  company: string;
  description?: string;
  domain?: string;
  stipend?: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "REMOTE";
  location?: string;
  deadline?: string;
}) => apiClient.post("/admin/internships", payload).then((r) => r.data.data);

export const updateInternship = (
  id: string,
  payload: Record<string, unknown>,
) =>
  apiClient.put(`/admin/internships/${id}`, payload).then((r) => r.data.data);

export const deleteInternship = (id: string) =>
  apiClient.delete(`/admin/internships/${id}`).then((r) => r.data);

export const toggleInternshipPublish = (id: string) =>
  apiClient.patch(`/admin/internships/${id}/publish`).then((r) => r.data.data);

// ─── Internship Applications ───────────────────────────────────────────────────

export interface AdminApplicant {
  id: string;
  internshipId: string;
  userId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  appliedAt: string;
  // Snapshot of the resume at the time of application — stays valid even if
  // the user later replaces or deletes their profile resume.
  resumeUrl?: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phoneNo?: string;
    resumeUrl?: string;
  };
}

export const fetchInternshipApplications = (
  internshipId: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<PaginatedResponse<AdminApplicant>> =>
  apiClient
    .get(`/admin/internships/${internshipId}/applications`, {
      params: { page, pageSize },
    })
    .then((r) => r.data.data);

export const updateApplicationStatus = (
  applicationId: string,
  status: "PENDING" | "ACCEPTED" | "REJECTED",
) =>
  apiClient
    .patch(`/admin/applications/${applicationId}/status`, { status })
    .then((r) => r.data.data);

// ─── Investors ──────────────────────────────────────────────────────────────

export interface AdminInvestorCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  _count: { documents: number };
}

export interface AdminInvestorDocument {
  id: string;
  name: string;
  url: string;
  categoryId: string;
  category: { id: string; name: string };
  createdAt: string;
}

export const fetchInvestorCategoriesAdmin = (): Promise<
  AdminInvestorCategory[]
> => apiClient.get("/admin/investors/categories").then((r) => r.data.data);

export const createInvestorCategory = (payload: {
  name: string;
  slug?: string;
  sortOrder?: number;
}) =>
  apiClient
    .post("/admin/investors/categories", payload)
    .then((r) => r.data.data);

export const updateInvestorCategory = (
  id: string,
  payload: Record<string, unknown>,
) =>
  apiClient
    .put(`/admin/investors/categories/${id}`, payload)
    .then((r) => r.data.data);

export const deleteInvestorCategory = (id: string) =>
  apiClient.delete(`/admin/investors/categories/${id}`).then((r) => r.data);

export const fetchInvestorDocumentsPaginated = (
  categoryId?: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<PaginatedResponse<AdminInvestorDocument>> =>
  apiClient
    .get("/admin/investors/documents", {
      params: { page, pageSize, ...(categoryId && { categoryId }) },
    })
    .then((r) => r.data.data);

export const createInvestorDocument = (payload: {
  categoryId: string;
  name: string;
  url: string;
}) =>
  apiClient
    .post("/admin/investors/documents", payload)
    .then((r) => r.data.data);

export const updateInvestorDocument = (
  id: string,
  payload: Record<string, unknown>,
) =>
  apiClient
    .put(`/admin/investors/documents/${id}`, payload)
    .then((r) => r.data.data);

export const deleteInvestorDocument = (id: string) =>
  apiClient.delete(`/admin/investors/documents/${id}`).then((r) => r.data);

// Signed direct upload to Cloudinary (raw resource type, for PDFs)
// ─── Direct2Hire ──────────────────────────────────────────────────────────────

export interface AdminD2HEnrollment {
  id: string;
  userId: string;
  status: "PENDING" | "PAID";
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phoneNo?: string;
  };
}

export const fetchD2HEnrollmentsPaginated = (
  page: number = 1,
  pageSize: number = 20,
): Promise<PaginatedResponse<AdminD2HEnrollment>> =>
  apiClient
    .get("/admin/direct2hire", { params: { page, pageSize } })
    .then((r) => r.data.data);

export const markD2HPaid = (enrollmentId: string) =>
  apiClient
    .patch(`/admin/direct2hire/${enrollmentId}/mark-paid`)
    .then((r) => r.data.data);

// ─── Direct2Hire Student Profiles (read-only) ─────────────────────────────────

export interface AdminD2HStudentListItem {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  institutionName: string | null;
  currentEducation: string | null;
  city: string | null;
  state: string | null;
  paymentCompleted: boolean;
  enrollmentStatus: string;
  joinedAt: string;
  hasSubmittedCounselling: boolean;
  hasRecommendation: boolean;
  recommendedCourseTitle: string | null;
}

export interface AdminD2HStudentProfile {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNo: string | null;
    profileImage: string | null;
    gender: string | null;
    address: string | null;
    state: string | null;
    country: string | null;
    currentStudyLevel: string | null;
    createdAt: string;
  };
  lead: {
    fullName: string;
    email: string;
    phoneNumber: string;
    institutionName: string;
    currentEducation: string;
    city: string;
    state: string;
    paymentCompleted: boolean;
    createdAt: string;
  } | null;
  enrollment: {
    status: string;
    createdAt: string;
  } | null;
  counselling: {
    careerField: string;
    careerFieldOther: string | null;
    futureGoal: string;
    futureGoalOther: string | null;
    careerPriority: string;
    careerPriorityOther: string | null;
    studyStream: string;
    studyStreamOther: string | null;
    planningChallenge: string;
    planningChallengeOther: string | null;
    aiUnderstanding: string;
    aiUnderstandingOther: string | null;
    aiFieldImpact: string;
    aiFieldImpactOther: string | null;
    aiSkillBuilding: string;
    aiSkillBuildingOther: string | null;
    aiEverydayUse: string;
    aiEverydayUseOther: string | null;
    aiCuriosity: string;
    aiCuriosityOther: string | null;
    freeTimeActivity: string;
    freeTimeOther: string | null;
    socialSetting: string;
    socialSettingOther: string | null;
    workEnvironment: string;
    workEnvironmentOther: string | null;
    stressHandling: string;
    stressHandlingOther: string | null;
    proudMoment: string;
    proudMomentOther: string | null;
    personalNote: string | null;
  } | null;
  booking: {
    preferredMode: string;
    notes: string | null;
    status: string;
    counsellorName: string | null;
    meetingLink: string | null;
    scheduledAt: string | null;
    createdAt: string;
    counsellingCompleted: boolean;
    counsellingCompletedAt: string | null;
    selectedCourseId: string | null;
    selectedCourseAt: string | null;
    selectedCourse: { id: string; title: string; slug: string } | null;
  } | null;
  recommendation: {
    recommendedCourseTitle: string;
    recommendedCourseSlug: string;
    confidenceScore: number | null;
    reasoning: string;
    studentStrengths: unknown;
    growthAreas: unknown;
    summary: string | null;
    generatedAt: string;
  } | null;
  internship?: AdminStudentInternshipProgress;
}

export const fetchD2HStudents = (): Promise<AdminD2HStudentListItem[]> =>
  apiClient.get("/admin/direct2hire/students").then((r) => r.data.data);

export const fetchD2HStudentProfile = (
  userId: string,
): Promise<AdminD2HStudentProfile> =>
  apiClient
    .get(`/admin/direct2hire/students/${userId}`)
    .then((r) => r.data.data);

export const confirmD2HBooking = (
  userId: string,
  payload: { counsellorName: string; meetingLink: string; scheduledAt: string },
) =>
  apiClient
    .patch(`/admin/direct2hire/students/${userId}/booking/confirm`, payload)
    .then((r) => r.data.data);

export const markCounsellingCompleted = (userId: string) =>
  apiClient
    .patch(`/admin/direct2hire/students/${userId}/counselling/complete`)
    .then((r) => r.data.data);

export const uploadInvestorDocumentFile = async (
  file: File,
): Promise<string> => {
  const { data: signRes } = await apiClient.get<{
    status: boolean;
    data: {
      timestamp: number;
      signature: string;
      apiKey: string;
      cloudName: string;
      folder: string;
    };
  }>("/admin/investors/documents/upload/sign");
  const { timestamp, signature, apiKey, cloudName, folder } = signRes.data;
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);
  const res = await axios.post<{ secure_url: string }>(
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    form,
  );
  return res.data.secure_url;
};

// ─── Contact Messages ──────────────────────────────────────────────────────────

export interface AdminContact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const fetchAdminContacts = (
  page: number = 1,
  pageSize: number = 20,
): Promise<PaginatedResponse<AdminContact>> =>
  apiClient
    .get("/admin/contacts", { params: { page, pageSize } })
    .then((r) => r.data.data);

export const fetchContactUnreadCount = (): Promise<number> =>
  apiClient.get("/admin/contacts/unread-count").then((r) => r.data.data.count);

export const markContactRead = (id: string) =>
  apiClient.patch(`/admin/contacts/${id}/read`).then((r) => r.data.data);

export const deleteContact = (id: string) =>
  apiClient.delete(`/admin/contacts/${id}`).then((r) => r.data);
