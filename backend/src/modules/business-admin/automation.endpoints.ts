// Which REAL website endpoint performs each customer activity, and whether its success is connected to automation.
// This is a statement about the code, verified by test/business-admin/automation.endpoints.test.ts (every `connected`
// route must exist in the route files, and its source file must call emitAutomationEvent). It is not user-editable.

export interface EndpointInfo {
  event: string;
  /** "connected": success calls emitAutomationEvent. "no_phone": the endpoint exists but collects no phone. "missing": no endpoint exists. */
  status: "connected" | "no_phone" | "missing";
  method: string | null;
  /** Full API route as served (mount prefix included). Null when no endpoint exists. */
  route: string | null;
  /** When exactly the event fires (only after the action succeeded). */
  firesWhen: string;
  /** Repo-relative file that calls emitAutomationEvent (connected only). */
  source: string | null;
  /** Other real endpoints/paths that complete the same activity and share the single hook. */
  alsoVia: string[];
  /** What is missing / needs to be implemented. */
  needs: string | null;
}

export const ENDPOINTS: EndpointInfo[] = [
  {
    event: "demo.requested", status: "connected", method: "POST", route: "/api/demo/book", source: "backend/src/modules/demo/demo.service.ts", alsoVia: [],
    firesWhen: "After the Book a demo form is validated and the booking row is saved (or found again on a repeated submit). Validation failures and failed saves fire nothing. The booking never depends on the WhatsApp result.",
    needs: null,
  },
  {
    event: "user.registered", status: "connected", method: "POST", route: "/api/auth/verify-otp", source: "backend/src/modules/auth/auth.service.ts", alsoVia: [],
    firesWhen: "After the email OTP verifies a REGISTER and the account is first marked verified (not on login, not on failed OTP). POST /api/auth/register only creates the pending account and sends the OTP.",
    needs: null,
  },
  {
    event: "demo.scheduled", status: "missing", method: null, route: null, source: null, alsoVia: [],
    firesWhen: "—", needs: "No demo scheduling endpoint exists. Implement one (with date/time and customer phone) and call emitAutomationEvent after it saves.",
  },
  {
    event: "demo.rescheduled", status: "missing", method: null, route: null, source: null, alsoVia: [],
    firesWhen: "—", needs: "No demo rescheduling endpoint exists. Implement one and call emitAutomationEvent after it saves.",
  },
  {
    event: "demo.cancelled", status: "missing", method: null, route: null, source: null, alsoVia: [],
    firesWhen: "—", needs: "No demo cancellation endpoint exists. Implement one and call emitAutomationEvent after it saves.",
  },
  {
    event: "contact.submitted", status: "no_phone", method: "POST", route: "/api/contact", source: null, alsoVia: [],
    firesWhen: "—",
    needs: "The endpoint exists but its form collects only name, email, subject and message: there is no phone number to message. Add an optional phone field to the contact form and validator, then call emitAutomationEvent after it saves.",
  },
  {
    event: "webinar.registered", status: "connected", method: "POST", route: "/api/webinar/verify-payment", source: "backend/src/modules/webinar/webinar.service.ts",
    alsoVia: ["POST /api/webinar/create-order (free webinars)", "POST /api/payment/webhook (Razorpay fallback)"],
    firesWhen: "When a registration becomes PAID (free registration, verified payment, or the Razorpay webhook), once per registration.", needs: null,
  },
  {
    event: "payment.succeeded", status: "connected", method: "POST", route: "/api/payment/verify", source: "backend/src/modules/payment/payment.service.ts",
    alsoVia: ["POST /api/payment/webhook (Razorpay)", "POST /api/payment/webhook/cashfree"],
    firesWhen: "When the payment is recorded for the first time (whichever of verify or webhook wins). Failed or already-recorded payments never fire it.", needs: null,
  },
  {
    event: "course.enrolled", status: "connected", method: "POST", route: "/api/courses/:courseId/enroll", source: "backend/src/modules/course/course.service.ts",
    alsoVia: ["Paid course purchase via POST /api/payment/verify and the payment webhooks"],
    firesWhen: "After the enrolment row is created (free course) or the purchased course is first granted. Re-enrolling never fires it.", needs: null,
  },
];

export const endpointFor = (event: string): EndpointInfo | undefined => ENDPOINTS.find((e) => e.event === event);
