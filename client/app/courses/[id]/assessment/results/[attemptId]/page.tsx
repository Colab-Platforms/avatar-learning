"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LearningRouteProvider } from "@/components/learning/LearningRouteContext";
import { AssessmentResultsView } from "@/components/learning/AssessmentResultsView";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";
import { useAppSelector } from "@/store/hooks";
import { d2hLearningRoutes } from "@/lib/learningRoutes";

interface PageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

export default function PublicAssessmentResultsPage({ params }: PageProps) {
  const { id, attemptId } = use(params);
  const router = useRouter();
  const { user: authUser, hasHydrated } = useAppSelector((s) => s.auth);
  const { data: d2hStatus, isLoading: d2hLoading } = useD2HStatus({
    enabled: hasHydrated && Boolean(authUser),
  });
  const inD2H = !!d2hStatus?.courses.some((c) => c.id === id);

  useEffect(() => {
    if (!hasHydrated || d2hLoading) return;
    if (inD2H) {
      router.replace(d2hLearningRoutes(id).results(attemptId));
    }
  }, [hasHydrated, d2hLoading, inD2H, id, attemptId, router]);

  if (!hasHydrated || (authUser && d2hLoading) || inD2H) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen mt-8 bg-slate-50">
        <LearningRouteProvider courseId={id} scope="public">
          <AssessmentResultsView courseId={id} attemptId={attemptId} />
        </LearningRouteProvider>
      </main>
      <Footer />
    </>
  );
}
