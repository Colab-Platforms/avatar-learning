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

export interface OutcomeItem {
  title: string;
  body: string;
}

export interface DBInternship {
  id: string;
  title: string;
  slug: string;
  company: string;
  description?: string;
  domain?: string;
  stipend?: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "REMOTE";
  location?: string;
  deadline?: string;
  isPublished: boolean;
  category: { id: string; name: string; slug: string };
  _count: { applications: number };
}

export interface DBInternshipDetail extends DBInternship {
  keyLearningOutcomes?: OutcomeItem[];
  majorProject?: OutcomeItem[];
  whatYouReceive?: OutcomeItem[];
}

export interface InternshipApplication {
  id: string;
  internshipId: string;
  userId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  appliedAt: string;
}

export interface MyApplication {
  id: string;
  internshipId: string;
  userId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  appliedAt: string;
  internship: DBInternship;
}

export const fetchInternshipsPaginated = (
  page: number = 1,
  pageSize: number = 12,
  categoryId?: string,
): Promise<PaginatedResponse<DBInternship>> =>
  apiClient
    .get("/internships", {
      params: { page, pageSize, ...(categoryId && { categoryId }) },
    })
    .then((r) => r.data.data);

export const fetchInternshipBySlug = (
  slug: string,
): Promise<DBInternshipDetail> =>
  apiClient.get(`/internships/${slug}`).then((r) => r.data.data);

export const applyInternship = (
  internshipId: string,
): Promise<InternshipApplication> =>
  apiClient.post(`/internships/${internshipId}/apply`).then((r) => r.data.data);

export const withdrawApplication = (internshipId: string): Promise<void> =>
  apiClient.delete(`/internships/${internshipId}/apply`).then((r) => r.data);

export const checkApplication = (
  internshipId: string,
): Promise<{ applied: boolean; application: InternshipApplication | null }> =>
  apiClient
    .get(`/internships/${internshipId}/application`)
    .then((r) => r.data.data);

export const fetchMyApplications = (
  page: number = 1,
  pageSize: number = 12,
): Promise<PaginatedResponse<MyApplication>> =>
  apiClient
    .get("/internships/me/applications", { params: { page, pageSize } })
    .then((r) => r.data.data);

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export const fetchInternshipCategories = async (): Promise<Category[]> => {
  try {
    const response = await apiClient.get("/internships", {
      params: { page: 1, pageSize: 10 },
    });
    const internships: DBInternship[] = response.data.data.data;
    const categoriesMap = new Map<string, Category>();
    internships.forEach((i) => {
      if (i.category) {
        const existing = categoriesMap.get(i.category.id);
        if (existing) {
          existing.count += 1;
        } else {
          categoriesMap.set(i.category.id, { ...i.category, count: 1 });
        }
      }
    });
    return Array.from(categoriesMap.values()).sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
};
