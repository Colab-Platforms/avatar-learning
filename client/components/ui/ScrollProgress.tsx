"use client";

import { useEffect, useState } from "react";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-[100] h-[2px] bg-transparent pointer-events-none">
      <div
        className="h-full rounded-full"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #2F7BFF 0%, #7c5fff 60%, #5c95ff 100%)",
          boxShadow: "0 0 8px rgba(47,123,255,0.7), 0 0 20px rgba(47,123,255,0.3)",
          transition: "width 0.08s linear",
        }}
      />
    </div>
  );
}
