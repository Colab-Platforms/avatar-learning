const DISMISS_KEY = "career-quiz-prompt-dismissed-at";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

export function isGuestPromptDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) {
      localStorage.removeItem(DISMISS_KEY);
      return false;
    }
    if (Date.now() - dismissedAt >= DISMISS_TTL_MS) {
      localStorage.removeItem(DISMISS_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function dismissGuestPrompt(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearGuestPromptDismissal(): void {
  try {
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    /* ignore */
  }
}
