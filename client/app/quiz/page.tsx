import type { Metadata } from "next";
import { QuizShell } from "@/components/quiz/QuizShell";

export const metadata: Metadata = {
  title: "Career Quiz — Find Your AI Path | Avatar India",
  description: "Answer 10 quick questions and get a personalised AI career roadmap tailored to your goals.",
};

export default function QuizPage() {
  return <QuizShell />;
}
