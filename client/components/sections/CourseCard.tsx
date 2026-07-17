"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Zap } from "lucide-react";
import type { Course } from "@/types";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const router = useRouter();

  const handleEnroll = () => {
    router.push(`/courses/${course.slug}`);
  };

  // Use heroImage if available, else fallback to first module image
  const coverImage =
    course.heroImage || course.modules?.[0]?.image || "/placeholder.jpg";

  return (
    <article
      onClick={handleEnroll}
      className="group/card relative rounded-2xl border border-border bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full card-lift"
    >
      {/* ── Top Half: Image ── */}
      <div className="relative h-[200px] w-full overflow-hidden bg-surface-sunken">
        <Image
          src={coverImage}
          alt={course.title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          quality={100}
          className="object-cover transition-transform duration-500 group-hover/card:scale-105"
        />

        {/* Avatar / Watermark marker (top left) */}
        <div className="absolute top-0 left-4 bg-white px-2.5 py-4 rounded-b-xl shadow-sm flex items-center justify-center z-10">
          <div className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-sm border border-brand-100">
            AL
          </div>
        </div>

        {/* Badge (bottom right) */}
        <div className="absolute bottom-3 right-3 bg-brand-600 text-white text-[11px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full shadow-sm z-10">
          {course.level}
        </div>
      </div>

      {/* ── Bottom Half: Content ── */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-5 rounded bg-brand-50 border border-brand-100 flex items-center justify-center overflow-hidden">
            <span className="text-[10px] font-bold text-brand-600">AL</span>
          </div>
          <span className="text-sm text-text-muted font-medium">
            Avatar Learning
          </span>
        </div>

        <h3 className="text-lg font-bold text-text leading-tight mb-2 line-clamp-2 group-hover/card:text-brand-600 transition-colors">
          {course.title}
        </h3>

        <p className="text-[14px] text-text-muted mb-4 line-clamp-1">
          {course.weeks} Weeks Specialization
        </p>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-text">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{course.rating || "4.8"}</span>
            <span className="text-text-muted font-normal text-xs ml-1">
              ({course.reviews || "1.2k"})
            </span>
          </div>

          {course.free && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              FREE
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
