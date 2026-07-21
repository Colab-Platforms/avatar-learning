export interface ApplyPartnerBody {
  type: "INDIVIDUAL" | "INSTITUTE" | "CORPORATE";
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
  // KYC — required for INDIVIDUAL/INSTITUTE, absent for CORPORATE
  aadharNumber?: string;
  aadharFileUrl?: string;
  panNumber?: string;
  panFileUrl?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankProofFileUrl?: string;
}
