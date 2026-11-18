import type { CSSProperties } from "react";
import s from "./learnAdopt.module.css";

export type RevealKind = "words" | "eyebrow" | "zoom" | "left" | "right" | "tilt";
/** Heading treatments: "move" = sliding/drifting words (top sections only). */
export type HeadingFx = "move" | "blur" | "flip" | "wipe" | "rise";

/** Props that opt an element into the scroll reveal. `i` staggers siblings. */
export function rv(i = 0, kind?: RevealKind, fx?: HeadingFx) {
  return {
    "data-reveal": kind ?? "",
    ...(fx ? { "data-fx": fx } : {}),
    style: { "--i": i } as CSSProperties,
  };
}

/**
 * Splits a phrase into per-word spans so headings can slide in word by word.
 * The rendered text (words and spaces) is unchanged; `from` continues the
 * stagger count across adjacent <Words> in the same heading.
 */
export function Words({ text, from = 0 }: { text: string; from?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          <span className={s.w} style={{ "--w": from + i } as CSSProperties}>
            <span>{w}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}
