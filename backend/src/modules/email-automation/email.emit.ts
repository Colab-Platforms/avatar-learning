import { logger } from "@/utils/logger.js";

/**
 * Fire-and-forget hooks called from the Adoption flows AFTER the real event is saved.
 * No-ops unless EMAIL_AUTOMATION_ENABLED=true, and can never throw into or slow the caller (registration, demo request).
 */
function emit(event: "USER_REGISTERED" | "DEMO_REQUESTED", userId: string, subjectId: string): void {
  if (process.env.EMAIL_AUTOMATION_ENABLED?.trim().toLowerCase() !== "true") return;
  void import("./email-automation.runtime.js")
    .then(({ emailAutomation }) => emailAutomation.handleEvent({ event, userId, subjectId }))
    .catch((e) => logger.error(`[EmailAutomation] ${event} hook failed: ${e instanceof Error ? e.name : "unknown error"}`));
}

/** A person's email was verified (or they signed up with Google). One welcome per person: the account id is the event id. */
export const emitUserRegistered = (userId: string) => emit("USER_REGISTERED", userId, userId);

/** A demo request was saved by a signed-in Adoption account. The request id is the event id. */
export const emitDemoRequested = (userId: string, requestId: string) => emit("DEMO_REQUESTED", userId, requestId);
