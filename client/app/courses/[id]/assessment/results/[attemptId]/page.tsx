"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AssessmentResultView } from "@/components/assessment/AssessmentResultView";
import { useAssessmentResult } from "@/hooks/queries/useAssessmentResult";
import { useAppSelector } from "@/store/hooks";

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

export default function AssessmentResultPage({ params }: PageProps) {
  const { id, attemptId } = use(params);
  const router = useRouter();
  const { user: authUser } = useAppSelector((s) => s.auth);

  const { data: result, isLoading, isError, error } = useAssessmentResult(attemptId);

  if (!authUser) {
    router.replace("/login");
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen mt-8 bg-slate-50">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm mb-6">
            <Link
              href={`/courses/${id}/learn`}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ChevronLeft size={14} />
              Back to course
            </Link>
          </div>

          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-red-500">
                {(error as any)?.response?.data?.message ?? "Failed to load results."}
              </p>
            </div>
          )}

          {result && <AssessmentResultView result={result} />}
        </div>
      </main>
      <Footer />
    </>
  );
}
