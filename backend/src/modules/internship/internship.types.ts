export type EmploymentType = "FULL_TIME" | "PART_TIME" | "REMOTE";
export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface OutcomeItem {
  title: string;
  body: string;
}

export interface CreateInternshipBody {
  categoryId: string;
  title: string;
  company: string;
  description?: string;
  domain?: string;
  stipend?: string;
  employmentType: EmploymentType;
  location?: string;
  deadline?: string;
  keyLearningOutcomes?: OutcomeItem[];
  majorProject?: OutcomeItem[];
  whatYouReceive?: OutcomeItem[];
}

export interface UpdateInternshipBody {
  categoryId?: string;
  title?: string;
  company?: string;
  description?: string;
  domain?: string;
  stipend?: string;
  employmentType?: EmploymentType;
  location?: string;
  deadline?: string;
  isPublished?: boolean;
  keyLearningOutcomes?: OutcomeItem[];
  majorProject?: OutcomeItem[];
  whatYouReceive?: OutcomeItem[];
}
