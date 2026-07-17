import apiClient from "@/lib/apiClient";

export interface Direct2HireLead {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  institutionName: string;
  currentEducation: string;
  city: string;
  state: string;
  paymentCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UpsertLeadPayload = Omit<
  Direct2HireLead,
  "id" | "userId" | "paymentCompleted" | "createdAt" | "updatedAt"
>;

export const fetchDirect2HireLead = (): Promise<Direct2HireLead | null> =>
  apiClient.get("/direct2hire/lead").then((response) => response.data.data);

export const upsertDirect2HireLead = (
  payload: UpsertLeadPayload,
): Promise<Direct2HireLead> =>
  apiClient.post("/direct2hire/lead", payload).then((response) => response.data.data);

export const devContinueAsPaid = () =>
  apiClient
    .post("/direct2hire/dev/continue-as-paid")
    .then((response) => response.data.data);
