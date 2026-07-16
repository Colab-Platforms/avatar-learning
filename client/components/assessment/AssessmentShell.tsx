"use client";

import { Clock, ShieldAlert, Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { CountdownTimer } from "./CountdownTimer";

export function AssessmentShell({
  courseTitle,
  deadline,
  tabSwitchCount,
  maxTabSwitchWarnings,
  onExpire,
  children,
  enableFullscreen = true,
}: {
  courseTitle: string;
  deadline: string;
  tabSwitchCount: number;
  maxTabSwitchWarnings: number;
  onExpire: () => void;
  children: React.ReactNode;
  /** When false, skips auto-fullscreen and hides the fullscreen toggle (used by Placement). */
  enableFullscreen?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsBlocked, setFsBlocked] = useState(false);

  const isViolationWarning = tabSwitchCount > 0;
  const isViolationDanger = tabSwitchCount >= Math.max(1, maxTabSwitchWarnings - 1);

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen();
    } catch {
      setFsBlocked(true);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if ((document as any).webkitFullscreenElement) await (document as any).webkitExitFullscreen();
    } catch {
      // ignore
    }
  }, []);

  // Enter fullscreen on mount (course assessments only)
  useEffect(() => {
    if (!enableFullscreen) return;
    enterFullscreen();
    return () => {
      exitFullscreen();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableFullscreen]);

  // Track fullscreen state changes
  useEffect(() => {
    if (!enableFullscreen) return;
    const handleChange = () => {
      const inFs =
        !!document.fullscreenElement ||
        !!(document as any).webkitFullscreenElement;
      setIsFullscreen(inFs);
    };
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, [enableFullscreen]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-50 flex flex-col"
      style={{ minHeight: "100dvh" }}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          {/* Left — live indicator + title */}
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5 hidden sm:block">
                Assessment in progress
              </p>
              <p className="text-sm font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-xs md:max-w-none">
                {courseTitle}
              </p>
            </div>
          </div>

          {/* Right — violations + timer + fullscreen toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Tab switches badge */}
            {tabSwitchCount > 0 && (
              <div
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                  isViolationDanger
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                <ShieldAlert size={13} />
                {tabSwitchCount}/{maxTabSwitchWarnings} violations
              </div>
            )}

            {/* Countdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
              <Clock size={14} className="text-slate-500 shrink-0" />
              <CountdownTimer deadline={deadline} onExpire={onExpire} />
            </div>

            {/* Fullscreen toggle — course assessments only */}
            {enableFullscreen && !fsBlocked && (
              <button
                type="button"
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            )}
          </div>
        </div>

        {/* Violation sub-bar (mobile) */}
        {isViolationWarning && (
          <div
            className={`sm:hidden px-4 py-1.5 flex items-center gap-1.5 text-xs font-medium ${
              isViolationDanger ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            <ShieldAlert size={12} />
            Tab switches: {tabSwitchCount}/{maxTabSwitchWarnings}
          </div>
        )}

        {/* Fullscreen blocked notice */}
        {enableFullscreen && fsBlocked && (
          <div className="px-4 py-1.5 flex items-center gap-1.5 text-xs font-medium bg-slate-50 text-slate-500 border-t border-slate-100">
            <Maximize2 size={12} />
            Fullscreen unavailable in this browser — please avoid switching tabs.
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex min-h-0 max-w-7xl mx-auto w-full">
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
