"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DOMAINS, type DomainKey } from "@/data/quizQuestions";
import type { Role } from "@/data/quizQuestions";
import { RotateCcw, Map, Sparkles, ArrowRight, Trophy } from "lucide-react";
import { PageBackground } from "@/components/layout";
import { QuizNav } from "./QuizNav";
import { QuizPanel } from "./QuizPanel";

interface ResultData {
  role: Role;
  domainScores: Record<DomainKey, number>;
  matchPct: number;
  secondRole: Role;
  secondPct: number;
}

interface Props {
  result: ResultData;
  onRetake: () => void;
}

function ScoreBar({ domainKey, value, delay }: { domainKey: DomainKey; value: number; delay: number }) {
  const [width, setWidth] = useState(0);
  const domain = DOMAINS[domainKey];

  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-[12px] text-white/55 shrink-0">{domain.label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,200,255,0.25)]"
          style={{ width: `${width}%`, backgroundColor: domain.color }}
        />
      </div>
      <span className="text-[12px] font-semibold text-white/70 w-9 text-right shrink-0">{value}%</span>
    </div>
  );
}

function CareerCard({ role, pct, isTop }: { role: Role; pct: number; isTop: boolean }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-6 flex flex-col gap-4",
      isTop
        ? "border-brand-500/35 bg-brand-500/8 shadow-[0_0_40px_rgba(0,200,255,0.08)]"
        : "border-white/10 bg-white/4",
    )}>
      {isTop && (
        <div
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,200,255,0.25) 0%, transparent 65%)", filter: "blur(40px)" }}
        />
      )}

      {/* Badge + pct */}
      <div className="relative flex items-start justify-between gap-3">
        <span className={cn(
          "text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border",
          isTop
            ? "bg-brand-500/20 text-brand-300 border-brand-500/30"
            : "bg-white/8 text-white/45 border-white/10",
        )}>
          {isTop ? "Best Match" : "Strong Match"}
        </span>
        <span className={cn("text-[24px] font-bold tabular-nums", isTop ? "text-brand-400" : "text-white/60")}>
          {pct}%
          <span className="text-[11px] font-normal text-white/30 ml-1">match</span>
        </span>
      </div>

      {/* Emoji + title */}
      <div className="relative">
        <div className="text-3xl mb-2">{role.emoji}</div>
        <h3 className="text-[18px] font-semibold leading-snug text-white">{role.title}</h3>
        <p className="mt-2 text-[12px] text-white/45 leading-relaxed line-clamp-3">{role.desc}</p>
      </div>

      {/* Courses */}
      <div className="relative flex flex-col gap-1.5">
        {role.courses.map((c) => (
          <div key={c.name} className="flex items-center gap-2">
            <span className="text-[14px]">{c.icon}</span>
            <span className="text-[12px] text-white/55 truncate">{c.name}</span>
            <span className="ml-auto shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-white/6 border border-white/10 text-white/40">
              {c.level}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/courses"
        className={cn(
          "relative mt-auto w-full py-3 rounded-xl text-[14px] font-semibold text-center transition-all duration-200 flex items-center justify-center gap-2",
          isTop
            ? "bg-brand-500 text-ink-950 hover:bg-brand-400 shadow-[0_4px_20px_rgba(0,200,255,0.28)] hover:shadow-[0_4px_30px_rgba(0,200,255,0.45)]"
            : "bg-white/8 text-white border border-white/10 hover:bg-white/14",
        )}
      >
        Enroll Now
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function QuizResult({ result, onRetake }: Props) {
  const { role, domainScores, matchPct, secondRole, secondPct } = result;

  return (
    <PageBackground variant="rich" className="flex flex-col">
      <QuizNav />

      <main className="flex-1 px-5 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto flex flex-col gap-6 sm:gap-8">

          {/* ── Hero result ── */}
          <QuizPanel>
            <p className="eyebrow eyebrow-dark mb-4">
              <Trophy className="h-3.5 w-3.5" />
              Your Results
            </p>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 text-4xl
                            bg-brand-500/10 border border-brand-500/25 shadow-[0_0_30px_rgba(0,200,255,0.12)]">
              {role.emoji}
            </div>
            <h1 className="text-[28px] sm:text-[38px] font-semibold leading-[1.15] tracking-tight">
              <span className="text-shimmer">You are a great match for</span>
              <br />
              <span className="text-white">{role.title}!</span>
            </h1>
            <p className="mt-4 text-[14px] text-white/50 max-w-lg leading-relaxed">
              Based on your answers, here are the best career paths for you — plus a step-by-step roadmap and Avatar courses to get you started.
            </p>
          </QuizPanel>

          {/* ── Domain score bars ── */}
          <QuizPanel padding={false}>
            <div className="p-8 sm:p-10">
              <h2 className="text-[14px] font-semibold text-white/70 mb-5 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-400" />
                Your Scores Across Career Domains
              </h2>
              <div className="flex flex-col gap-3.5">
                {(Object.keys(domainScores) as DomainKey[]).map((k, i) => (
                  <ScoreBar key={k} domainKey={k} value={domainScores[k]} delay={150 + i * 100} />
                ))}
              </div>
            </div>
          </QuizPanel>

          {/* ── Career match cards ── */}
          <div className="grid sm:grid-cols-2 gap-4">
            <CareerCard role={role}       pct={matchPct}  isTop={true}  />
            <CareerCard role={secondRole} pct={secondPct} isTop={false} />
          </div>

          {/* ── Career roadmap ── */}
          <QuizPanel padding={false}>
            <div className="p-8 sm:p-10">
              <h2 className="text-[14px] font-semibold text-white/70 mb-5 flex items-center gap-2">
                <Map className="h-4 w-4 text-brand-400" />
                Your Career Roadmap — {role.title}
              </h2>
              <div className="relative flex flex-col gap-0">
                {role.roadmap.map((step, i) => (
                  <div key={step} className="flex gap-4 items-start pb-5 last:pb-0 relative">
                    {i < role.roadmap.length - 1 && (
                      <div className="absolute left-[13px] top-7 bottom-0 w-px bg-brand-500/15" />
                    )}
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-500/15 border border-brand-500/35 flex items-center justify-center text-[11px] font-bold text-brand-300 z-10 shadow-[0_0_12px_rgba(0,200,255,0.15)]">
                      {i + 1}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[14px] font-semibold text-white/85">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </QuizPanel>

          {/* ── Retake ── */}
          <div className="pt-1 text-center sm:text-left">
            <button
              onClick={onRetake}
              className="inline-flex items-center gap-2 text-[13px] font-medium px-5 py-3 rounded-full border border-white/15 text-white/50 hover:text-white hover:border-brand-500/30 hover:bg-brand-500/6 transition-all duration-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retake Quiz
            </button>
          </div>

        </div>
      </main>
    </PageBackground>
  );
}
