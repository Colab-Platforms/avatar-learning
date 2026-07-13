"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const HEIGHT_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function usePretextHeight(
  text: string | undefined,
  font: string = "13px Inter",
  lineHeight: number = 20,
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].target.clientWidth);
      }
    });
    observer.observe(ref.current);
    setWidth(ref.current.clientWidth);
    return () => observer.disconnect();
  }, []);

  const height = useMemo(() => {
    if (!isClient || !text || width <= 0) return 0;
    try {
      // @ts-ignore
      const { prepare, layout } = require("@chenglou/pretext");
      const prepared = prepare(text, font);
      const res = layout(prepared, width, lineHeight);
      return res.height;
    } catch (e) {
      console.warn("Pretext layout failed", e);
      return 0;
    }
  }, [text, width, font, lineHeight, isClient]);

  return [ref, height] as const;
}

interface PretextAnimatedHeightProps {
  text: string | undefined;
  font?: string;
  lineHeight?: number;
  children: React.ReactNode;
  className?: string;
}

export default function PretextAnimatedHeight({
  text,
  font = "13px Inter",
  lineHeight = 20,
  children,
  className,
}: PretextAnimatedHeightProps) {
  const [ref, height] = usePretextHeight(text, font, lineHeight);

  return (
    <div
      ref={ref}
      style={{
        height: height > 0 ? `${height}px` : "auto",
        transition: `height 0.3s ${HEIGHT_EASE}`,
      }}
      className={`overflow-hidden ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

interface AnimatedHeightProps {
  children: React.ReactNode;
  className?: string;
  durationMs?: number;
}

export function AnimatedHeight({
  children,
  className,
  durationMs = 320,
}: AnimatedHeightProps) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;

    const updateHeight = () => {
      setHeight(node.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div
      style={{
        height: `${height}px`,
        transition: `height ${durationMs}ms ${HEIGHT_EASE}`,
      }}
      className={`overflow-hidden ${className ?? ""}`}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
