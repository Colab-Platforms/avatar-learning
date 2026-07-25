"use client";

import { useEffect, useRef } from "react";

const PLAYERJS_SRC =
  "https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js";
/** Mark complete once the viewer has seen this much of the video (fallback). */
const COMPLETION_THRESHOLD = 0.9;

type TimeUpdateData = {
  seconds?: number;
  duration?: number;
};

type PlayerJsPlayer = {
  on: (event: string, cb: (data?: TimeUpdateData) => void) => void;
  off: (event: string, cb?: (data?: TimeUpdateData) => void) => void;
};

type PlayerJsApi = {
  Player: new (iframe: HTMLIFrameElement | string) => PlayerJsPlayer;
};

declare global {
  interface Window {
    playerjs?: PlayerJsApi;
  }
}

function loadPlayerJs(): Promise<PlayerJsApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Player.js requires a browser"));
  }
  if (window.playerjs?.Player) {
    return Promise.resolve(window.playerjs);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-bunny-playerjs]",
    );

    const onReady = () => {
      if (window.playerjs?.Player) resolve(window.playerjs);
      else reject(new Error("Player.js failed to initialize"));
    };

    if (existing) {
      if (window.playerjs?.Player) {
        onReady();
        return;
      }
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Player.js")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = PLAYERJS_SRC;
    script.async = true;
    script.dataset.bunnyPlayerjs = "true";
    script.onload = onReady;
    script.onerror = () => reject(new Error("Failed to load Player.js"));
    document.head.appendChild(script);
  });
}

/**
 * Uses Bunny's official Player.js bridge so `ended` / `timeupdate` actually fire.
 * Passive window `message` listening is not enough — listeners must be registered
 * on the iframe via Player.js.
 */
export function useBunnyIntroCompletion(
  enabled: boolean,
  iframe: HTMLIFrameElement | null,
  onComplete: () => void | Promise<void>,
) {
  const completedRef = useRef(false);
  const maxProgressRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!enabled || !iframe) return;

    completedRef.current = false;
    maxProgressRef.current = 0;
    let cancelled = false;
    let player: PlayerJsPlayer | null = null;

    const finish = () => {
      if (cancelled || completedRef.current) return;
      completedRef.current = true;
      void Promise.resolve(onCompleteRef.current()).catch(() => {
        // Allow another attempt if the API call fails
        completedRef.current = false;
      });
    };

    const onEnded = () => finish();
    const onTimeUpdate = (data?: TimeUpdateData) => {
      const seconds = Number(data?.seconds ?? 0);
      const duration = Number(data?.duration ?? 0);
      if (duration <= 0) return;
      const progress = seconds / duration;
      if (progress > maxProgressRef.current) {
        maxProgressRef.current = progress;
      }
      if (maxProgressRef.current >= COMPLETION_THRESHOLD) {
        finish();
      }
    };

    void (async () => {
      try {
        const playerjs = await loadPlayerJs();
        if (cancelled) return;

        player = new playerjs.Player(iframe);
        player.on("ready", () => {
          if (cancelled || !player) return;
          player.on("ended", onEnded);
          player.on("timeupdate", onTimeUpdate);
        });
      } catch {
        // Player.js unavailable — UI "Mark Complete" button still works
      }
    })();

    return () => {
      cancelled = true;
      try {
        player?.off("ended", onEnded);
        player?.off("timeupdate", onTimeUpdate);
      } catch {
        // ignore cleanup errors from torn-down iframe
      }
    };
  }, [enabled, iframe]);
}
