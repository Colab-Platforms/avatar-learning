"use client";

import { useState } from "react";
import { QUIZ_QUESTIONS, computeResult } from "@/data/quizQuestions";
import { QuizQuestion } from "./QuizQuestion";
import { QuizResult } from "./QuizResult";
import { QuizNav } from "./QuizNav";

// answers stores string[] per question (single-select = 1-item array)
export function QuizShell() {
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const total    = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[current];
  const selected = answers[question.id] ?? [];
  const progress  = Math.round((Object.keys(answers).length / total) * 100);

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
    <div className="min-h-screen bg-ink-950 text-white flex flex-col">
      <QuizNav />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-16 sm:py-20">
        <div className="w-full max-w-2xl">
          <QuizQuestion
            question={question}
            selected={selected}
            onToggle={handleToggle}
            current={current}
            total={total}
            progress={progress}
            onNext={handleNext}
            onBack={handleBack}
          />
        </div>
      </main>
    </div>
  );
}
