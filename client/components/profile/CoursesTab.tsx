import Link from "next/link";
import { BookOpen, BadgeCheck } from "lucide-react";
import type { MyEnrollment } from "@/lib/coursesApi";
import { TabPanel, PanelHeader } from "./shared";

export function CoursesTab({ enrollments }: { enrollments: MyEnrollment[] }) {
  return (
    <TabPanel>
      <PanelHeader icon={<BookOpen className="h-3.5 w-3.5 text-brand-600" />} title="My Enrolled Courses" />

      {enrollments.length === 0 ? (
        <div className="py-16 text-center px-4">
          <BookOpen className="h-10 w-10 text-text-subtle mx-auto mb-3" />
          <p className="text-[14px] text-text-muted">No courses enrolled yet.</p>
          <Link href="/courses"
            className="mt-3 inline-block text-[13px] text-brand-600 hover:text-brand-700 transition-colors">
            Browse courses →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {enrollments.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-surface-alt transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0 basis-[calc(100%-3.25rem)] sm:basis-auto">
                <p className="text-sm font-semibold text-text truncate">{e.course.title}</p>
                <p className="text-[11px] text-text-subtle mt-0.5">
                  Enrolled {new Date(e.enrolledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {e.isCompleted && (
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                  <BadgeCheck className="h-3 w-3" /> Completed
                </span>
              )}
              <Link
                href={`/courses/${e.course.slug}/learn`}
                className="shrink-0 ml-auto sm:ml-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
              >
                Continue →
              </Link>
            </div>
          ))}
        </div>
      )}
    </TabPanel>
  );
}
