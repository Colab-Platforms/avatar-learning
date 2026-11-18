"use client";

import { useEffect, useRef, useState } from "react";

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function CountdownTimer({ deadline, onExpire }: { deadline: string; onExpire: () => void }) {
  const deadlineMs = new Date(deadline).getTime();
  const [remaining, setRemaining] = useState(() => deadlineMs - Date.now());
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const tick = () => {
      const next = deadlineMs - Date.now();
      setRemaining(next);
      if (next <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadlineMs]);

  const low = remaining < 60_000;

  return (
    <span className={`font-mono text-sm font-semibold tabular-nums ${low ? "text-red-600" : "text-slate-700"}`}>
      {formatRemaining(remaining)}
    </span>
  );
}
