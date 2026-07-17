import axios from "axios";
import apiClient from "./apiClient";

export type InternshipDerivedStatus =
  | "LOCKED"
  | "AVAILABLE"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "CHANGES_REQUESTED";

export type BackendSubmissionStatus =
  | "NOT_STARTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "CHANGES_REQUESTED";

export interface InternshipTaskAttachment {
  id: string;
  url: string;
  publicId: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}

export interface InternshipSubmissionAttachment {
  id: string;
  kind: "FILE" | "LINK";
  label: string | null;
  url: string;
  publicId: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  size: number | null;
}

export interface InternshipSubmission {
  id: string;
  status: "UNDER_REVIEW" | "APPROVED" | "CHANGES_REQUESTED";
  studentNotes: string | null;
  adminFeedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  attachments: InternshipSubmissionAttachment[];
}

export interface InternshipProgress {
  approved: number;
  underReview: number;
  available: number;
  locked: number;
  total: number;
  approvedCount: number;
}

export interface StudentInternshipTask {
  id: string;
  weekNumber: number;
  title: string;
  shortDescription: string;
  detailedInstructions: string;
  expectedDeliverables: string;
  estimatedHours: number | null;
  isUnlocked: boolean;
  derivedStatus: InternshipDerivedStatus;
  backendStatus: BackendSubmissionStatus;
  submission: InternshipSubmission | null;
  attachments: InternshipTaskAttachment[];
}

export interface StudentInternshipDashboard {
  course: { id: string; title: string; slug: string } | null;
  progress: InternshipProgress;
  tasks: StudentInternshipTask[];
}

export interface AdminInternshipTask {
  id: string;
  courseId: string;
  weekNumber: number;
  title: string;
  shortDescription: string;
  detailedInstructions: string;
  expectedDeliverables: string;
  estimatedHours: number | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string | null;
  attachments: InternshipTaskAttachment[];
}

export interface TaskAttachmentInput {
  url: string;
  publicId: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}

export interface CreateInternshipTaskPayload {
  weekNumber: number;
  title: string;
  shortDescription: string;
  detailedInstructions: string;
  expectedDeliverables: string;
  estimatedHours?: number | null;
  isPublished?: boolean;
  attachments?: TaskAttachmentInput[];
}

export interface UpdateInternshipTaskPayload {
  weekNumber?: number;
  title?: string;
  shortDescription?: string;
  detailedInstructions?: string;
  expectedDeliverables?: string;
  estimatedHours?: number | null;
  isPublished?: boolean;
  attachments?: TaskAttachmentInput[];
}

export interface SubmitInternshipPayload {
  files?: TaskAttachmentInput[];
  links?: { url: string; label?: string | null }[];
  studentNotes?: string | null;
}

export interface ReviewSubmissionPayload {
  status: "APPROVED" | "CHANGES_REQUESTED";
  adminFeedback?: string | null;
}

export interface AdminStudentInternshipTask {
  taskId: string;
  weekNumber: number;
  title: string;
  shortDescription: string;
  isPublished: boolean;
  isUnlocked: boolean;
  derivedStatus: InternshipDerivedStatus;
  backendStatus: BackendSubmissionStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  studentNotes: string | null;
  adminFeedback: string | null;
  submissionId: string | null;
  attachments: InternshipSubmissionAttachment[];
}

export interface AdminStudentInternshipProgress {
  course: { id: string; title: string; slug: string } | null;
  progress: InternshipProgress;
  tasks: AdminStudentInternshipTask[];
}

const SUPPORTED_ACCEPT =
  ".pdf,.doc,.docx,.zip,.rar,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/x-rar-compressed,image/png,image/jpeg";

export const INTERNSHIP_FILE_ACCEPT = SUPPORTED_ACCEPT;
export const INTERNSHIP_MAX_FILE_SIZE = 25 * 1024 * 1024;

const SUPPORTED_EXTS = new Set([
  "pdf",
  "doc",
  "docx",
  "zip",
  "rar",
  "png",
  "jpg",
  "jpeg",
]);

export function isSupportedInternshipFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return SUPPORTED_EXTS.has(ext);
}

type CloudinarySign = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
};

async function getStudentUploadSign(): Promise<CloudinarySign> {
  const { data } = await apiClient.get<{ success: boolean; data: CloudinarySign }>(
    "/direct2hire/internship/upload/sign",
  );
  return data.data;
}

async function getAdminUploadSign(): Promise<CloudinarySign> {
  const { data } = await apiClient.get<{ success: boolean; data: CloudinarySign }>(
    "/admin/direct2hire/upload/sign",
  );
  return data.data;
}

export async function uploadInternshipFileToCloudinary(
  file: File,
  role: "user" | "admin" = "user",
): Promise<TaskAttachmentInput> {
  if (!isSupportedInternshipFile(file)) {
    throw new Error(
      "Unsupported file type. Allowed: PDF, DOC, DOCX, ZIP, RAR, PNG, JPG, JPEG",
    );
  }
  if (file.size > INTERNSHIP_MAX_FILE_SIZE) {
    throw new Error("File exceeds the 25 MB upload limit");
  }

  const sign =
    role === "admin"
      ? await getAdminUploadSign()
      : await getStudentUploadSign();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);

  const res = await axios.post<{
    secure_url: string;
    public_id: string;
    bytes: number;
    format?: string;
  }>(`https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`, form);

  return {
    url: res.data.secure_url,
    publicId: res.data.public_id,
    originalFilename: file.name,
    mimeType: file.type || "application/octet-stream",
    size: res.data.bytes ?? file.size,
  };
}

// ─── Student APIs ────────────────────────────────────────────────────────────

export const fetchMyInternshipTasks =
  (): Promise<StudentInternshipDashboard> =>
    apiClient
      .get("/direct2hire/internship/tasks")
      .then((r) => r.data.data);

export const fetchMyInternshipTask = (
  taskId: string,
): Promise<StudentInternshipTask> =>
  apiClient
    .get(`/direct2hire/internship/tasks/${taskId}`)
    .then((r) => r.data.data);

export const submitInternshipTask = (
  taskId: string,
  payload: SubmitInternshipPayload,
): Promise<InternshipSubmission> =>
  apiClient
    .post(`/direct2hire/internship/tasks/${taskId}/submit`, payload)
    .then((r) => r.data.data);

// ─── Admin APIs ──────────────────────────────────────────────────────────────

export const fetchAdminInternshipTasks = (
  courseId: string,
): Promise<AdminInternshipTask[]> =>
  apiClient
    .get(`/admin/direct2hire/course/${courseId}/internship-tasks`)
    .then((r) => r.data.data);

export const createAdminInternshipTask = (
  courseId: string,
  payload: CreateInternshipTaskPayload,
): Promise<AdminInternshipTask> =>
  apiClient
    .post(`/admin/direct2hire/course/${courseId}/internship-tasks`, payload)
    .then((r) => r.data.data);

export const updateAdminInternshipTask = (
  taskId: string,
  payload: UpdateInternshipTaskPayload,
): Promise<AdminInternshipTask> =>
  apiClient
    .put(`/admin/direct2hire/internship-tasks/${taskId}`, payload)
    .then((r) => r.data.data);

export const deleteAdminInternshipTask = (taskId: string) =>
  apiClient
    .delete(`/admin/direct2hire/internship-tasks/${taskId}`)
    .then((r) => r.data);

export const reviewInternshipSubmission = (
  submissionId: string,
  payload: ReviewSubmissionPayload,
) =>
  apiClient
    .patch(
      `/admin/direct2hire/internship-submissions/${submissionId}/review`,
      payload,
    )
    .then((r) => r.data.data);
