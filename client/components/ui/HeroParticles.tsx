"use client";

import { useEffect, useState } from "react";

interface Particle {
  x: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  hue: number; // slight hue variation for variety
}

export function HeroParticles({ count = 22 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }, () => ({
        x: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 10 + Math.random() * 12,
        size: 1 + Math.random() * 2.5,
        opacity: 0.06 + Math.random() * 0.20,
        hue: Math.random() > 0.6 ? 220 : 250, // blue vs purple
      }))
    );
  }, [count]);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: `${p.x}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            background: `hsl(${p.hue}, 90%, 70%)`,
            animation: `float-up ${p.duration}s ease-in ${p.delay}s infinite`,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}
