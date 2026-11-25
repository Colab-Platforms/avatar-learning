import type { Metadata } from "next";
import { QuizShell } from "@/components/quiz/QuizShell";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Career Quiz — Find Your AI Path | Avatar Learning",
  description: "Answer 10 quick questions and get a personalised AI career roadmap tailored to your goals.",
  path: "/quiz",
});

export default function QuizPage() {
  return <QuizShell />;
}
