"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LearningRouteProvider } from "@/components/learning/LearningRouteContext";
import { AssessmentHistoryView } from "@/components/learning/AssessmentHistoryView";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";
import { useAppSelector } from "@/store/hooks";
import { d2hLearningRoutes } from "@/lib/learningRoutes";

interface PageProps {
  params: Promise<{ id: string; assessmentId: string }>;
}

export default function PublicAssessmentHistoryPage({ params }: PageProps) {
  const { id, assessmentId } = use(params);
  const router = useRouter();
  const { user: authUser, hasHydrated } = useAppSelector((s) => s.auth);
  const { data: d2hStatus, isLoading: d2hLoading } = useD2HStatus({
    enabled: hasHydrated && Boolean(authUser),
  });
  const inD2H = !!d2hStatus?.courses.some((c) => c.id === id);

  useEffect(() => {
    if (!hasHydrated || d2hLoading) return;
    if (inD2H) {
      router.replace(d2hLearningRoutes(id).assessmentHistory(assessmentId));
    }
  }, [hasHydrated, d2hLoading, inD2H, id, assessmentId, router]);

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
          <AssessmentHistoryView courseId={id} assessmentId={assessmentId} />
        </LearningRouteProvider>
      </main>
      <Footer />
    </>
  );
}
