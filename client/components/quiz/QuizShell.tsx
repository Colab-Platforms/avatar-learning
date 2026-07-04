"use client";

import { useState } from "react";
import { QUIZ_QUESTIONS, computeResult } from "@/data/quizQuestions";
import { Navbar } from "@/components/layout/Navbar";
import { QuizQuestion } from "./QuizQuestion";
import { QuizResult } from "./QuizResult";
import { QuizPanel } from "./QuizPanel";
import { Brain } from "lucide-react";

// answers stores string[] per question (single-select = 1-item array)
export function QuizShell() {
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const total    = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[current];
  const selected = answers[question.id] ?? [];

  function handleToggle(label: string) {
    setAnswers((prev) => {
      const cur = prev[question.id] ?? [];
      if (question.multi) {
        // toggle in/out
        const next = cur.includes(label) ? cur.filter((l) => l !== label) : [...cur, label];
        return { ...prev, [question.id]: next };
      } else {
        // single-select: always replace
        return { ...prev, [question.id]: [label] };
      }
    });
  }

  function handleNext() {
    if (current < total - 1) {
      setCurrent((c) => c + 1);
    } else {
      setSubmitted(true);
    }
  }

  function handleBack() {
    if (current > 0) setCurrent((c) => c - 1);
  }

  function handleRetake() {
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
  }

  if (submitted) {
    const result = computeResult(answers);
    return <QuizResult result={result} onRetake={handleRetake} />;
  }

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-5 pt-28 pb-12 sm:pb-16">
        <div className="w-full max-w-3xl flex flex-col gap-6 sm:gap-8">
          <div className="text-center">
            <p className="eyebrow justify-center mb-3">
              <Brain className="h-3.5 w-3.5" />
              Career Path Quiz
            </p>
            <h2 className="text-[22px] sm:text-[28px] font-semibold tracking-tight text-text">
              Discover your AI career path
            </h2>
          </div>

          <QuizPanel>
            <QuizQuestion
            question={question}
            selected={selected}
            onToggle={handleToggle}
            current={current}
            total={total}
            onNext={handleNext}
            onBack={handleBack}
            />
          </QuizPanel>
        </div>
      </main>
    </div>
  );
}
