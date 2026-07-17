export interface Direct2HireLeadResponse {
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

export interface UpsertDirect2HireLeadInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  institutionName: string;
  currentEducation: string;
  city: string;
  state: string;
}
