"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowRight, Award, CheckCircle2, Loader2, Lock } from "lucide-react";
import { useLearnCourse } from "@/hooks/queries/useLearnCourse";
import { downloadCourseCertificate } from "@/lib/coursesApi";
import { basicCourseRoutes } from "@/lib/dashboardRoutes";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default function BasicCertificatePage({ params }: PageProps) {
  const { courseId } = use(params);
  const { data: course, isLoading } = useLearnCourse(courseId);
  const [downloading, setDownloading] = useState(false);
  const routes = basicCourseRoutes(courseId);

  const handleDownload = async () => {
    if (!course) return;
    setDownloading(true);
    try {
      await downloadCourseCertificate(
        course.id,
        `Certificate - ${course.title}.pdf`,
      );
    } catch {
      window.alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading || !course) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const isCompleted = course.enrollment.isCompleted;
  const progressPct = course.enrollment.progress ?? 0;

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6 text-slate-800">
      <header className="text-left">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Certification
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          {course.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete every session in the course to unlock your certificate.
        </p>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-5">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              isCompleted
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <Award size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              {isCompleted
                ? "Congratulations — your certificate is ready!"
                : "Certificate locked"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isCompleted
                ? "You've finished every session. Download your certificate below."
                : `You're ${progressPct}% through the course. Finish the remaining sessions to unlock your certificate.`}
            </p>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  isCompleted ? "bg-emerald-500" : "bg-blue-500"
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, progressPct))}%`,
                }}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {isCompleted && course.certificate ? (
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Award size={16} />
                  )}
                  {downloading ? "Preparing…" : "Download Certificate"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed"
                >
                  <Lock size={14} /> Download Certificate
                </button>
              )}
              <Link
                href={routes.learn}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {isCompleted ? "Review Course" : "Continue Learning"}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isCompleted && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-5 py-4 flex items-center gap-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="shrink-0" />
          <p>
            You can download this certificate as often as you like — it lives
            here permanently.
          </p>
        </div>
      )}
    </div>
  );
}
