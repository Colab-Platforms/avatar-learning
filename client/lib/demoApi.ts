import apiClient from "./apiClient";
import type { DemoBookingPayload } from "./demoBooking";

export interface DemoBookingResult {
  id: string;
  /** True when this exact request had already been received: nothing new was created. */
  duplicate: boolean;
  preferredAt: string;
}

/** POST /api/demo/book (public). Resolves only when the booking was saved. */
export const bookDemo = (payload: DemoBookingPayload): Promise<DemoBookingResult> => apiClient.post("/demo/book", payload).then((r) => r.data.data);
