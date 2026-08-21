"use client";

import React from "react";
import { useWebinarLiveSchedule } from "@/hooks/queries/useWebinarLiveSchedule";

function formatShort(date: Date) {
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
}

function formatLong(date: Date) {
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) + " IST";
}

export default function HeaderBanner() {
  const { data: schedule } = useWebinarLiveSchedule();
  const scheduledDate = schedule ? new Date(schedule.scheduledAt) : null;

  return (
    <div className="bg-[#1C1F22] text-[#E5E7EB] text-xs py-2 px-4 text-center font-medium border-b border-white/5 relative overflow-hidden flex items-center justify-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
      </span>
      {/* Mobile Text */}
      <span className="sm:hidden text-[11px] tracking-wide">
        Live workshop
        {scheduledDate && <> &middot; {formatShort(scheduledDate)}</>}
        {" "}&middot; <span className="text-red-400 font-semibold">47 seats left</span>
      </span>
      {/* Desktop Text */}
      <span className="hidden sm:inline tracking-wider">
        Live online workshop
        {scheduledDate && (
          <>
            {" "}&middot; {formatLong(scheduledDate)} &middot; {formatTime(scheduledDate)}
          </>
        )}
        {" "}&middot; <span className="text-red-400 font-semibold">47 seats left</span>
      </span>
    </div>
  );
}
