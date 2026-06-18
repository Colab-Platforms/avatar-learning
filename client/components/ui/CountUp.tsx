"use client";

import { useEffect, useRef, useState } from "react";

function parse(raw: string): { num: number; prefix: string; suffix: string; decimals: number } {
  // Handles: "10,000+", "4.9", "95%", "$500K"
  const m = raw.match(/^([^0-9]*)([0-9,\.]+)(.*)$/);
  if (!m) return { num: 0, prefix: "", suffix: raw, decimals: 0 };
  const numStr = m[2].replace(/,/g, "");
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
  return { num: parseFloat(numStr), prefix: m[1], suffix: m[3], decimals };
}

interface CountUpProps {
  value: string;
  duration?: number;
  className?: string;
}

export function CountUp({ value, duration = 1600, className }: CountUpProps) {
  const { num, prefix, suffix, decimals } = parse(value);
  const [display, setDisplay] = useState("0");
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();

          const tick = (now: number) => {
            const t = Math.min((now - startTime) / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - t, 3);
            const current = eased * num;

            if (decimals > 0) {
              setDisplay(current.toFixed(decimals));
            } else if (current >= 1000) {
              setDisplay(Math.floor(current).toLocaleString());
            } else {
              setDisplay(Math.floor(current).toString());
            }

            if (t < 1) requestAnimationFrame(tick);
            else {
              // Final exact value
              setDisplay(
                decimals > 0
                  ? num.toFixed(decimals)
                  : num >= 1000
                  ? num.toLocaleString()
                  : num.toString()
              );
            }
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.6 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [num, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}
