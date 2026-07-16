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
}
