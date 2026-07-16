import apiClient from "./apiClient";
import type { PaginatedResponse } from "./coursesApi";

export type PartnerType = "INDIVIDUAL" | "INSTITUTE" | "CORPORATE";
export type PartnerStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Partner {
  id: string;
  userId: string;
  type: PartnerType;
  status: PartnerStatus;
  organizationName: string | null;
  contactPerson: string | null;
  designation: string | null;
  instituteType: string | null;
  phone: string;
  email: string;
  location: string | null;
  profession: string | null;
  linkedin: string | null;
  website: string | null;
  referralCode: string | null;
  walletBalance: number;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
}

export interface PartnerReferral {
  id: string;
  commissionEarned: number;
  commissionRate: number | null;
  creditedAt: string | null;
  createdAt: string;
  referredUser: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export interface ApplyPartnerPayload {
  type: PartnerType;
  organizationName?: string;
  contactPerson?: string;
  designation?: string;
  instituteType?: string;
  phone: string;
  email: string;
  location?: string;
  profession?: string;
  linkedin?: string;
  website?: string;
}

export const applyAsPartner = (payload: ApplyPartnerPayload): Promise<Partner> =>
  apiClient.post("/partners/apply", payload).then((r) => r.data.data);

export const getMyPartner = (): Promise<Partner | null> =>
  apiClient.get("/partners/me").then((r) => r.data.data);

export const getMyReferrals = (
  page: number = 1,
  pageSize: number = 20,
): Promise<PaginatedResponse<PartnerReferral>> =>
  apiClient
    .get("/partners/me/referrals", { params: { page, pageSize } })
    .then((r) => r.data.data);

export const requestClaim = () =>
  apiClient.post("/partners/me/claim").then((r) => r.data.data);
