"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrgencyBannerProps {
  className?: string;
  variant?: "hero" | "compact";
}

export function UrgencyBanner({
  className,
  variant = "hero",
}: UrgencyBannerProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-1.5 text-[11.5px] font-semibold text-amber-800 shadow-2xs",
          className,
        )}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <Flame className="h-3.5 w-3.5 shrink-0 text-amber-600 fill-amber-500" />
        <span>Limited Offer: 98% OFF ends soon</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-3 inline-flex items-center gap-2.5 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50 via-orange-50/80 to-amber-50 px-3.5 py-2 text-[12px] sm:text-[13px] text-amber-900 shadow-2xs w-full sm:w-fit",
        className,
      )}
    >
      {/* <span className="relative flex h-2 w-2 shrink-0"> */}
      {/* <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" /> */}
      {/* </span> */}
      <div className="flex items-center gap-1.5 flex-wrap text-left">
        <span className="inline-flex items-center gap-1 font-bold text-amber-950 bg-amber-200/70 px-2 py-0.5 rounded-md text-[11px] sm:text-[11.5px] tracking-wide uppercase">
          <Flame className="h-3.5 w-3.5 text-amber-600 fill-amber-500 shrink-0" />
          Hurry Up
        </span>

        <span className="font-medium text-amber-900">
          Unlock 96% discount Before price Returns to ₹24,999
        </span>
      </div>
    </div>
  );
}
