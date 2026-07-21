import axios from "axios";
import apiClient from "./apiClient";
import type { PaginatedResponse } from "./coursesApi";

export type PartnerType = "INDIVIDUAL" | "INSTITUTE" | "CORPORATE";

// sessionStorage key used to hand step-1 details off to /partners/onboarding
export const PARTNER_ONBOARDING_DRAFT_KEY = "partner_onboarding_draft";
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
  purpose: string | null;
  aadharNumber: string | null;
  aadharFileUrl: string | null;
  panNumber: string | null;
  panFileUrl: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankProofFileUrl: string | null;
  referralCode: string | null;
  walletBalance: number;
  reviewNote: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
}

export interface PartnerReferral {
  id: string;
  commissionEarned: number;
  commissionRate: number | null;
  creditedAt: string | null;
  // Set once the referred user pays for Direct2Hire — commission stays on
  // hold until this date (10-day refund-safety window) before it's credited.
  eligibleAt: string | null;
  isRefunded: boolean;
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
  purpose: string;
  aadharNumber?: string;
  aadharFileUrl?: string;
  panNumber?: string;
  panFileUrl?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankProofFileUrl?: string;
}

export const applyAsPartner = (payload: ApplyPartnerPayload): Promise<Partner> =>
  apiClient.post("/partners/apply", payload).then((r) => r.data.data);

// Uploads a KYC file (Aadhar/PAN/bank proof) straight to Cloudinary using a
// signed token from our backend, returns the file's public URL.
export const uploadPartnerKycFile = async (file: File): Promise<string> => {
  const { data: signRes } = await apiClient.get<{
    data: { timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string };
  }>("/partners/kyc/upload/sign");
  const { timestamp, signature, apiKey, cloudName, folder } = signRes.data;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);

  const cloudinaryRes = await axios.post<{ secure_url: string }>(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    form,
  );
  return cloudinaryRes.data.secure_url;
};

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
