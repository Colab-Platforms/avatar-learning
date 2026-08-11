"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

// sticky.png natural size 923x1024
const IMG_W = 923;
const IMG_H = 1024;

// Where it naturally sits relative to the slideshow's top
const ANCHOR_OFFSET_FROM_SLIDESHOW_TOP = 20;
// Where it pins once scrolled past that point (below navbar/offer bar).
const PIN_TOP = 120;
const BOTTOM_PADDING = 16;

function useStickyPosition() {
  const [state, setState] = useState<{
    top: number;
    left?: number;
    right?: number;
    hidden: boolean;
    displayW: number;
    displayH: number;
  } | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const update = () => {
      const slideshow = document.getElementById("d2h-slideshow");
      const boundarySec = document.getElementById("what-you-get");
      if (!slideshow || !boundarySec) return;

      const slideshowRect = slideshow.getBoundingClientRect();
      const boundaryRect = boundarySec.getBoundingClientRect();

      // Determine width dynamically based on viewport width
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        setState({
          top: 0,
          hidden: true,
          displayW: 0,
          displayH: 0,
        });
        return;
      }

      const displayW = 360;
      const displayH = Math.round((IMG_H / IMG_W) * displayW);

      // Vertical calculation
      const naturalTop = slideshowRect.top + ANCHOR_OFFSET_FROM_SLIDESHOW_TOP;
      const stuckTop = Math.max(naturalTop, PIN_TOP);
      const bottomLimit = boundaryRect.bottom - displayH - BOTTOM_PADDING;
      const top = Math.min(stuckTop, bottomLimit);

      // Horizontal calculation
      let left: number | undefined = undefined;
      let right: number | undefined = undefined;

      // Place it overlapping the right side of the slideshow container
      left = slideshowRect.right - (displayW * 0.45);
      // Make sure it doesn't go off the screen on smaller desktop views
      if (left + displayW > window.innerWidth) {
        left = undefined;
        right = 16;
      }

      setState({
        top,
        left,
        right,
        hidden: bottomLimit < -displayH,
        displayW,
        displayH,
      });
    };

    update();
    const onScrollOrResize = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = undefined;
        update();
      });
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return state;
}

export function StickyMemoSticker() {
  const pos = useStickyPosition();

  if (!pos || pos.hidden) return null;

  return (
    <div
      className="fixed z-50 flex flex-col items-end gap-2"
      style={{
        top: pos.top,
        ...(pos.left !== undefined ? { left: pos.left } : { right: pos.right }),
      }}
    >
      <Link href="/direct2hire/assessment-counselling" className="block cursor-pointer">
        <motion.div
          animate={{
            y: [0, -6, 0],
            rotate: [-4, -1, -4],
          }}
          transition={{
            y: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
          }}
          whileHover={{ scale: 1.06, rotate: 0 }}
          whileTap={{ scale: 0.94 }}
          style={{ width: pos.displayW, height: pos.displayH }}
          className="relative filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]"
        >
          <Image
            src="/Direct2hire/sticky.png"
            alt="Assessment + Counselling"
            width={pos.displayW}
            height={pos.displayH}
            className="w-full h-full object-contain"
            priority
            unoptimized
          />
        </motion.div>
      </Link>
    </div>
  );
}

