"use client";

import { useEffect, useRef, useState } from "react";

function formatCooldownRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m}m ${s.toString().padStart(2, "0")}s`;
}

/**
 * Live countdown until `availableAt`. Calls `onExpire` once when the cooldown ends
 * so the parent can refetch attempt eligibility.
 */
export function AttemptCooldownCountdown({
  availableAt,
  onExpire,
  className,
}: {
  availableAt: string;
  onExpire?: () => void;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  const expiredNotified = useRef(false);
  const target = new Date(availableAt).getTime();
  const remaining = target - now;

  useEffect(() => {
    expiredNotified.current = false;
  }, [availableAt]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining > 0 || expiredNotified.current) return;
    expiredNotified.current = true;
    onExpire?.();
  }, [remaining, onExpire]);

  if (remaining <= 0) return null;

  return (
    <div className={className}>
      <p className="font-semibold">Next attempt available in</p>
      <p className="mt-1 font-mono text-sm tabular-nums tracking-wide">{formatCooldownRemaining(remaining)}</p>
    </div>
  );
}
