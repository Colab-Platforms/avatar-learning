export type CreateJobPlacementEntryInput = {
  companyName: string;
  jobTitle: string;
  location?: string | null;
  ctcLpa?: number | null;
  joinedAt: string;
  notes?: string | null;
};

export type UpdateJobPlacementEntryInput = {
  companyName?: string;
  jobTitle?: string;
  location?: string | null;
  ctcLpa?: number | null;
  joinedAt?: string;
  leftAt?: string | null;
  notes?: string | null;
};

export type JobPlacementEntryResponse = {
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
};

export type JobPlacementJourneyBundle = {
  canManage: boolean;
  entries: JobPlacementEntryResponse[];
};
