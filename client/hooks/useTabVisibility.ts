import { useEffect, useRef } from "react";

interface UseTabVisibilityOptions {
  alsoOnBlur?: boolean;
  cooldownMs?: number;
  enabled?: boolean;
}

/** Fires onHidden() when the tab loses visibility/focus, deduped within cooldownMs. */
export function useTabVisibility(onHidden: () => void, options: UseTabVisibilityOptions = {}) {
  const { alsoOnBlur = true, cooldownMs = 1000, enabled = true } = options;
  const lastFiredAt = useRef(0);
  const onHiddenRef = useRef(onHidden);
  onHiddenRef.current = onHidden;

  useEffect(() => {
    if (!enabled) return;

    const trigger = () => {
      const now = Date.now();
      if (now - lastFiredAt.current < cooldownMs) return;
      lastFiredAt.current = now;
      onHiddenRef.current();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) trigger();
    };
    const handleBlur = () => trigger();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (alsoOnBlur) window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (alsoOnBlur) window.removeEventListener("blur", handleBlur);
    };
  }, [alsoOnBlur, cooldownMs, enabled]);
}
