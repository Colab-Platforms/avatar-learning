const WEBINAR_REGISTRATION_ID_KEY = "webinarRegistrationId";

export function getStoredWebinarRegistrationId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(WEBINAR_REGISTRATION_ID_KEY);
  } catch {
    return null;
  }
}

export function setStoredWebinarRegistrationId(registrationId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WEBINAR_REGISTRATION_ID_KEY, registrationId);
  } catch {
    // localStorage unavailable (private mode, disabled storage, etc.) — the
    // URL/backend status check remains the source of truth regardless.
  }
}

export function clearStoredWebinarRegistrationId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WEBINAR_REGISTRATION_ID_KEY);
  } catch {
    // ignore
  }
}
