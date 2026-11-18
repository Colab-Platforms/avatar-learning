import apiClient from "./apiClient";

export interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const submitContact = (payload: ContactFormPayload) =>
  apiClient.post("/contact", payload).then((r) => r.data.data);
