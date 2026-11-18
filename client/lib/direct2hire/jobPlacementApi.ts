import apiClient from "@/lib/apiClient";

export interface JobPlacementEntry {
  id: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  location: string | null;
  ctcLpa: number | null;
  joinedAt: string;
  leftAt: string | null;
  isCurrent: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobPlacementJourneyBundle {
  canManage: boolean;
  entries: JobPlacementEntry[];
}

export type CreateJobPlacementEntryPayload = {
  companyName: string;
  jobTitle: string;
  location?: string | null;
  ctcLpa?: number | null;
  joinedAt: string;
  notes?: string | null;
};

export type UpdateJobPlacementEntryPayload = Partial<CreateJobPlacementEntryPayload> & {
  leftAt?: string | null;
};

export const fetchMyJobPlacementJourney = (): Promise<JobPlacementJourneyBundle> =>
  apiClient.get("/direct2hire/job-placement").then((r) => r.data.data);

export const createJobPlacementEntry = (
  payload: CreateJobPlacementEntryPayload,
): Promise<JobPlacementEntry> =>
  apiClient.post("/direct2hire/job-placement", payload).then((r) => r.data.data);

export const updateJobPlacementEntry = (
  entryId: string,
  payload: UpdateJobPlacementEntryPayload,
): Promise<JobPlacementEntry> =>
  apiClient
    .put(`/direct2hire/job-placement/${entryId}`, payload)
    .then((r) => r.data.data);

export const deleteJobPlacementEntry = (entryId: string): Promise<void> =>
  apiClient.delete(`/direct2hire/job-placement/${entryId}`).then((r) => r.data);

export const fetchAdminStudentJobPlacementJourney = (
  userId: string,
): Promise<JobPlacementJourneyBundle> =>
  apiClient
    .get(`/admin/direct2hire/students/${userId}/job-placement`)
    .then((r) => r.data.data);
