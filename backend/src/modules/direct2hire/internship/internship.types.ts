export type InternshipSubmissionStatus =
  | "UNDER_REVIEW"
  | "APPROVED"
  | "CHANGES_REQUESTED";

export type SubmissionAttachmentKind = "FILE" | "LINK";

export type InternshipDerivedStatus =
  | "LOCKED"
  | "AVAILABLE"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "CHANGES_REQUESTED";

export type BackendSubmissionStatus =
  | "NOT_STARTED"
  | InternshipSubmissionStatus;

export interface TaskAttachmentInput {
  url: string;
  publicId: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}

export interface CreateInternshipTaskInput {
  weekNumber: number;
  title: string;
  shortDescription: string;
  detailedInstructions: string;
  expectedDeliverables: string;
  estimatedHours?: number | null;
  isPublished?: boolean;
  attachments?: TaskAttachmentInput[];
}

export interface UpdateInternshipTaskInput {
  weekNumber?: number;
  title?: string;
  shortDescription?: string;
  detailedInstructions?: string;
  expectedDeliverables?: string;
  estimatedHours?: number | null;
  isPublished?: boolean;
  attachments?: TaskAttachmentInput[];
}

export interface SubmissionFileInput {
  url: string;
  publicId: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}

export interface SubmissionLinkInput {
  url: string;
  label?: string | null;
}

export interface SubmitInternshipTaskInput {
  files?: SubmissionFileInput[];
  links?: SubmissionLinkInput[];
  studentNotes?: string | null;
}

export type ReviewAction = "APPROVED" | "CHANGES_REQUESTED";

export interface ReviewSubmissionInput {
  status: ReviewAction;
  adminFeedback?: string | null;
}

export interface InternshipProgressSummary {
  approved: number;
  underReview: number;
  available: number;
  locked: number;
  total: number;
  approvedCount: number;
}

export interface InternshipTaskAttachmentDto {
  id: string;
  url: string;
  publicId: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}

export interface InternshipSubmissionAttachmentDto {
  id: string;
  kind: SubmissionAttachmentKind;
  label: string | null;
  url: string;
  publicId: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  size: number | null;
}

export interface InternshipSubmissionDto {
  id: string;
  status: InternshipSubmissionStatus;
  studentNotes: string | null;
  adminFeedback: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  attachments: InternshipSubmissionAttachmentDto[];
}

export interface StudentInternshipTaskDto {
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
  submission: InternshipSubmissionDto | null;
  attachments: InternshipTaskAttachmentDto[];
}

export interface StudentInternshipDashboardDto {
  course: { id: string; title: string; slug: string } | null;
  progress: InternshipProgressSummary;
  tasks: StudentInternshipTaskDto[];
}

export interface AdminInternshipTaskDto {
  id: string;
  courseId: string;
  weekNumber: number;
  title: string;
  shortDescription: string;
  detailedInstructions: string;
  expectedDeliverables: string;
  estimatedHours: number | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  attachments: InternshipTaskAttachmentDto[];
}

export interface AdminStudentInternshipTaskDto {
  taskId: string;
  weekNumber: number;
  title: string;
  shortDescription: string;
  isPublished: boolean;
  isUnlocked: boolean;
  derivedStatus: InternshipDerivedStatus;
  backendStatus: BackendSubmissionStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  studentNotes: string | null;
  adminFeedback: string | null;
  submissionId: string | null;
  attachments: InternshipSubmissionAttachmentDto[];
}

export interface AdminStudentInternshipProgressDto {
  course: { id: string; title: string; slug: string } | null;
  progress: InternshipProgressSummary;
  tasks: AdminStudentInternshipTaskDto[];
}
