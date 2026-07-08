import apiClient from "./apiClient";

export interface InvestorDocument {
  id: string;
  name: string;
  url: string;
}

export interface InvestorCategory {
  id: string;
  name: string;
  slug: string;
  documents: InvestorDocument[];
}

export const fetchInvestorCategories = (): Promise<InvestorCategory[]> =>
  apiClient.get("/investors").then((r) => r.data.data);
