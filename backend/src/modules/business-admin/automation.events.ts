// Catalog of customer activities an automation can follow. An activity = a trigger event + the REAL website endpoint that
// performs it (automation.endpoints.ts) + an editable rule (template, variable mapping, on/off) stored in the database.
// Nothing here sends a message: the suggested wording is only offered as a starting point for a Meta template DRAFT.

export interface EventField {
  key: string;
  label: string;
}

export interface SuggestedTemplate {
  /** Meta-valid name for the draft. */
  name: string;
  category: "UTILITY" | "MARKETING";
  /** Numbered variables; {{n}} maps to `mapping[n]` (an event field key) by default. */
  body: string;
  /** Event field key for each {{n}} (in order), also used to prefill the rule's variable mapping. */
  mapping: string[];
  /** Sample value for each {{n}} (Meta needs samples). */
  examples: string[];
}

export interface EventDef {
  key: string;
  /** Customer activity name, e.g. "Book a demo". */
  activity: string;
  label: string;
  description: string;
  /** Values the triggering code supplies (besides the recipient phone), usable in variable mappings. */
  fields: EventField[];
  suggested: SuggestedTemplate;
}

const person: EventField[] = [
  { key: "name", label: "Customer name" },
  { key: "email", label: "Customer email" },
];
const demo: EventField[] = [...person, { key: "demo_date", label: "Demo date" }, { key: "demo_time", label: "Demo time" }];

export const EVENTS: EventDef[] = [
  {
    key: "demo.requested", activity: "Book a demo", label: "Demo requested", description: "A customer asked to book a demo.", fields: demo,
    suggested: { name: "demo_requested_thanks", category: "UTILITY", body: "Hi {{1}}, thank you for booking a demo with Avatar. Our team will be in touch shortly to confirm the details.", mapping: ["name"], examples: ["Asha"] },
  },
  {
    key: "user.registered", activity: "New registration", label: "New registration", description: "A new account was created and its email verified.", fields: person,
    suggested: { name: "welcome_to_avatar", category: "UTILITY", body: "Hi {{1}}, welcome to Avatar! Your account is ready. Explore our courses and start learning today.", mapping: ["name"], examples: ["Asha"] },
  },
  {
    key: "demo.scheduled", activity: "Demo scheduled", label: "Demo scheduled", description: "A demo was scheduled for a date and time.", fields: demo,
    suggested: { name: "demo_confirmed", category: "UTILITY", body: "Hi {{1}}, your demo is confirmed for {{2}} at {{3}}. We look forward to meeting you.", mapping: ["name", "demo_date", "demo_time"], examples: ["Asha", "25 Nov", "4:00 PM"] },
  },
  {
    key: "demo.rescheduled", activity: "Demo rescheduled", label: "Demo rescheduled", description: "A scheduled demo was moved.", fields: demo,
    suggested: { name: "demo_rescheduled", category: "UTILITY", body: "Hi {{1}}, your demo has been rescheduled to {{2}} at {{3}}. See you then.", mapping: ["name", "demo_date", "demo_time"], examples: ["Asha", "26 Nov", "5:00 PM"] },
  },
  {
    key: "demo.cancelled", activity: "Demo cancelled", label: "Demo cancelled", description: "A scheduled demo was cancelled.", fields: demo,
    suggested: { name: "demo_cancelled", category: "UTILITY", body: "Hi {{1}}, your demo has been cancelled. Message us here any time if you would like to book another.", mapping: ["name"], examples: ["Asha"] },
  },
  {
    key: "contact.submitted", activity: "Contact form submitted", label: "Contact form submitted", description: "Someone sent the website contact form.",
    fields: [...person, { key: "subject", label: "Subject" }],
    suggested: { name: "contact_thanks", category: "UTILITY", body: "Hi {{1}}, thank you for contacting Avatar. We have received your message and will reply soon.", mapping: ["name"], examples: ["Asha"] },
  },
  {
    key: "webinar.registered", activity: "Webinar registration", label: "Webinar registration", description: "A webinar registration was confirmed (free, or payment completed).",
    fields: [...person, { key: "webinar_title", label: "Webinar title" }, { key: "webinar_date", label: "Webinar date" }],
    suggested: { name: "webinar_registration_confirmed", category: "UTILITY", body: "Hi {{1}}, your registration for {{2}} is confirmed. We will see you at the webinar.", mapping: ["name", "webinar_title"], examples: ["Asha", "AI for Beginners"] },
  },
  {
    key: "payment.succeeded", activity: "Payment successful", label: "Payment successful", description: "A payment was captured and recorded.",
    fields: [...person, { key: "amount", label: "Amount (INR)" }, { key: "product_name", label: "Product" }, { key: "payment_id", label: "Payment reference" }],
    suggested: { name: "payment_confirmation", category: "UTILITY", body: "Hi {{1}}, we have received your payment of Rs {{2}} for {{3}}. Thank you!", mapping: ["name", "amount", "product_name"], examples: ["Asha", "499", "AI Foundations"] },
  },
  {
    key: "course.enrolled", activity: "Course enrollment", label: "Course enrollment", description: "A learner was enrolled in a course (free enrolment or paid purchase).",
    fields: [...person, { key: "course_name", label: "Course name" }],
    suggested: { name: "course_welcome", category: "UTILITY", body: "Hi {{1}}, welcome to {{2}}! You can start learning from your Avatar dashboard right away.", mapping: ["name", "course_name"], examples: ["Asha", "AI Foundations"] },
  },
];

export const eventByKey = (key: string): EventDef | undefined => EVENTS.find((e) => e.key === key);
