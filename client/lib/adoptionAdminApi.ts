import apiClient from "./apiClient";

// Admin calls for AI Adoption tool access. They use the existing admin login
// (apiClient sends the admin's token); the backend checks auth("ADMIN").

export type AdminAccessStatus = "ACTIVE" | "PENDING_SETUP" | "SUSPENDED";
export type AdminToolStatus = AdminAccessStatus | "EXPIRED" | "NO_ACCESS";

export type AdminAdoptionUserRow = {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  activeTools: string[];
  assignedCount: number;
  pendingRequests: number;
};

export type AdminAdoptionTool = {
  product: string;
  name: string;
  description: string;
  status: AdminToolStatus;
  expiresAt: string | null;
  configured: boolean;
  requestedAt: string | null;
};

export type AdminAccessEvent = {
  id: string;
  product: string;
  action: "GRANTED" | "UPDATED" | "REVOKED";
  fromStatus: AdminAccessStatus | null;
  toStatus: AdminAccessStatus | null;
  expiresAt: string | null;
  note: string | null;
  actorEmail: string | null;
  createdAt: string;
};

export type AdminAccessRequest = {
  id: string;
  product: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: string;
  handledAt: string | null;
  handledBy: string | null;
  user?: { id: string; fullName: string; email: string };
};

export const fetchAdoptionUsers = (search = "", page = 1) =>
  apiClient
    .get("/admin/adoption/users", { params: { page, pageSize: 20, ...(search && { search }) } })
    .then((r) => r.data.data as { total: number; page: number; pageSize: number; users: AdminAdoptionUserRow[] });

export const fetchAdoptionUser = (id: string) =>
  apiClient.get(`/admin/adoption/users/${id}`).then(
    (r) =>
      r.data.data as {
        user: { id: string; fullName: string; email: string; emailVerified: boolean; isActive: boolean; createdAt: string };
        tools: AdminAdoptionTool[];
        history: AdminAccessEvent[];
        requests: AdminAccessRequest[];
      },
  );

export const setAdoptionAccess = (userId: string, product: string, body: { status: AdminAccessStatus; expiresAt: string | null; note?: string }) =>
  apiClient.put(`/admin/adoption/users/${userId}/tools/${product}`, body).then((r) => r.data.data.tools as AdminAdoptionTool[]);

export const removeAdoptionAccess = (userId: string, product: string) =>
  apiClient.delete(`/admin/adoption/users/${userId}/tools/${product}`).then((r) => r.data.data.tools as AdminAdoptionTool[]);

export const fetchAdoptionRequests = (status: "PENDING" | "APPROVED" | "DECLINED" = "PENDING") =>
  apiClient.get("/admin/adoption/requests", { params: { status } }).then((r) => r.data.data.requests as AdminAccessRequest[]);

export const declineAdoptionRequest = (id: string) => apiClient.patch(`/admin/adoption/requests/${id}/decline`).then((r) => r.data);

/** Error text from an axios error (the backend puts it in `message`). */
export const apiErrorText = (e: unknown) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message || (e as Error)?.message || "Something went wrong.";

export type AdminDemoStatus = "SUBMITTED" | "UNDER_REVIEW" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type AdminDemoRequest = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  role: string;
  companySize: string;
  tools: string[];
  customRequirement: string | null;
  message: string | null;
  status: AdminDemoStatus;
  scheduledAt: string | null;
  adminNote: string | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string } | null;
};

export const fetchAdoptionDemoRequests = (status?: AdminDemoStatus) =>
  apiClient.get("/admin/adoption/demo-requests", { params: status ? { status } : {} }).then((r) => r.data.data.requests as AdminDemoRequest[]);

export const updateAdoptionDemoRequest = (id: string, body: { status: AdminDemoStatus; scheduledAt?: string | null; adminNote?: string | null }) =>
  apiClient.patch(`/admin/adoption/demo-requests/${id}`, body).then((r) => r.data.data.request as AdminDemoRequest);
