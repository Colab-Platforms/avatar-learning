"use client";

import { useEffect, useState, type CSSProperties } from "react";

const TYPE_SPEED = 80;
const DELETE_SPEED = 45;
const PAUSE_AFTER_TYPE = 1600;
const PAUSE_AFTER_DELETE = 300;

interface CyclingTextProps {
  words: string[];
  style?: CSSProperties;
  className?: string;
  cursorClassName?: string;
}

export function CyclingText({ words, style, className, cursorClassName }: CyclingTextProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(words[0]?.length ?? 0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (words.length === 0) return;
    const currentWord = words[wordIndex];

    if (!deleting && subIndex === currentWord.length) {
      const t = setTimeout(() => setDeleting(true), PAUSE_AFTER_TYPE);
      return () => clearTimeout(t);
    }

    if (deleting && subIndex === 0) {
      const t = setTimeout(() => {
        setDeleting(false);
        setWordIndex((i) => (i + 1) % words.length);
      }, PAUSE_AFTER_DELETE);
      return () => clearTimeout(t);
    }

    const t = setTimeout(
      () => setSubIndex((s) => s + (deleting ? -1 : 1)),
      deleting ? DELETE_SPEED : TYPE_SPEED
    );
    return () => clearTimeout(t);
  }, [subIndex, deleting, wordIndex, words]);

  const currentWord = words[wordIndex] ?? "";

  return (
    <span className="inline-flex items-baseline">
      <span style={style} className={className}>
        {currentWord.slice(0, subIndex)}
      </span>
      <span
        aria-hidden
        className={cursorClassName ?? "ml-1 inline-block w-[3px] h-[0.8em] bg-blue-600 align-middle"}
        style={{ animation: "cursor-blink 0.9s steps(1) infinite" }}
      />
    </span>
  );
}
