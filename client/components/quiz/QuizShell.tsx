"use client";

import { useEffect, useRef, useState } from "react";
import { QUIZ_QUESTIONS, computeResult, DOMAINS } from "@/data/quizQuestions";
import { Navbar } from "@/components/layout/Navbar";
import { QuizQuestion } from "./QuizQuestion";
import { QuizResult } from "./QuizResult";
import { QuizPanel } from "./QuizPanel";
import { QuizLoginModal } from "./QuizLoginModal";
import { Brain } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useCompleteQuiz } from "@/hooks/mutations/useCompleteQuiz";
import { trackCareerQuizEvent } from "@/lib/analytics/careerQuizAnalytics";

// answers stores string[] per question (single-select = 1-item array)
export function QuizShell() {
  const { user, hasHydrated } = useAppSelector((s) => s.auth);
  const { mutate: persistQuizCompletion } = useCompleteQuiz();
  const persistedForUserRef = useRef<string | null>(null);
  const completedAsGuestRef = useRef(false);

  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const total = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[current];
  const selected = answers[question.id] ?? [];

  // Persist completion once results are visible for an authenticated user.
  // Does not change quiz UX — only syncs status for the marketing prompt.
  useEffect(() => {
    if (!submitted || !user) return;
    if (persistedForUserRef.current === user.id) return;

    const result = computeResult(answers);
    persistedForUserRef.current = user.id;

    if (completedAsGuestRef.current) {
      trackCareerQuizEvent("login_after_quiz");
      completedAsGuestRef.current = false;
    }

    const answersWithQuestions: Record<
      number,
      { question: string; selected: string[] }
    > = {};
    for (const q of QUIZ_QUESTIONS) {
      answersWithQuestions[q.id] = {
        question: q.title,
        selected: answers[q.id] ?? [],
      };
    }

    persistQuizCompletion({
      primaryCareerDomain: DOMAINS[result.role.domain].label,
      secondaryCareerDomain: DOMAINS[result.secondRole.domain].label,
      recommendedCareer: result.role.title,
      matchPercentage: result.matchPct,
      answers: answersWithQuestions,
      domainScores: result.domainScores,
    });
  }, [submitted, user, answers, persistQuizCompletion]);

  function handleToggle(label: string) {
    setAnswers((prev) => {
      const cur = prev[question.id] ?? [];
      if (question.multi) {
        // toggle in/out
        const next = cur.includes(label)
          ? cur.filter((l) => l !== label)
          : [...cur, label];
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
      return;
    }

    if (!hasHydrated) return;

    if (!user) {
      completedAsGuestRef.current = true;
      setShowLoginModal(true);
      return;
    }

    setSubmitted(true);
  }

  function handleBack() {
    if (current > 0) setCurrent((c) => c - 1);
  }

  function handleRetake() {
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
    persistedForUserRef.current = null;
    completedAsGuestRef.current = false;
  }

  function handleLoginModalClose() {
    setShowLoginModal(false);
    // If they logged in successfully, reveal the result now.
    if (user) setSubmitted(true);
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

      <QuizLoginModal isOpen={showLoginModal} onClose={handleLoginModalClose} />
    </div>
  );
}
